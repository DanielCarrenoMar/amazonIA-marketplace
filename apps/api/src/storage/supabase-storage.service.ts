import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { StorageService } from './storage.service';

@Injectable()
export class SupabaseStorageService implements StorageService {
  private readonly supabase: SupabaseClient | null = null;
  private readonly bucketName = 'amazonia-marketplace';
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'SUPABASE_URL/SUPABASE_SERVICE_KEY not set — image upload/delete disabled.',
      );
      return; // no crash, just no-op
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadOptimizedImage(file: Express.Multer.File): Promise<string> {
    if (!this.supabase) {
      throw new InternalServerErrorException('Image upload not available: Supabase not configured.');
    }
    try {
      // 1. Image compression and conversion to WebP
      const optimizedBuffer = await sharp(file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const fileName = `${randomUUID()}.webp`;

      // 2. Upload to Supabase bucket
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 3. Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      throw new InternalServerErrorException(`Error al subir la imagen: ${error.message}`);
    }
  }

  async deleteImage(url: string): Promise<void> {
    if (!this.supabase) return; // silently skip if not configured
    try {
      if (!url) return;

      // Extract full path relative to the bucket
      // Supabase URL format: .../object/public/<bucketName>/path/to/file.webp
      const marker = `/object/public/${this.bucketName}/`;
      const path = url.split(marker)[1];

      if (!path) return;

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      // Log the error but don't re-log in the caller if we throw here
      // (The caller in ProductService already has a catch block)
      throw new InternalServerErrorException(`Error al eliminar la imagen: ${error.message}`);
    }
  }
}
