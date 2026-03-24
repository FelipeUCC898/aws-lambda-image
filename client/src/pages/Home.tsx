/**
 * Home Page - Procesador de Imágenes AWS
 * 
 * Página principal que integra:
 * - Componente de carga de imágenes
 * - Galería de imágenes procesadas
 * - Gestión de estado local
 * 
 * Diseño: Minimalismo Técnico Contemporáneo
 * - Asimetría controlada: carga a la izquierda (60%), galería a la derecha (40%)
 * - Líneas divisoras horizontales
 * - Tipografía monoespaciada para títulos
 * - Paleta monocromática con azul industrial
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ImageUploader from '@/components/ImageUploader';
import ImageGallery from '@/components/ImageGallery';
import { getPresignedUploadUrl, uploadFileToS3 } from '@/lib/s3-utils';

interface ProcessedImage {
  id: string;
  url: string;
  filter: string;
  timestamp: Date;
  originalName?: string;
}

export default function Home() {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar imágenes del localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('processedImages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProcessedImages(
          parsed.map((img: any) => ({
            ...img,
            timestamp: new Date(img.timestamp),
          }))
        );
      } catch (error) {
        console.error('Error cargando imágenes guardadas:', error);
      }
    }
  }, []);

  // Guardar imágenes en localStorage
  useEffect(() => {
    localStorage.setItem('processedImages', JSON.stringify(processedImages));
  }, [processedImages]);

  const handleUpload = async (file: File, filter: string) => {
    setIsLoading(true);
    const loadingToast = toast.loading('Subiendo imagen a S3...');

    try {
      console.log('🚀 Iniciando proceso de subida');
      console.log('📁 Archivo:', file.name);
      console.log('🎨 Filtro:', filter);
      console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000');

      // 1. Obtener URL presignada del backend
      console.log('📡 Solicitando URL presignada...');
      const presignedUrl = await getPresignedUploadUrl(file.name, filter);
      console.log('✅ URL presignada obtenida:', presignedUrl.substring(0, 100) + '...');

      // 2. Subir archivo a S3
      console.log('⬆️ Subiendo archivo a S3...');
      await uploadFileToS3(presignedUrl, file);
      console.log('✅ Archivo subido exitosamente');

      // 3. Crear objeto de imagen procesada
      const newImage: ProcessedImage = {
        id: `img_${Date.now()}`,
        url: URL.createObjectURL(file),
        filter,
        timestamp: new Date(),
        originalName: file.name,
      };

      setProcessedImages((prev) => [newImage, ...prev]);

      toast.success('✅ Imagen subida exitosamente. Lambda la procesará pronto.', {
        id: loadingToast,
      });
      console.log('🎉 Proceso completado exitosamente');
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setProcessedImages((prev) => prev.filter((img) => img.id !== id));
    toast.success('Imagen eliminada');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Contenedor principal */}
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sección de carga (izquierda - 60%) */}
          <div className="lg:col-span-2">
            <ImageUploader onUpload={handleUpload} isLoading={isLoading} />
          </div>

          {/* Línea divisoria vertical (solo en desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border" />

          {/* Sección de galería (derecha - 40%) */}
          <div className="lg:col-span-1">
            <ImageGallery images={processedImages} onDelete={handleDelete} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-border mt-16 py-8">
        <div className="container mx-auto">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs font-semibold text-foreground/60 uppercase">
              Procesador de Imágenes
            </p>
            <p className="text-xs text-foreground/40">
              Construido con AWS Lambda, S3 y Pillow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
