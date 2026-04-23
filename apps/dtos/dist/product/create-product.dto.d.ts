import { LocationCoordsDto } from './location-coords.dto';
export declare class CreateProductDto {
    sellerId: string;
    categoryId: number;
    name: string;
    description?: string;
    price: number;
    stockAvailable?: number;
    locationMapboxId?: string;
    locationFormattedAddress?: string;
    locationCity?: string;
    locationRegion?: string;
    coords?: LocationCoordsDto;
}
//# sourceMappingURL=create-product.dto.d.ts.map