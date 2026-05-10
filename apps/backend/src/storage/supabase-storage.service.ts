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
      throw new Error('Las credenciales de Supabase no están configuradas en el .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadOptimizedImage(file: Express.Multer.File): Promise<string> {
    try {
      // 1. Compresión y conversión a WebP
      const optimizedBuffer = await sharp(file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const fileName = `${randomUUID()}.webp`;

      // 2. Subida al bucket de Supabase
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 3. Obtener la URL pública
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

      // Extract filename from URL (e.g., .../public/bucketName/uuid.webp)
      const urlParts = url.split('/');
      const fileName = urlParts.pop();

      if (!fileName) return;

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error(`Error al eliminar la imagen en Supabase: ${error.message}`);
      throw new InternalServerErrorException(`Error al eliminar la imagen: ${error.message}`);
    }
  }
}
