/**
 * ImageGallery Component
 * 
 * Muestra las imágenes procesadas en una galería.
 * Diseño: Minimalismo Técnico Contemporáneo
 */

import { Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

interface ProcessedImage {
  id: string;
  url: string;
  filter: string;
  timestamp: Date;
  originalName?: string;
}

interface ImageGalleryProps {
  images: ProcessedImage[];
  onDelete?: (id: string) => void;
}

export default function ImageGallery({ images, onDelete }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  const handleDownload = (url: string, filter: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed_${filter}_${Date.now()}.jpg`;
    link.click();
  };

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <p className="font-mono text-sm font-semibold text-foreground">
          IMÁGENES PROCESADAS
        </p>
        <div className="bg-card border-2 border-dashed border-border p-12 text-center">
          <p className="text-foreground/60">
            Las imágenes procesadas aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-border pb-4">
        <p className="font-mono text-sm font-semibold text-foreground">
          IMÁGENES PROCESADAS ({images.length})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-card border-2 border-border overflow-hidden hover:border-accent transition-colors"
          >
            {/* Imagen */}
            <div className="aspect-square bg-secondary overflow-hidden">
              <img
                src={image.url}
                alt={`Procesada con ${image.filter}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Información */}
            <div className="p-4 space-y-3">
              <div>
                <p className="font-mono text-xs font-semibold text-foreground/60 uppercase">
                  Filtro
                </p>
                <p className="font-mono text-sm font-bold text-foreground">
                  {image.filter}
                </p>
              </div>

              <div>
                <p className="font-mono text-xs font-semibold text-foreground/60 uppercase">
                  Fecha
                </p>
                <p className="text-xs text-foreground/60">
                  {image.timestamp.toLocaleString()}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2 border-t-2 border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedImage(image)}
                  className="flex-1 font-mono text-xs h-9"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  VER
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(image.url, image.filter)}
                  className="flex-1 font-mono text-xs h-9"
                >
                  <Download className="w-3 h-3 mr-1" />
                  DESCARGAR
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(image.id)}
                    className="flex-1 font-mono text-xs h-9 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    ELIMINAR
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de vista completa */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">
              IMAGEN PROCESADA - {selectedImage?.filter.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.url}
                alt={`Procesada con ${selectedImage.filter}`}
                className="w-full h-auto"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(selectedImage.url, selectedImage.filter)}
                  className="flex-1 font-mono"
                >
                  <Download className="w-4 h-4 mr-2" />
                  DESCARGAR IMAGEN
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
