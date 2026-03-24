# Guía de Implementación - Procesador de Imágenes AWS

**Autor:** Manus AI  
**Fecha:** Marzo 2026  
**Versión:** 1.0

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración de AWS](#configuración-de-aws)
4. [Despliegue de Lambda](#despliegue-de-lambda)
5. [Configuración de S3](#configuración-de-s3)
6. [Integración Frontend](#integración-frontend)
7. [Pruebas End-to-End](#pruebas-end-to-end)
8. [Troubleshooting](#troubleshooting)
9. [Referencias](#referencias)

---

## Introducción

Este documento proporciona una guía paso a paso para implementar un servicio de procesamiento de imágenes utilizando **AWS Lambda**, **Amazon S3** y **Pillow** (biblioteca de procesamiento de imágenes en Python). El sistema permite a los usuarios subir imágenes, aplicar filtros automáticamente mediante una función Lambda, y descargar los resultados procesados.

### Casos de Uso

El procesador de imágenes es útil para aplicaciones que requieren transformación automática de imágenes, tales como:

- Generación de miniaturas para galerías
- Aplicación de filtros en tiempo real
- Normalización de imágenes para análisis
- Procesamiento en lote de activos multimedia
- Demostraciones educativas de arquitectura serverless

### Ventajas de esta Arquitectura

La arquitectura basada en eventos ofrece múltiples beneficios. En primer lugar, **escalabilidad automática**: Lambda escala automáticamente para manejar miles de invocaciones simultáneas sin intervención manual. En segundo lugar, **modelo de precios por uso**: solo pagas por el tiempo de ejecución real, no por servidores ociosos. Tercero, **mantenimiento cero**: AWS gestiona la infraestructura, parches de seguridad y actualizaciones del sistema operativo. Finalmente, **integración nativa**: S3 y Lambda se integran perfectamente, permitiendo flujos de trabajo automatizados sin código de orquestación adicional.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener los siguientes elementos:

### Cuenta de AWS

Necesitas una **cuenta de AWS activa**. Si no tienes una, puedes crear una en [aws.amazon.com](https://aws.amazon.com). La mayoría de los servicios utilizados en esta guía están cubiertos por el **tier gratuito de AWS**, que incluye 1 millón de invocaciones Lambda y 5 GB de almacenamiento S3 por mes durante 12 meses.

### Herramientas Locales

Se recomienda instalar las siguientes herramientas en tu máquina de desarrollo:

| Herramienta | Propósito | Instalación |
|---|---|---|
| **AWS CLI** | Interactuar con AWS desde la terminal | `pip install awscli` |
| **Python 3.9+** | Desarrollo y pruebas locales | [python.org](https://www.python.org/downloads/) |
| **Node.js 16+** | Ejecutar la aplicación frontend | [nodejs.org](https://nodejs.org/) |
| **Git** | Control de versiones | [git-scm.com](https://git-scm.com/) |

### Permisos de IAM

Tu usuario de AWS debe tener permisos para crear y gestionar los siguientes recursos:

- IAM Roles y Policies
- Lambda Functions
- S3 Buckets
- CloudWatch Logs
- API Gateway (opcional)

Si tu cuenta tiene acceso administrativo, no hay restricciones. De lo contrario, solicita a tu administrador que agregue estas políticas.

---

## Configuración de AWS

### Paso 1: Crear los Buckets S3

Amazon S3 es el almacenamiento de objetos donde guardaremos las imágenes originales y procesadas.

#### Crear el Bucket de Entrada

1. Abre la [consola de AWS](https://console.aws.amazon.com/)
2. Navega a **S3** en el menú de servicios
3. Haz clic en **Crear bucket**
4. Configura los siguientes parámetros:
   - **Nombre del bucket:** `image-processor-input-{tu-nombre-unico}` (los nombres de S3 deben ser globalmente únicos)
   - **Región:** Selecciona la región más cercana a ti (ej. `us-east-1`)
   - **Bloquear acceso público:** Deja habilitado (por seguridad)
5. Haz clic en **Crear bucket**

#### Crear el Bucket de Salida

Repite el proceso anterior pero con el nombre `image-processor-output-{tu-nombre-unico}`.

#### Habilitar Notificaciones de Eventos

Para que Lambda se invoque automáticamente cuando se sube una imagen, debemos configurar notificaciones de S3:

1. Abre el bucket de entrada en la consola S3
2. Ve a la pestaña **Propiedades**
3. Desplázate hasta **Notificaciones de eventos**
4. Haz clic en **Crear notificación de eventos**
5. Configura:
   - **Nombre:** `ImageUploadedEvent`
   - **Eventos:** Marca `s3:ObjectCreated:*`
   - **Destino:** Selecciona **Función de Lambda**
   - **Función de Lambda:** (la crearemos en el siguiente paso)

### Paso 2: Crear el Rol de IAM para Lambda

Lambda necesita permisos para leer del bucket de entrada y escribir en el bucket de salida.

1. Abre la consola de **IAM**
2. Ve a **Roles** en el menú izquierdo
3. Haz clic en **Crear rol**
4. Selecciona **AWS service** como tipo de entidad de confianza
5. Elige **Lambda** como caso de uso
6. Haz clic en **Siguiente**
7. En la página de permisos, busca y selecciona:
   - `AWSLambdaBasicExecutionRole` (para CloudWatch Logs)
8. Haz clic en **Siguiente**
9. Asigna el nombre: `ImageProcessorLambdaRole`
10. Haz clic en **Crear rol**

#### Agregar Política Personalizada

Ahora debemos agregar permisos específicos para S3:

1. Abre el rol recién creado
2. Ve a **Agregar política en línea**
3. Selecciona **JSON** como editor
4. Reemplaza el contenido con:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::image-processor-input-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::image-processor-output-*/*"
    }
  ]
}
```

5. Haz clic en **Revisar política**
6. Asigna el nombre: `S3ImageProcessorPolicy`
7. Haz clic en **Crear política**

---

## Despliegue de Lambda

### Paso 1: Preparar el Código

Lambda requiere que Pillow esté disponible. Como Pillow no viene preinstalado en el entorno de Lambda, debemos crear una **Lambda Layer**.

#### Crear la Lambda Layer con Pillow

En tu máquina local:

```bash
# Crear estructura de directorios
mkdir -p lambda-layer/python/lib/python3.11/site-packages

# Instalar Pillow en el directorio
pip install -t lambda-layer/python/lib/python3.11/site-packages Pillow

# Crear archivo ZIP
cd lambda-layer
zip -r ../pillow-layer.zip .
cd ..
```

#### Subir la Layer a AWS

1. Abre la consola de **Lambda**
2. Ve a **Capas (Layers)** en el menú izquierdo
3. Haz clic en **Crear capa**
4. Configura:
   - **Nombre:** `PillowLayer`
   - **Carga un archivo ZIP:** Selecciona `pillow-layer.zip`
   - **Runtime compatible:** Selecciona `Python 3.11`
5. Haz clic en **Crear**

### Paso 2: Crear la Función Lambda

1. Abre la consola de **Lambda**
2. Haz clic en **Crear función**
3. Configura:
   - **Nombre de la función:** `ImageFilterProcessor`
   - **Runtime:** Python 3.11
   - **Rol de ejecución:** Selecciona `ImageProcessorLambdaRole`
4. Haz clic en **Crear función**

### Paso 3: Agregar el Código

1. En el editor en línea de Lambda, reemplaza el código predeterminado con el contenido del archivo `lambda_function.py` incluido en este proyecto
2. Haz clic en **Desplegar**

### Paso 4: Configurar Variables de Entorno

1. Desplázate hasta **Variables de entorno**
2. Haz clic en **Editar**
3. Agrega:
   - **Clave:** `OUTPUT_BUCKET_NAME`
   - **Valor:** `image-processor-output-{tu-nombre-unico}`
4. Haz clic en **Guardar**

### Paso 5: Agregar la Lambda Layer

1. Desplázate hasta **Capas**
2. Haz clic en **Agregar capa**
3. Selecciona `PillowLayer`
4. Haz clic en **Agregar**

### Paso 6: Aumentar Memoria y Timeout

Para procesar imágenes más grandes:

1. Ve a **Configuración general**
2. Haz clic en **Editar**
3. Aumenta:
   - **Memoria:** 512 MB (o más si es necesario)
   - **Timeout:** 60 segundos
4. Haz clic en **Guardar**

---

## Configuración de S3

### Completar la Notificación de Eventos

Ahora que Lambda está creada, podemos completar la configuración de notificaciones:

1. Abre el bucket de entrada en S3
2. Ve a **Propiedades** → **Notificaciones de eventos**
3. Haz clic en **Crear notificación de eventos**
4. Configura:
   - **Nombre:** `ImageUploadedEvent`
   - **Eventos:** `s3:ObjectCreated:*`
   - **Destino:** Lambda Function
   - **Función de Lambda:** `ImageFilterProcessor`
5. Haz clic en **Guardar**

### Configurar CORS (si usas presigned URLs desde el frontend)

Para permitir que el frontend suba archivos directamente a S3:

1. Abre el bucket de entrada
2. Ve a **Permisos** → **CORS**
3. Agrega la siguiente configuración:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Integración Frontend

### Paso 1: Configurar Credenciales AWS en el Frontend

Para que el frontend pueda interactuar con S3 y Lambda, necesita credenciales de AWS. **Importante:** Nunca expongas tus credenciales raíz en el código del cliente. En su lugar, usa **Cognito** o **STS AssumeRole** para obtener credenciales temporales.

#### Opción A: Usar AWS Amplify (Recomendado)

```bash
npm install aws-amplify
```

Configura en tu aplicación React:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'tu-user-pool-id',
    userPoolWebClientId: 'tu-client-id',
  },
  Storage: {
    region: 'us-east-1',
    bucket: 'image-processor-input-{tu-nombre-unico}',
    identityPoolId: 'tu-identity-pool-id',
  },
});
```

#### Opción B: Usar Presigned URLs (Más Simple para Demostración)

Crea un endpoint backend que genere URLs presignadas:

```python
import boto3
from datetime import timedelta

s3_client = boto3.client('s3')

def generate_presigned_url(bucket_name, object_name, expiration=3600):
    """Genera una URL presignada para subir a S3"""
    return s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': bucket_name, 'Key': object_name},
        ExpiresIn=expiration
    )
```

### Paso 2: Implementar Carga de Archivos

En tu componente React:

```typescript
const handleUpload = async (file: File, filter: string) => {
  try {
    // Generar presigned URL desde tu backend
    const response = await fetch('/api/generate-presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        filter: filter,
      }),
    });
    const { presignedUrl } = await response.json();

    // Subir archivo a S3
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    // Lambda procesará automáticamente
    toast.success('Imagen subida exitosamente');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al subir imagen');
  }
};
```

### Paso 3: Mostrar Resultados Procesados

Lambda guardará las imágenes procesadas en el bucket de salida. Para acceder a ellas desde el frontend:

```typescript
const getProcessedImages = async () => {
  const s3_client = new AWS.S3();
  const params = {
    Bucket: 'image-processor-output-{tu-nombre-unico}',
    Prefix: 'processed/',
  };

  const data = await s3_client.listObjectsV2(params).promise();
  return data.Contents || [];
};
```

---

## Pruebas End-to-End

### Prueba 1: Verificar Lambda Localmente

Antes de desplegar, prueba la función Lambda localmente:

```bash
# Instalar SAM CLI
pip install aws-sam-cli

# Crear evento de prueba
cat > test-event.json << EOF
{
  "bucket": "image-processor-input-test",
  "key": "test-image.jpg",
  "filter": "grayscale"
}
EOF

# Ejecutar función localmente
sam local invoke ImageFilterProcessor -e test-event.json
```

### Prueba 2: Subir una Imagen de Prueba

1. Abre la consola de S3
2. Ve al bucket de entrada
3. Haz clic en **Subir**
4. Selecciona una imagen de prueba (JPG o PNG)
5. Haz clic en **Subir**

### Prueba 3: Verificar Logs de Lambda

1. Abre la consola de **CloudWatch**
2. Ve a **Grupos de registros**
3. Abre `/aws/lambda/ImageFilterProcessor`
4. Verifica que no haya errores

### Prueba 4: Verificar Imagen Procesada

1. Abre el bucket de salida en S3
2. Navega a la carpeta `processed/`
3. Deberías ver la imagen procesada con el nombre: `test-image_grayscale.jpg`

### Prueba 5: Prueba Frontend Completa

1. Abre la aplicación web
2. Selecciona una imagen
3. Elige un filtro
4. Haz clic en **Procesar Imagen**
5. Verifica que aparezca en la galería

---

## Troubleshooting

### Error: "Unable to import module 'lambda_function'"

**Causa:** Pillow no está disponible en Lambda.

**Solución:** Asegúrate de haber creado y agregado la Lambda Layer correctamente. Verifica que el archivo ZIP contenga la estructura `python/lib/python3.11/site-packages/PIL/`.

### Error: "Access Denied" al escribir en S3

**Causa:** El rol de IAM no tiene permisos suficientes.

**Solución:** Verifica que la política `S3ImageProcessorPolicy` esté adjunta al rol `ImageProcessorLambdaRole` y que los nombres de los buckets sean correctos.

### Error: "Timeout" al procesar imágenes grandes

**Causa:** Lambda está tardando más de 60 segundos.

**Solución:** Aumenta el timeout en la configuración de Lambda a 300 segundos. Alternativamente, optimiza el código para procesar imágenes más rápidamente o reduce el tamaño máximo permitido.

### Error: "InvalidImageError" en Pillow

**Causa:** El archivo no es una imagen válida.

**Solución:** Valida el tipo MIME en el frontend antes de subir. Asegúrate de que solo se suban imágenes (JPEG, PNG, WebP).

### Las imágenes procesadas no aparecen

**Causa:** Lambda no está siendo invocada o hay un error silencioso.

**Solución:** Verifica los logs de CloudWatch. Asegúrate de que la notificación de eventos de S3 esté configurada correctamente y que apunte a la función Lambda correcta.

---

## Monitoreo y Optimización

### Monitorear Invocaciones de Lambda

En la consola de Lambda, ve a **Monitorar** para ver:

- Número total de invocaciones
- Tasa de error
- Duración promedio
- Concurrencia

### Optimizar Costos

Para reducir costos en producción:

1. **Reducir memoria:** Si tu función usa menos de 512 MB, reduce la memoria asignada
2. **Optimizar código:** Reduce el tiempo de ejecución eliminando operaciones innecesarias
3. **Usar S3 Intelligent-Tiering:** Para almacenamiento de larga duración
4. **Implementar ciclo de vida:** Elimina imágenes procesadas después de 30 días

### Mejorar Rendimiento

1. **Usar Lambda Provisioned Concurrency:** Para eliminar cold starts
2. **Optimizar imágenes:** Redimensiona imágenes antes de procesar
3. **Usar caché:** Almacena resultados de filtros comunes

---

## Próximos Pasos

Después de completar esta implementación, considera:

1. **Agregar autenticación:** Implementa Cognito para controlar quién puede procesar imágenes
2. **Crear API REST:** Usa API Gateway para exponer endpoints HTTP
3. **Agregar más filtros:** Extiende `lambda_function.py` con nuevos filtros
4. **Implementar procesamiento en lote:** Usa Step Functions para procesar múltiples imágenes
5. **Agregar almacenamiento de base de datos:** Usa DynamoDB para rastrear imágenes procesadas

---

## Referencias

| # | Título | URL |
|---|---|---|
| 1 | AWS Lambda Documentation | https://docs.aws.amazon.com/lambda/ |
| 2 | Amazon S3 Documentation | https://docs.aws.amazon.com/s3/ |
| 3 | Pillow (PIL) Documentation | https://pillow.readthedocs.io/ |
| 4 | AWS IAM Best Practices | https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html |
| 5 | AWS Lambda Layers | https://docs.aws.amazon.com/lambda/latest/dg/invocation-layers.html |
| 6 | S3 Event Notifications | https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html |
| 7 | AWS Amplify Documentation | https://docs.amplify.aws/ |
| 8 | CloudWatch Logs | https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/ |

---

**Fin de la Guía de Implementación**

Para preguntas o problemas adicionales, consulta la documentación oficial de AWS o el archivo `ARQUITECTURA_AWS.md` incluido en este proyecto.
