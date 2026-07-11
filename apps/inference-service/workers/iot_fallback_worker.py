import asyncio
import json
import logging
from datetime import datetime
from upstash_redis.asyncio import Redis

# Asumiendo que el config de core expone el URL
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("IoTFallbackWorker")

STREAM_NAME = "iot.shipment.events"
CONSUMER_GROUP = "ml_inference_group"
CONSUMER_NAME = "worker_1"

async def process_iot_message(redis: Redis, message: dict):
    """
    Procesa un mensaje del stream de IoT y actualiza los promedios móviles (EMA).
    """
    try:
        # En upstash-redis el mensaje es usualmente un dict normal (no bytes)
        if 'payload' in message:
            payload = json.loads(message['payload'])
            metadata = json.loads(message.get('metadata', '{}'))
        else:
            payload_str = message
            if 'payload' in payload_str:
                payload = json.loads(payload_str['payload'])
                metadata = json.loads(payload_str.get('metadata', '{}'))
            else:
                return

        tracking_number = metadata.get("tracking_number")
        if not tracking_number:
            return

        current_temp = payload.get("temperature")
        current_hum = payload.get("humidity")
        
        if current_temp is None and current_hum is None:
            return

        live_key = f"iot:stats:{tracking_number}"
        fallback_key = f"iot:fallback:{tracking_number}"
        now = datetime.utcnow().isoformat()

        # Upstash-redis pipelines
        pipe = redis.pipeline()
        
        if current_temp is not None:
            pipe.hset(live_key, "temp_interna_carga_c", float(current_temp))
        if current_hum is not None:
            pipe.hset(live_key, "humedad_interna_carga_pct", float(current_hum))
        pipe.hset(live_key, "timestamp", now)
        pipe.expire(live_key, 7200)

        # Para EMA, necesitamos el valor anterior, lo cual complica hacerlo 100% en pipeline
        # Así que primero leemos y luego lo agregamos al pipeline
        fallback_data = await redis.hgetall(fallback_key) or {}
        alpha = 0.2
        
        if current_temp is not None:
            prev_temp = float(fallback_data.get("avg_temp_c", current_temp))
            new_temp = (float(current_temp) * alpha) + (prev_temp * (1.0 - alpha))
            pipe.hset(fallback_key, "avg_temp_c", f"{new_temp:.2f}")

        if current_hum is not None:
            prev_hum = float(fallback_data.get("avg_humedad_pct", current_hum))
            new_hum = (float(current_hum) * alpha) + (prev_hum * (1.0 - alpha))
            pipe.hset(fallback_key, "avg_humedad_pct", f"{new_hum:.2f}")

        pipe.hset(fallback_key, "last_updated", now)
        pipe.expire(fallback_key, 86400 * 7)

        await pipe.exec()
        logger.debug(f"Updated IoT stats and fallback for {tracking_number}")

    except Exception as e:
        logger.error(f"Error processing IoT message: {e}")

async def run_worker():
    redis = Redis(url=settings.REDIS_URL, token=settings.REDIS_TOKEN)
    
    try:
        # Comando RAW para crear grupo en Upstash
        await redis.execute(["XGROUP", "CREATE", STREAM_NAME, CONSUMER_GROUP, "0", "MKSTREAM"])
        logger.info(f"Consumer group {CONSUMER_GROUP} created.")
    except Exception as e:
        if "BUSYGROUP" in str(e):
            logger.info(f"Consumer group {CONSUMER_GROUP} already exists.")
        else:
            logger.error(f"Error creating consumer group: {e}")
            
    logger.info("Worker started. Listening for IoT events with polling...")
    
    while True:
        try:
            # Comando RAW para xreadgroup sin block
            result = await redis.execute(["XREADGROUP", "GROUP", CONSUMER_GROUP, CONSUMER_NAME, "COUNT", 10, "STREAMS", STREAM_NAME, ">"])
            
            # Format expected from Upstash REST: 
            # [ ["iot.shipment.events", [ ["162...-0", {"payload": "..."}], ... ]] ]
            if result:
                for stream_data in result:
                    stream = stream_data[0]
                    messages = stream_data[1]
                    for msg in messages:
                        msg_id = msg[0]
                        message_data = msg[1]
                        
                        # Formatear el array a dict para la funcion
                        if isinstance(message_data, list):
                            msg_dict = {message_data[i]: message_data[i+1] for i in range(0, len(message_data), 2)}
                        else:
                            msg_dict = message_data
                            
                        await process_iot_message(redis, msg_dict)
                        await redis.execute(["XACK", STREAM_NAME, CONSUMER_GROUP, msg_id])
            
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker shut down.")
