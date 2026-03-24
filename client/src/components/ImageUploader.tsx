/**
 * ImageUploader Component
 * 
 * Componente para subir imágenes y seleccionar filtros.
 * Diseño: Minimalismo Técnico Contemporáneo
 * - Bordes cuadrados, sin border-radius
 * - Tipografía monoespaciada para títulos técnicos
 * - Paleta monocromática con azul industrial
 */

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onUpload: (file: File, filter: string) => Promise<void>;
  isLoading?: boolean;
}

const FILTERS = [
  { id: 'grayscale', label: 'Escala de Grises', description: 'Convierte a blanco y negro' },
  { id: 'blur', label: 'Desenfoque', description: 'Desenfoque gaussiano suave' },
  { id: 'sepia', label: 'Sepia', description: 'Efecto vintage sepia' },
  { id: 'edge', label: 'Detección de Bordes', description: 'Resalta bordes de objetos' },
  { id: 'sharpen', label: 'Nitidez', description: 'Aumenta la definición' },
  { id: 'invert', label: 'Invertir', description: 'Invierte los colores' },
  { id: 'brightness', label: 'Brillo', description: 'Aumenta el brillo 50%' },
  { id: 'contrast', label: 'Contraste', description: 'Aumenta el contraste 50%' },
];

export default function ImageUploader({ onUpload, isLoading = false }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('grayscale');
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10 MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    try {
      await onUpload(selectedFile, selectedFilter);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="border-b-4 border-foreground pb-6">
        <h1 className="font-mono text-4xl font-bold text-foreground">
          PROCESADOR DE IMÁGENES
        </h1>
        <p className="text-foreground/60 mt-2 font-sans">
          Sube una imagen y aplica filtros usando AWS Lambda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Zona de carga */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-4 border-dashed transition-colors ${
            dragActive
              ? 'border-accent bg-accent/5'
              : 'border-border bg-card'
          }`}
        >
          <label className="block p-12 text-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              disabled={isLoading}
            />
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-foreground/40" />
              <div>
                <p className="font-mono font-semibold text-foreground">
                  ARRASTRA IMAGEN AQUÍ
                </p>
                <p className="text-foreground/60 text-sm mt-1">
                  o haz clic para seleccionar (máx. 10 MB)
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Preview */}
        {preview && (
          <div className="space-y-2">
            <p className="font-mono text-sm font-semibold text-foreground">
              VISTA PREVIA
            </p>
            <div className="bg-card border-2 border-border p-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain"
              />
              <p className="text-xs text-foreground/60 mt-3">
                {selectedFile?.name} • {(selectedFile?.size || 0) / 1024 / 1024 > 1
                  ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                  : `${((selectedFile?.size || 0) / 1024).toFixed(0)} KB`}
              </p>
            </div>
          </div>
        )}

        {/* Línea divisoria */}
        <div className="border-b-2 border-border" />

        {/* Selección de filtros */}
        <div className="space-y-4">
          <p className="font-mono text-sm font-semibold text-foreground">
            SELECCIONA FILTRO
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FILTERS.map((filter) => (
              <label
                key={filter.id}
                className={`block p-4 border-2 cursor-pointer transition-colors ${
                  selectedFilter === filter.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-foreground/30'
                }`}
              >
                <input
                  type="radio"
                  name="filter"
                  value={filter.id}
                  checked={selectedFilter === filter.id}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="hidden"
                />
                <div>
                  <p className="font-mono font-semibold text-foreground text-sm">
                    {filter.label}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {filter.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-b-2 border-border" />

        {/* Botón de envío */}
        <Button
          type="submit"
          disabled={!selectedFile || isLoading}
          className="w-full h-12 font-mono font-semibold text-base bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              PROCESANDO...
            </>
          ) : (
            'PROCESAR IMAGEN'
          )}
        </Button>
      </form>
    </div>
  );
}
