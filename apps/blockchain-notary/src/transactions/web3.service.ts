import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3 } from 'web3';
import { RegisterTransactionDto } from './dto/register-transaction.dto';

// --> TODO: INYECTAR EL ABI CORRECTO AQUÍ CUANDO ESTÉ LISTO EL SMART CONTRACT:
// import ContractABI from './abi/NotaryContract.json';
const MockABI = []; // <--- Reemplazar con el ABI real exportado de Hardhat/Foundry

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  private web3: Web3;
  private readonly rpcUrl: string;
  private readonly rpcApiKey?: string;
  private readonly privateKey: string;
  private readonly contractAddress: string;

  constructor(private configService: ConfigService) {
    // 1. Obtener la URL del nodo RPC y la API Key (si requiere por Headers)
    this.rpcUrl = this.configService.get<string>('RPC_URL') || 'https://arb1.arbitrum.io/rpc';
    this.rpcApiKey = this.configService.get<string>('RPC_API_KEY');
    
    // 2. Obtener la llave privada de la billetera corporativa que asume los costos de gas
    this.privateKey = this.configService.get<string>('PRIVATE_KEY');
    
    // 3. Obtener la dirección del contrato inteligente desplegado
    this.contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

    if (!this.rpcUrl || !this.privateKey || !this.contractAddress) {
      this.logger.warn('Faltan variables de entorno críticas Web3 (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS)');
    }

    // Inicializamos el proveedor de Web3
    if (this.rpcApiKey) {
      // Configuramos el HttpProvider con soporte para autenticación de varios proveedores
      const provider = new Web3.providers.HttpProvider(this.rpcUrl, {
        headers: {
          'x-api-key': this.rpcApiKey,
          'Authorization': `Bearer ${this.rpcApiKey}`,
        },
      } as any);
      this.web3 = new Web3(provider);
    } else {
      // Si no hay API Key por header, lo inicializamos normal (asume nodo público o API key en URL)
      this.web3 = new Web3(this.rpcUrl);
    }
  }

  async registerTransaction(payload: RegisterTransactionDto): Promise<string> {
    try {
      this.logger.log(`Iniciando registro en Arbitrum para orden: ${payload.orderId}`);
      
      // Control de errores de red #1: ¿Está caído el nodo de Alchemy/Infura?
      const isListening = await this.web3.eth.net.isListening();
      if (!isListening) {
        throw new Error('El nodo RPC no está respondiendo (Red caída)');
      }

      // Preparamos la billetera corporativa
      const account = this.web3.eth.accounts.wallet.add(this.privateKey);
      
      // Instanciamos el contrato
      const contract = new this.web3.eth.Contract(MockABI, this.contractAddress);

      // Preparamos la llamada al contrato inteligente (Ajustar según el contrato real en Solidity)
      const tx = contract.methods.registerTransaction(
        payload.orderId,
        this.web3.utils.toWei(payload.amount.toString(), 'ether'), // Validar el decimal que maneje el token en Arbitrum
        payload.paymentMethod,
        payload.productHash,
        payload.buyerId,
        payload.sellerId
      );

      // Control de errores de gas #2: ¿Tenemos fondos y la TX es válida?
      let gasEstimate;
      try {
        gasEstimate = await tx.estimateGas({ from: account[0].address });
      } catch (e) {
        this.logger.error('Error estimando gas. Posible fallo o parámetros inválidos enviados al contrato', e);
        throw new Error('La transacción revertirá en la red. Datos o permisos incorrectos.');
      }

      const gasPrice = await this.web3.eth.getGasPrice();
      const balance = await this.web3.eth.getBalance(account[0].address);
      const totalCost = BigInt(gasEstimate) * BigInt(gasPrice);

      if (BigInt(balance) < totalCost) {
        throw new Error('Fondos insuficientes en la billetera corporativa para pagar el Gas.');
      }

      // Todo está OK, firmamos y enviamos la transacción
      const receipt = await tx.send({
        from: account[0].address,
        gas: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
      });

      this.logger.log(`¡Transacción confirmada en Arbitrum! Hash: ${receipt.transactionHash}`);
      
      return receipt.transactionHash.toString();
    } catch (error) {
      this.logger.error(`Falló el registro Web3: ${error.message}`);
      throw new InternalServerErrorException(error.message || 'Error interactuando con Arbitrum');
    }
  }
}
