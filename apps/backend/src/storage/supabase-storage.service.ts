import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { StorageService } from './storage.service';

@Injectable()
export class SupabaseStorageService implements StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucketName = 'amazonia-marketplace';

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase Config:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      throw new Error('Supabase credentials are not configured in the .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadOptimizedImage(file: Express.Multer.File): Promise<string> {
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
