import { Controller, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { RegisterTransactionDto } from './dto/register-transaction.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('transactions')
@UseGuards(ApiKeyGuard)
export class TransactionsController {
  constructor(private readonly web3Service: Web3Service) {}

  @Post('register')
  async register(@Body() payload: RegisterTransactionDto) {
    try {
      // Toda la lógica blockchain se delega al servicio, el Controller solo orquesta
      const transactionHash = await this.web3Service.registerTransaction(payload);
      
      return {
        success: true,
        transactionHash,
      };
    } catch (error) {
      // Manejo estandarizado de errores HTTP hacia el backend principal
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Error registrando la transacción en la blockchain',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
