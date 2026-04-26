import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class StorageService {
  abstract uploadOptimizedImage(file: Express.Multer.File): Promise<string>;
}
