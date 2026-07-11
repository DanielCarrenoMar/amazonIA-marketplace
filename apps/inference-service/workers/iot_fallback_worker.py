import asyncio
import json
import logging
from datetime import datetime
from redis.asyncio import Redis

# Asumiendo que el config de core expone el URL
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("IoTFallbackWorker")

STREAM_NAME = "STREAM_TOPICS.SHIPMENT_EVENTS"
CONSUMER_GROUP = "ml_inference_group"
CONSUMER_NAME = "worker_1"

async def process_iot_message(redis: Redis, message: dict):
    """
    Procesa un mensaje del stream de IoT y actualiza los promedios móviles (EMA).
    """
    try:
        # El payload viene como un dict de strings en Redis Streams
        # Dependiendo de cómo lo envie NestJS, usualmente está bajo la key "payload"
        # o desempaquetado. 
        if b'payload' in message:
            payload = json.loads(message[b'payload'].decode('utf-8'))
            metadata = json.loads(message.get(b'metadata', b'{}').decode('utf-8'))
        else:
            # Si no viene bajo la key 'payload', tratamos de decodificar todo
            # Asumiremos la estructura básica
            payload_str = {k.decode('utf-8'): v.decode('utf-8') for k, v in message.items()}
            if 'payload' in payload_str:
                payload = json.loads(payload_str['payload'])
                metadata = json.loads(payload_str.get('metadata', '{}'))
            else:
                return # No es el formato esperado

        tracking_number = metadata.get("tracking_number")
        if not tracking_number:
            return

        current_temp = payload.get("temperature")
        current_hum = payload.get("humidity")
        
        if current_temp is None and current_hum is None:
            return # No hay telemetría útil

        live_key = f"iot:stats:{tracking_number}"
        fallback_key = f"iot:fallback:{tracking_number}"
        now = datetime.utcnow().isoformat()

        async with redis.pipeline(transaction=True) as pipe:
            # 1. Guardar dato en vivo
            if current_temp is not None:
                pipe.hset(live_key, "temp_interna_carga_c", float(current_temp))
            if current_hum is not None:
                pipe.hset(live_key, "humedad_interna_carga_pct", float(current_hum))
            pipe.hset(live_key, "timestamp", now)
            pipe.expire(live_key, 7200) # 2 horas

            # 2. Calcular Exponential Moving Average (EMA)
            alpha = 0.2
            fallback_data = await redis.hgetall(fallback_key)
            
            if current_temp is not None:
                prev_temp_str = fallback_data.get(b"avg_temp_c", fallback_data.get("avg_temp_c"))
                prev_temp = float(prev_temp_str) if prev_temp_str else float(current_temp)
                new_temp = (float(current_temp) * alpha) + (prev_temp * (1.0 - alpha))
                pipe.hset(fallback_key, "avg_temp_c", f"{new_temp:.2f}")

            if current_hum is not None:
                prev_hum_str = fallback_data.get(b"avg_humedad_pct", fallback_data.get("avg_humedad_pct"))
                prev_hum = float(prev_hum_str) if prev_hum_str else float(current_hum)
                new_hum = (float(current_hum) * alpha) + (prev_hum * (1.0 - alpha))
                pipe.hset(fallback_key, "avg_humedad_pct", f"{new_hum:.2f}")

            pipe.hset(fallback_key, "last_updated", now)
            pipe.expire(fallback_key, 86400 * 7) # 7 días

            await pipe.execute()
            logger.debug(f"Updated IoT stats and fallback for {tracking_number}")

    except Exception as e:
        logger.error(f"Error processing IoT message: {e}")

async def run_worker():
    redis = Redis.from_url(settings.REDIS_URL)
    
    # Crear el grupo de consumidores si no existe
    try:
        await redis.xgroup_create(STREAM_NAME, CONSUMER_GROUP, id="0", mkstream=True)
        logger.info(f"Consumer group {CONSUMER_GROUP} created.")
    except Exception as e:
        if "BUSYGROUP" in str(e):
            logger.info(f"Consumer group {CONSUMER_GROUP} already exists.")
        else:
            logger.error(f"Error creating consumer group: {e}")
            
    logger.info("Worker started. Listening for IoT events...")
    
    while True:
        try:
            # Leer mensajes pendientes para este consumidor o nuevos
            # > indica que queremos mensajes que no han sido asignados a nadie en el grupo
            messages = await redis.xreadgroup(
                CONSUMER_GROUP, 
                CONSUMER_NAME, 
                {STREAM_NAME: ">"}, 
                count=10, 
                block=5000
            )
            
            if messages:
                for stream, msg_list in messages:
                    for msg_id, message_data in msg_list:
                        await process_iot_message(redis, message_data)
                        # Reconocer el mensaje para que no se reenvíe
                        await redis.xack(STREAM_NAME, CONSUMER_GROUP, msg_id)
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker shut down.")
