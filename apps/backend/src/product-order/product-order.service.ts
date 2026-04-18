import { Injectable } from '@nestjs/common';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { UpdateProductOrderDto } from './dto/update-product-order.dto';

@Injectable()
export class ProductOrderService {
  create(createProductOrderDto: CreateProductOrderDto) {
    return 'This action adds a new productOrder';
  }

  findAll() {
    return `This action returns all productOrder`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productOrder`;
  }

  update(id: number, updateProductOrderDto: UpdateProductOrderDto) {
    return `This action updates a #${id} productOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} productOrder`;
  }
}
