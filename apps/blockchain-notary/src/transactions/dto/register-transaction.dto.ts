import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

// Tipado estricto con validaciones automáticas.
// Esta es la ventaja brutal de usar Nest: nos ahorramos todo el código de validación de ifs y typeofs.
export class RegisterTransactionDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  productHash: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;
}
