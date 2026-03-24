/**
 * Rutas para generar URLs presignadas
 * 
 * Estas rutas usan AWS SDK para generar URLs temporales
 * que permiten al frontend subir/descargar archivos de S3
 */

import express, { Router, Request, Response } from 'express';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = Router();

// Inicializar cliente S3
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

// Nombres de buckets desde variables de entorno
const INPUT_BUCKET = process.env.AWS_INPUT_BUCKET || 'image-processor-input-felipe-1';
const OUTPUT_BUCKET = process.env.AWS_OUTPUT_BUCKET || 'image-processor-output-felipe-2';

/**
 * POST /api/presigned-upload-url
 * Genera una URL presignada para subir a S3
 */
router.post('/presigned-upload-url', async (req: Request, res: Response) => {
  try {
    const { filename, filter } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename es requerido' });
    }

    // Crear clave del objeto con el filtro
    const key = `uploads/${filter}_${Date.now()}_${filename}`;

    // Generar comando PUT
    const command = new PutObjectCommand({
      Bucket: INPUT_BUCKET,
      Key: key,
      ContentType: 'image/*',
    });

    // Generar URL presignada (válida por 15 minutos)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutos
    });

    res.json({
      presignedUrl,
      key,
    });
  } catch (error) {
    console.error('Error generando presigned URL:', error);
    res.status(500).json({ error: 'Error generando URL presignada' });
  }
});

/**
 * POST /api/presigned-download-url
 * Genera una URL presignada para descargar de S3
 */
router.post('/presigned-download-url', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key es requerido' });
    }

    // Generar comando GET
    const command = new GetObjectCommand({
      Bucket: OUTPUT_BUCKET,
      Key: key,
    });

    // Generar URL presignada
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutos
    });

    res.json({ presignedUrl });
  } catch (error) {
    console.error('Error generando presigned URL:', error);
    res.status(500).json({ error: 'Error generando URL presignada' });
  }
});

/**
 * GET /api/list-processed-images
 * Lista las imágenes procesadas en S3
 */
router.get('/list-processed-images', async (req: Request, res: Response) => {
  try {
    console.log('📋 Listando imágenes procesadas del bucket:', OUTPUT_BUCKET);
    
    const command = new ListObjectsV2Command({
      Bucket: OUTPUT_BUCKET,
      Prefix: 'processed/',
    });

    const response = await s3Client.send(command);
    const images = (response.Contents || []).map((item: any) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    }));

    console.log(`   ✅ Encontradas ${images.length} imágenes`);
    if (images.length > 0) {
      images.forEach((img: any, index: number) => {
        console.log(`      ${index + 1}. ${img.key}`);
      });
    }

    res.json({ images });
  } catch (error) {
    console.error('❌ Error listando imágenes:', error);
    res.status(500).json({ error: 'Error listando imágenes' });
  }
});

export default router;
