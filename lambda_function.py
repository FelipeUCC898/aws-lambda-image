"""
AWS Lambda Function: Image Filter Processor

Esta función procesa imágenes subidas a S3, aplica filtros usando Pillow,
y guarda el resultado en un bucket de salida.

Dependencias:
- boto3 (incluido en Lambda)
- Pillow (PIL) - debe incluirse en una Lambda Layer

Configuración requerida:
- Variable de entorno: OUTPUT_BUCKET_NAME
- Trigger: S3 ObjectCreated event
"""

import json
import boto3
import os
from io import BytesIO
from PIL import Image, ImageFilter, ImageEnhance
import logging
from urllib.parse import unquote_plus

# Configuración de logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Clientes de AWS
s3_client = boto3.client('s3')

# Variables de entorno
OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET_NAME', 'image-processor-output')
ALLOWED_FORMATS = {'JPEG', 'PNG', 'WEBP'}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def apply_filter(image, filter_type):
    """
    Aplica el filtro especificado a la imagen.
    
    Args:
        image (PIL.Image): Imagen a procesar
        filter_type (str): Tipo de filtro a aplicar
        
    Returns:
        PIL.Image: Imagen procesada
    """
    filter_type = filter_type.lower().strip()
    
    if filter_type == 'grayscale':
        return image.convert('L')
    
    elif filter_type == 'blur':
        return image.filter(ImageFilter.GaussianBlur(radius=5))
    
    elif filter_type == 'sepia':
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Aplicar efecto sepia
        pixels = image.load()
        width, height = image.size
        
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y][:3]
                
                tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                
                pixels[x, y] = (min(tr, 255), min(tg, 255), min(tb, 255))
        
        return image
    
    elif filter_type == 'edge':
        return image.filter(ImageFilter.FIND_EDGES)
    
    elif filter_type == 'sharpen':
        return image.filter(ImageFilter.SHARPEN)
    
    elif filter_type == 'invert':
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        pixels = image.load()
        width, height = image.size
        
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y][:3]
                pixels[x, y] = (255 - r, 255 - g, 255 - b)
        
        return image
    
    elif filter_type == 'brightness':
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(1.5)  # Aumenta brillo 50%
    
    elif filter_type == 'contrast':
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(1.5)  # Aumenta contraste 50%
    
    else:
        logger.warning(f"Filtro desconocido: {filter_type}. Retornando imagen original.")
        return image


def lambda_handler(event, context):
    """
    Manejador principal de Lambda.
    
    Eventos esperados:
    1. S3 Event: Cuando se sube una imagen a S3
    2. API Gateway: Invocación directa con parámetros JSON
    
    Args:
        event (dict): Evento de Lambda
        context (object): Contexto de Lambda
        
    Returns:
        dict: Respuesta con status y URL de la imagen procesada
    """
    
    try:
        # Detectar tipo de evento
        if 'Records' in event:
            # Evento de S3
            return handle_s3_event(event)
        else:
            # Evento de API Gateway o invocación directa
            return handle_direct_invocation(event)
    
    except Exception as e:
        logger.error(f"Error en lambda_handler: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Error procesando imagen',
                'message': str(e)
            })
        }


def handle_s3_event(event):
    """Maneja eventos de S3."""
    
    try:
        # Extraer información del evento S3
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        
        logger.info(f"Procesando imagen: s3://{bucket}/{key}")
        
        # Obtener filtro del nombre del archivo o metadatos
        filter_type = extract_filter_from_key(key)
        
        # Procesar imagen
        output_key = process_image(bucket, key, filter_type)
        
        # Generar URL presignada
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': OUTPUT_BUCKET, 'Key': output_key},
            ExpiresIn=900  # 15 minutos
        )
        
        logger.info(f"Imagen procesada exitosamente: {output_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Imagen procesada exitosamente',
                'output_key': output_key,
                'presigned_url': presigned_url
            })
        }
    
    except Exception as e:
        logger.error(f"Error en handle_s3_event: {str(e)}", exc_info=True)
        raise


def handle_direct_invocation(event):
    """Maneja invocaciones directas de API Gateway o CLI."""
    
    try:
        # Parsear body si viene de API Gateway
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        bucket = body.get('bucket')
        key = body.get('key')
        filter_type = body.get('filter', 'grayscale')
        
        if not bucket or not key:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Parámetros faltantes',
                    'required': ['bucket', 'key'],
                    'optional': ['filter']
                })
            }
        
        logger.info(f"Invocación directa: {bucket}/{key} con filtro {filter_type}")
        
        # Procesar imagen
        output_key = process_image(bucket, key, filter_type)
        
        # Generar URL presignada
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': OUTPUT_BUCKET, 'Key': output_key},
            ExpiresIn=900
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Imagen procesada exitosamente',
                'output_key': output_key,
                'presigned_url': presigned_url
            })
        }
    
    except Exception as e:
        logger.error(f"Error en handle_direct_invocation: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Error procesando imagen',
                'message': str(e)
            })
        }


def process_image(input_bucket, input_key, filter_type):
    """
    Descarga, procesa y guarda la imagen.
    
    Args:
        input_bucket (str): Bucket de entrada
        input_key (str): Clave del objeto en S3
        filter_type (str): Tipo de filtro a aplicar
        
    Returns:
        str: Clave del objeto de salida
    """
    
    # Validar tamaño del objeto
    response = s3_client.head_object(Bucket=input_bucket, Key=input_key)
    file_size = response['ContentLength']
    
    if file_size > MAX_IMAGE_SIZE:
        raise ValueError(f"Archivo muy grande: {file_size} bytes (máximo: {MAX_IMAGE_SIZE})")
    
    # Descargar imagen de S3
    logger.info(f"Descargando imagen: {input_key}")
    obj = s3_client.get_object(Bucket=input_bucket, Key=input_key)
    image_data = obj['Body'].read()
    
    # Abrir imagen con Pillow
    image = Image.open(BytesIO(image_data))
    
    # Validar formato
    if image.format not in ALLOWED_FORMATS:
        raise ValueError(f"Formato no permitido: {image.format}. Permitidos: {ALLOWED_FORMATS}")
    
    logger.info(f"Imagen cargada: {image.format} ({image.size})")
    
    # Aplicar filtro
    logger.info(f"Aplicando filtro: {filter_type}")
    processed_image = apply_filter(image, filter_type)
    
    # Guardar imagen procesada en memoria
    output_buffer = BytesIO()
    output_format = image.format or 'JPEG'
    processed_image.save(output_buffer, format=output_format)
    output_buffer.seek(0)
    
    # Generar nombre de archivo de salida
    base_name = os.path.splitext(input_key)[0]
    extension = os.path.splitext(input_key)[1]
    output_key = f"processed/{base_name}_{filter_type}{extension}"
    
    # Subir a bucket de salida
    logger.info(f"Subiendo imagen procesada: {output_key}")
    s3_client.put_object(
        Bucket=OUTPUT_BUCKET,
        Key=output_key,
        Body=output_buffer.getvalue(),
        ContentType=f"image/{output_format.lower()}"
    )
    
    return output_key


def extract_filter_from_key(key):
    """
    Extrae el tipo de filtro del nombre del archivo.
    
    Formato esperado: filename_[filter].ext
    Ejemplo: photo_blur.jpg → 'blur'
    
    Si no se encuentra, retorna 'grayscale' como default.
    """
    
    base_name = os.path.splitext(key)[0]
    
    if '_' in base_name:
        potential_filter = base_name.split('_')[-1]
        
        valid_filters = {
            'grayscale', 'blur', 'sepia', 'edge', 'sharpen',
            'invert', 'brightness', 'contrast'
        }
        
        if potential_filter.lower() in valid_filters:
            return potential_filter.lower()
    
    return 'grayscale'  # Default


# Para pruebas locales
if __name__ == '__main__':
    # Evento de prueba
    test_event = {
        'bucket': 'image-processor-input',
        'key': 'test_image_blur.jpg',
        'filter': 'blur'
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
