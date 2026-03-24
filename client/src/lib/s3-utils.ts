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

/**
 * Hacer polling para encontrar la imagen procesada en S3
 * 
 * @param uploadTimestamp - Timestamp de cuando se subió la imagen (Date.now())
 * @param filterName - Nombre del filtro aplicado
 * @param maxAttempts - Número máximo de intentos (default: 30)
 * @returns Nombre del archivo procesado encontrado
 */
export async function pollForProcessedImage(
  uploadTimestamp: number,
  filterName: string,
  maxAttempts: number = 30
): Promise<string> {
  const timestampStr = uploadTimestamp.toString();
  
  console.log(`🔍 Iniciando polling para imagen procesada...`);
  console.log(`   Timestamp: ${timestampStr}`);
  console.log(`   Filtro: ${filterName}`);
  console.log(`   Intentos máximos: ${maxAttempts}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`   Intento ${attempt}/${maxAttempts}...`);

      // Listar imágenes en el bucket de salida
      const images = await listProcessedImages();
      
      console.log(`   📦 Total de imágenes encontradas: ${images.length}`);
      
      // Debug: Mostrar todas las imágenes encontradas
      if (images.length > 0) {
        console.log(`   📋 Imágenes en el bucket:`);
        images.forEach((img: any, index: number) => {
          const fileName = img.key.split('/').pop() || '';
          console.log(`      ${index + 1}. ${fileName}`);
        });
      }

      // Buscar imagen que contenga el timestamp Y empiece con el filtro
      const processedImage = images.find((img: any) => {
        const key = img.key || '';
        const fileName = key.split('/').pop() || ''; // Obtener solo el nombre del archivo
        
        // Extraer el timestamp del nombre del archivo
        // Formato: filtro_filtro_..._TIMESTAMP_hash.ext
        const timestampMatch = fileName.match(/_(\d{13})_/);
        const fileTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
        
        // Verificar que el timestamp esté dentro de un rango de ±2 segundos (2000ms)
        const timestampDiff = Math.abs(fileTimestamp - uploadTimestamp);
        const isTimestampClose = timestampDiff <= 2000;
        
        // Verificar que empiece con el filtro
        const startsWithFilter = fileName.startsWith(filterName);
        
        console.log(`      🔎 Verificando: ${fileName}`);
        console.log(`         - Timestamp del archivo: ${fileTimestamp}`);
        console.log(`         - Timestamp buscado: ${uploadTimestamp}`);
        console.log(`         - Diferencia: ${timestampDiff}ms`);
        console.log(`         - Timestamp cercano (±2000ms): ${isTimestampClose}`);
        console.log(`         - Empieza con filtro (${filterName}): ${startsWithFilter}`);
        
        if (isTimestampClose && startsWithFilter) {
          console.log(`   ✅ Imagen procesada encontrada: ${fileName}`);
          return true;
        }
        
        return false;
      });

      if (processedImage) {
        return processedImage.key;
      }

      // Si no se encontró, esperar 2 segundos antes del siguiente intento
      if (attempt < maxAttempts) {
        console.log(`   ⏳ No encontrada aún, esperando 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error en intento ${attempt}:`, error);
      
      // Si no es el último intento, continuar
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Si llegamos aquí, no se encontró la imagen después de todos los intentos
  throw new Error(
    `No se encontró la imagen procesada después de ${maxAttempts * 2} segundos. ` +
    `Lambda puede estar tardando más de lo esperado o hubo un error en el procesamiento. ` +
    `Verifica los logs de Lambda en AWS CloudWatch.`
  );
}

/**
 * Descargar imagen procesada desde S3
 * 
 * @param fileName - Nombre del archivo en S3 (key completa)
 * @returns URL de descarga de la imagen
 */
export async function downloadProcessedImage(fileName: string): Promise<string> {
  try {
    console.log(`📥 Descargando imagen procesada: ${fileName}`);

    // Obtener URL presignada para descargar
    const presignedUrl = await getPresignedDownloadUrl(fileName);
    
    console.log(`✅ URL de descarga obtenida`);
    
    return presignedUrl;
  } catch (error) {
    console.error('Error descargando imagen procesada:', error);
    throw error;
  }
}
