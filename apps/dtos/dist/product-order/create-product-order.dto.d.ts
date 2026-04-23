import { OrderStatus } from '../enums';
export declare class CreateProductOrderDto {
    productId: string;
    quantity: number;
    totalAmount: number;
    orderNotes?: string;
    sellerRatingValue?: number;
    buyerRatingValue?: number;
    transactionHash?: string;
    currentStatus?: OrderStatus;
}
//# sourceMappingURL=create-product-order.dto.d.ts.map