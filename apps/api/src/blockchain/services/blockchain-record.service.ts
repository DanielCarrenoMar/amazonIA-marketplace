// =============================================================================
// BlockchainRecordService — CRUD para la tabla blockchain_record
// Patrón: Repository — encapsula el acceso a datos
// =============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlockchainStatus } from '@prisma/client';

@Injectable()
export class BlockchainRecordService {
  private readonly logger = new Logger(BlockchainRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca un registro blockchain por orderId.
   */
  async findByOrderId(orderId: string) {
    const record = await this.prisma.blockchainRecord.findUnique({
      where: { orderId },
    });

    if (!record) {
      throw new NotFoundException(`Blockchain record not found for order: ${orderId}`);
    }

    return record;
  }

  /**
   * Actualiza un registro blockchain con los datos del webhook callback.
   * Llamado cuando el notario confirma o reporta un fallo.
   */
  async updateFromWebhook(
    orderId: string,
    data: {
      transactionHash?: string | null;
      blockNumber?: number | null;
      status: BlockchainStatus;
      gasUsed?: string | null;
      errorMessage?: string | null;
      nftTokenId?: string | null;
      nftTxHash?: string | null;
    },
  ) {
    const updateData: any = {
      status: data.status,
      errorMessage: data.errorMessage,
    };

    if (data.transactionHash) {
      updateData.transactionHash = data.transactionHash;
    }
    if (data.blockNumber) {
      updateData.blockNumber = data.blockNumber;
    }
    if (data.gasUsed) {
      updateData.gasUsed = data.gasUsed;
    }
    if (data.status === BlockchainStatus.CONFIRMED) {
      updateData.confirmedAt = new Date();
    }
    if (data.nftTokenId) {
      updateData.nftTokenId = data.nftTokenId;
      updateData.nftMintedAt = new Date();
    }
    if (data.nftTxHash) {
      updateData.nftTxHash = data.nftTxHash;
    }

    return this.prisma.blockchainRecord.update({
      where: { orderId },
      data: updateData,
    });
  }

  /**
   * Actualiza el transactionHash en la tabla product_order.
   * Vincula la orden con su prueba en la blockchain.
   */
  async updateOrderTransactionHash(orderId: string, transactionHash: string) {
    return this.prisma.productOrder.update({
      where: { id: orderId },
      data: { transactionHash },
    });
  }

  /**
   * Lista todos los registros con un status específico.
   * Útil para monitoreo y reintentos.
   */
  async findByStatus(status: BlockchainStatus) {
    return this.prisma.blockchainRecord.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }
}
