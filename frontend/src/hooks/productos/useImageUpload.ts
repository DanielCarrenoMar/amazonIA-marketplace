import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('Iniciando subida de imagen:', file.name);
      setUploading(true);
      setUploadError(null);

      // Validar el archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Limitar el tamaño del archivo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen debe ser menor a 5MB');
      }

      // Generar un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      console.log('Intentando subir a Supabase Storage:', filePath);

      // Subir el archivo al storage con timeout manual
      const uploadPromise = supabase.storage
        .from('productos-imagenes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      // Timeout de 20 segundos
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('La subida ha tardado demasiado, revisa tu conexión')), 20000)
      );

      const { error: uploadError, data: uploadData } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as { data: any; error: any };

      console.log('Respuesta de subida:', { uploadError, uploadData });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener la URL pública del archivo
      const { data } = supabase.storage
        .from('productos-imagenes')
        .getPublicUrl(filePath);

      console.log('URL obtenida:', data.publicUrl);

      return data.publicUrl;
    } catch (error) {
      console.error('Error en catch de uploadImage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
      setUploadError(errorMessage);
      return null;
    } finally {
      console.log('Finalizando proceso de subida (finally)');
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extraer el path del archivo de la URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // productos/filename.ext

      const { error } = await supabase.storage
        .from('productos-imagenes')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    uploadError
  };
}