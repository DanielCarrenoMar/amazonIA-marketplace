// =============================================================================
// HealthController — Estado del microservicio y conexión blockchain
// =============================================================================

import { Controller, Get, Logger } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { BlockchainConfig, BLOCKCHAIN_CONFIG_KEY } from '../config/blockchain.config';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /api/v1/health
   *
   * Verifica la conexión con el nodo RPC, el balance de la wallet,
   * y retorna el estado general del servicio.
   * Este endpoint NO requiere API Key — es público para monitoring.
   */
  @Get()
  async check() {
    const config = this.configService.get<BlockchainConfig>(BLOCKCHAIN_CONFIG_KEY)!;
    const health = await this.blockchainService.checkHealth();

    const status = health.rpcConnected ? 'healthy' : 'unhealthy';

    if (!health.rpcConnected) {
      this.logger.warn('Health check: RPC node is not responding');
    }

    return {
      status,
      rpcConnected: health.rpcConnected,
      walletBalance: health.walletBalance,
      contractAddress: config.contractAddress,
      networkName: config.networkName,
      timestamp: new Date().toISOString(),
    };
  }
}
