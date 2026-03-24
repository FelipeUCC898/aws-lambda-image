# Procesador de Imágenes AWS - Proyecto Completo

Este proyecto es una aplicación web para procesar imágenes utilizando **AWS Lambda**, **Amazon S3** y **Pillow**. Los usuarios pueden subir imágenes, aplicar filtros automáticamente en la nube, y descargar los resultados.

## Estructura del Proyecto

```
aws-image-processor/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx            # Página principal
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx   # Componente de carga
│   │   │   └── ImageGallery.tsx    # Galería de resultados
│   │   ├── App.tsx                 # Rutas principales
│   │   └── index.css               # Estilos globales
│   └── index.html
├── lambda_function.py              # Función Lambda para procesamiento
├── ARQUITECTURA_AWS.md             # Documentación de arquitectura
├── GUIA_IMPLEMENTACION.md          # Guía paso a paso
├── ideas.md                        # Conceptos de diseño
└── README_PROYECTO.md              # Este archivo
```

## Inicio Rápido

### 1. Requisitos Previos

- Cuenta de AWS activa
- Node.js 16+ instalado
- Python 3.9+ instalado
- AWS CLI configurado (`aws configure`)

### 2. Configurar AWS

Sigue los pasos en `GUIA_IMPLEMENTACION.md`:

1. Crear buckets S3 (entrada y salida)
2. Crear rol IAM para Lambda
3. Desplegar función Lambda
4. Configurar notificaciones de eventos

### 3. Ejecutar Frontend Localmente

```bash
# Instalar dependencias
cd client
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Configurar Integración AWS

Actualiza los nombres de los buckets en:
- `client/src/pages/Home.tsx`
- Variables de entorno de Lambda

## Filtros Disponibles

| Filtro | Descripción |
|---|---|
| **Grayscale** | Convierte a escala de grises |
| **Blur** | Desenfoque gaussiano |
| **Sepia** | Efecto sepia vintage |
| **Edge** | Detección de bordes |
| **Sharpen** | Aumenta nitidez |
| **Invert** | Invierte colores |
| **Brightness** | Aumenta brillo 50% |
| **Contrast** | Aumenta contraste 50% |

## Diseño

El proyecto implementa **Minimalismo Técnico Contemporáneo**:

- **Tipografía:** IBM Plex Mono (títulos) + Inter (cuerpo)
- **Colores:** Paleta monocromática + azul industrial (#0052CC)
- **Bordes:** Cuadrados, sin border-radius
- **Espaciado:** Márgenes generosos (40-60px)
- **Layout:** Asimetría controlada (60% carga, 40% galería)

## Arquitectura

```
Usuario
  ↓
Frontend (React)
  ↓
S3 Bucket (Entrada)
  ↓
Lambda Function (Procesamiento)
  ↓
S3 Bucket (Salida)
  ↓
Frontend (Visualización)
```

## Costos Estimados

Con el tier gratuito de AWS:
- **1 millón de invocaciones Lambda** gratuitas/mes
- **5 GB de almacenamiento S3** gratuitos/mes
- **Costo estimado:** $0-2 USD/mes para uso moderado

## Documentación

- **ARQUITECTURA_AWS.md:** Detalles técnicos de componentes AWS
- **GUIA_IMPLEMENTACION.md:** Pasos detallados para configurar todo
- **ideas.md:** Conceptos de diseño y filosofía visual

## Troubleshooting

### Error: "Unable to import module 'lambda_function'"
Asegúrate de haber creado la Lambda Layer con Pillow correctamente.

### Error: "Access Denied" en S3
Verifica que el rol IAM tenga permisos para leer/escribir en los buckets.

### Las imágenes no se procesan
Revisa los logs en CloudWatch: `/aws/lambda/ImageFilterProcessor`

## Próximos Pasos

1. Agregar autenticación con Cognito
2. Crear API REST con API Gateway
3. Implementar procesamiento en lote
4. Agregar almacenamiento en DynamoDB
5. Desplegar frontend en S3 + CloudFront

## Licencia

MIT

## Autor

Proyecto desarrollado para Cloud Computing - Manus AI

---

**¿Preguntas?** Consulta la `GUIA_IMPLEMENTACION.md` para instrucciones detalladas.
