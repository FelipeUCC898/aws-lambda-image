/**
 * Utilidades para interactuar con S3
 * 
 * Estas funciones manejan:
 * - Obtener URLs presignadas
 * - Subir archivos a S3
 * - Listar imágenes procesadas
 */

import { AWS_CONFIG } from './aws-config';

/**
 * Obtener URL presignada para subir a S3
 * 
 * @param filename - Nombre del archivo
 * @param filter - Filtro a aplicar
 * @returns URL presignada para subir
 */
export async function getPresignedUploadUrl(
  filename: string,
  filter: string
): Promise<string> {
  try {
    // Llamar a nuestro backend para obtener la URL presignada
    const response = await fetch(`${AWS_CONFIG.apiUrl}/api/presigned-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        filter,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.presignedUrl;
  } catch (error) {
    console.error('Error obteniendo URL presignada:', error);
    throw error;
  }
}

/**
 * Subir archivo a S3 usando URL presignada
 * 
 * @param presignedUrl - URL presignada de S3
 * @param file - Archivo a subir
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al subir: ${response.statusText}`);
    }

    console.log('✅ Archivo subido exitosamente a S3');
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    throw error;
  }
}

/**
 * Obtener URL presignada para descargar desde S3
 * 
 * @param key - Clave del objeto en S3
 * @returns URL presignada para descargar
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  try {
    const response = await fetch(`${AWS_CONFIG.apiUrl}/api/presigned-download-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.presignedUrl;
  } catch (error) {
    console.error('Error obteniendo URL de descarga:', error);
    throw error;
  }
}

/**
 * Listar imágenes procesadas en S3
 * 
 * @returns Lista de objetos en S3
 */
export async function listProcessedImages(): Promise<any[]> {
  try {
    const response = await fetch(`${AWS_CONFIG.apiUrl}/api/list-processed-images`);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error('Error listando imágenes:', error);
    return [];
  }
}
