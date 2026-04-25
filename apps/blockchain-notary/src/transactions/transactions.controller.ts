// =============================================================================
// TransactionsController — Endpoint principal del microservicio
// Patrón: Async Processing — retorna 202 y procesa en background
// =============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { RegisterTransactionDto } from './dto/register-transaction.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('transactions')
@UseGuards(ApiKeyGuard)
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * POST /api/v1/transactions/register
   *
   * Recibe la solicitud de notarización del backend.
   * Retorna HTTP 202 Accepted inmediatamente y procesa en background.
   * El resultado se envía via webhook cuando la TX se confirma.
   */
  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  async register(@Body() payload: RegisterTransactionDto) {
    this.logger.log(`Received notarization request for order: ${payload.orderId}`);

    // Fire-and-forget: no esperamos la respuesta de la blockchain
    // El resultado se enviará via webhook callback
    this.transactionsService.processNotarization(payload).catch((error) => {
      this.logger.error(
        `Unhandled error in processNotarization for order ${payload.orderId}: ${error.message}`,
      );
    });

    return {
      accepted: true,
      orderId: payload.orderId,
      message: 'Notarization request accepted. Result will be sent via webhook.',
    };
  }

  /**
   * GET /api/v1/transactions/status/:orderId
   *
   * Consulta el estado de una notarización.
   * Útil para polling en caso de que el webhook falle.
   */
  @Get('status/:orderId')
  async getStatus(@Param('orderId') orderId: string) {
    const record = await this.transactionsService.getStatus(orderId);

    if (!record) {
      throw new NotFoundException(`No blockchain record found for order: ${orderId}`);
    }

    return record;
  }
}
