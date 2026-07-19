import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.logger.log('Conectado a PostgreSQL via pg.Pool');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async getShipmentContextBySensorId(sensorId: string) {
    const res = await this.pool.query(
      'SELECT tracking_number, sensor_profile FROM product_order WHERE sensor_id = $1',
      [sensorId]
    );
    if (res.rows.length === 0) return null;
    return {
      trackingNumber: res.rows[0].tracking_number,
      sensorProfile: res.rows[0].sensor_profile,
    };
  }
}
