# Arquitectura AWS - Procesador de Imágenes

## Descripción General

Este documento describe la arquitectura completa del servicio de procesamiento de imágenes utilizando AWS Lambda, Amazon S3 y otros servicios complementarios. La arquitectura sigue un patrón **event-driven** (basado en eventos) donde el usuario sube una imagen a un bucket S3, lo que dispara automáticamente una función Lambda que aplica filtros y guarda el resultado en otro bucket.

---

## Componentes Principales

### 1. Amazon S3 - Buckets de Almacenamiento

| Componente | Descripción | Propósito |
|---|---|---|
| **S3 Bucket de Entrada** | `image-processor-input-{timestamp}` | Almacena las imágenes originales subidas por los usuarios |
| **S3 Bucket de Salida** | `image-processor-output-{timestamp}` | Almacena las imágenes procesadas con filtros aplicados |

**Configuración:**
- Ambos buckets en la misma región (ej. `us-east-1`)
- Versionado deshabilitado (para reducir costos)
- Ciclo de vida: eliminar objetos después de 30 días (opcional)
- Acceso público: deshabilitado (seguridad)
- Notificaciones de eventos: el bucket de entrada notifica a Lambda

### 2. AWS Lambda - Función de Procesamiento

**Nombre:** `ImageFilterProcessor`

**Configuración:**
- **Runtime:** Python 3.11
- **Memoria:** 512 MB (suficiente para procesar imágenes de hasta ~10MB)
- **Timeout:** 60 segundos
- **Capas (Layers):** Pillow y dependencias (pre-compiladas para Lambda)

**Flujo de Ejecución:**
1. Lambda recibe evento de S3 (nueva imagen subida)
2. Descarga la imagen del bucket de entrada
3. Aplica el filtro seleccionado (especificado en metadatos o parámetro)
4. Guarda la imagen procesada en el bucket de salida
5. Retorna URL presignada para acceso temporal

### 3. IAM - Políticas de Acceso

**Rol de Lambda:** `ImageProcessorLambdaRole`

**Permisos necesarios:**
- `s3:GetObject` en bucket de entrada
- `s3:PutObject` en bucket de salida
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` (CloudWatch Logs)

### 4. API Gateway (Opcional)

Para permitir que el frontend invoque Lambda directamente:
- Endpoint POST: `/process-image`
- Método: Invocación síncrona
- Autenticación: API Key o CORS

### 5. CloudWatch - Monitoreo y Logs

**Logs:** Cada invocación de Lambda genera logs en CloudWatch
- Ubicación: `/aws/lambda/ImageFilterProcessor`
- Retención: 7 días (configurable)

**Métricas:**
- Invocaciones totales
- Errores
- Duración promedio
- Concurrencia

---

## Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO (Frontend)                          │
│  Selecciona imagen + filtro → Sube a S3 (Presigned URL)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              S3 BUCKET DE ENTRADA (Input)                        │
│  Almacena imagen original                                        │
│  Dispara evento: s3:ObjectCreated:Put                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AWS LAMBDA FUNCTION                             │
│  1. Descarga imagen de S3 Input                                 │
│  2. Aplica filtro (Grayscale, Blur, Sepia, etc.)              │
│  3. Guarda en S3 Output                                         │
│  4. Retorna URL presignada                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│             S3 BUCKET DE SALIDA (Output)                         │
│  Almacena imagen procesada                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO (Frontend)                          │
│  Visualiza/Descarga imagen procesada                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filtros Disponibles

La función Lambda soporta los siguientes filtros (implementados con Pillow):

| Filtro | Descripción | Parámetro |
|---|---|---|
| **Grayscale** | Convierte a escala de grises | `grayscale` |
| **Blur** | Desenfoque gaussiano | `blur` |
| **Sepia** | Efecto sepia vintage | `sepia` |
| **Edge Detection** | Detección de bordes (Sobel) | `edge` |
| **Sharpen** | Aumenta nitidez | `sharpen` |
| **Invert** | Invierte colores | `invert` |
| **Brightness** | Aumenta/reduce brillo | `brightness` |
| **Contrast** | Aumenta/reduce contraste | `contrast` |

---

## Seguridad

### Autenticación y Autorización
- **S3:** Acceso privado, solo Lambda puede leer/escribir
- **Lambda:** Invocación restringida mediante IAM roles
- **Frontend:** Presigned URLs con expiración de 15 minutos

### Validación de Entrada
- Verificar tipo MIME (solo imágenes: JPEG, PNG, WebP)
- Verificar tamaño máximo (10 MB)
- Sanitizar nombres de archivo

### Encriptación
- S3: Encriptación en reposo (SSE-S3)
- Tránsito: HTTPS obligatorio

---

## Costos Estimados (Mensual)

Asumiendo 1,000 procesamientos de imagen al mes:

| Servicio | Uso | Costo |
|---|---|---|
| **Lambda** | 1,000 invocaciones × 60s × 512MB | ~$0.10 |
| **S3 (Storage)** | 50 GB almacenados | ~$1.15 |
| **S3 (Requests)** | 2,000 GET + 1,000 PUT | ~$0.05 |
| **CloudWatch Logs** | ~10 MB logs | ~$0.50 |
| **Total** | | ~**$1.80** |

*Nota: Los primeros 1 millón de invocaciones Lambda y 5 GB de S3 son gratuitos en el tier gratuito de AWS.*

---

## Escalabilidad

- **Lambda:** Escala automáticamente hasta 1,000 invocaciones concurrentes (límite por defecto)
- **S3:** Soporta millones de objetos y petabytes de datos
- **Throughput:** Puede procesar cientos de imágenes simultáneamente

---

## Limitaciones y Consideraciones

1. **Timeout de Lambda:** 60 segundos máximo. Imágenes muy grandes pueden exceder este límite.
2. **Tamaño de payload:** Lambda tiene límite de 6 MB para payloads síncronos.
3. **Memoria disponible:** 512 MB es suficiente para imágenes típicas, pero puede aumentarse hasta 10 GB.
4. **Cold Start:** Primera invocación puede tardar 1-2 segundos (tiempo de inicio).

---

## Próximos Pasos

1. Crear los buckets S3 en AWS Console
2. Crear la función Lambda con el código Python
3. Configurar el trigger de S3 → Lambda
4. Crear el rol IAM con permisos necesarios
5. Desplegar la aplicación frontend
6. Realizar pruebas end-to-end
