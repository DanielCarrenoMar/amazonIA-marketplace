// =============================================================================
// BlockchainReconciliationService — reintenta notarizaciones perdidas o fallidas
// =============================================================================
//
// ProductOrderService crea un BlockchainRecord (status PENDING, submittedAt null)
// atómicamente dentro de la misma transacción que marca la orden como PAID —
// eso es lo único que garantiza que el "intento de notarizar" sobreviva a un
// crash del proceso. Este servicio es quien realmente dispara el POST al notario,
// en un job periódico en vez de una promesa flotante después del commit, así que
// un reinicio a mitad de camino simplemente deja el trabajo pendiente para el
// siguiente tick en lugar de perderlo silenciosamente.

import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { BlockchainStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotaryClientService } from './notary-client.service';

const RECONCILE_INTERVAL_MS = 15_000;
const HEALTH_INTERVAL_MS = 5 * 60_000;
// Si un registro lleva más de esto en PENDING sin que llegue el webhook,
// asumimos que el envío se perdió (crash del notario, red caída, etc.) y reintentamos.
const STALE_SUBMITTED_MS = 5 * 60_000;
const MAX_NOTARIZATION_ATTEMPTS = 5;
const BATCH_SIZE = 20;

@Injectable()
export class BlockchainReconciliationService {
  private readonly logger = new Logger(BlockchainReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notaryClient: NotaryClientService,
  ) {}

  @Interval(RECONCILE_INTERVAL_MS)
  async reconcile(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_SUBMITTED_MS);

    const records = await this.prisma.blockchainRecord.findMany({
      where: {
        retryCount: { lt: MAX_NOTARIZATION_ATTEMPTS },
        // Solo PENDING (nunca enviado, o enviado hace rato sin respuesta) o FAILED —
        // nunca CONFIRMED/SUBMITTED. Registros viejos, de antes de que existiera este
        // servicio, nunca tuvieron submittedAt seteado aunque ya estuvieran CONFIRMED,
        // así que restringir por status explícitamente (no solo por submittedAt null)
        // es lo único que evita reabrir una certificación ya exitosa.
        OR: [
          { status: BlockchainStatus.PENDING, submittedAt: null },
          { status: BlockchainStatus.PENDING, submittedAt: { lt: staleBefore } },
          { status: BlockchainStatus.FAILED },
        ],
      },
      include: {
        order: {
          include: { product: { select: { id: true, sellerId: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    if (records.length === 0) return;

    this.logger.log(`Reconciling ${records.length} pending blockchain notarization(s)`);

    for (const record of records) {
      const order = record.order;
      if (!order || !order.product) {
        this.logger.warn(`BlockchainRecord ${record.id} has no matching order/product — skipping`);
        continue;
      }

      const productHash = crypto
        .createHash('sha256')
        .update(`${order.productId}-${order.product.sellerId}-${order.createdAt.getTime()}`)
        .digest('hex');

      await this.notaryClient.notarizeOrder({
        orderId: order.id,
        amount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod ?? 'CRYPTO',
        productHash,
        buyerId: order.buyerId,
        sellerId: order.product.sellerId,
        webhookUrl: '',
      });
    }
  }

  // Reporta certificaciones que agotaron sus reintentos — quedan en FAILED de forma
  // permanente y requieren intervención manual (o un endpoint admin para reintentarlas).
  @Interval(HEALTH_INTERVAL_MS)
  async reportStuckNotarizations(): Promise<void> {
    const stuck = await this.prisma.blockchainRecord.count({
      where: {
        status: BlockchainStatus.FAILED,
        retryCount: { gte: MAX_NOTARIZATION_ATTEMPTS },
      },
    });

    if (stuck > 0) {
      this.logger.warn(
        `${stuck} order(s) exhausted all notarization attempts and remain FAILED — manual intervention needed`,
      );
    }
  }
}
