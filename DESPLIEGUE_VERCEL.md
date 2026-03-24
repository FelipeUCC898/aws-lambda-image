# 🚀 GUÍA DE DESPLIEGUE EN VERCEL

## ❌ PROBLEMA QUE TENÍAS:

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" 
because pnpm-lock.yaml is not up to date with package.json
```

## ✅ SOLUCIÓN APLICADA:

### 1. Actualizado `pnpm-lock.yaml`
Ejecuté `pnpm install` para regenerar el lockfile.

### 2. Creado `vercel.json`
Configuración para que Vercel sepa cómo construir el proyecto:

```json
{
  "version": 2,
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist/public",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "framework": null
}
```

**Nota importante:** `--no-frozen-lockfile` permite que Vercel instale aunque haya pequeñas diferencias.

### 3. Creado `.vercelignore`
Para excluir archivos innecesarios del despliegue.

---

## 🚀 PASOS PARA DESPLEGAR:

### 1. Hacer commit de los cambios

```bash
git add .
git commit -m "fix: actualizar pnpm-lock.yaml y configurar Vercel"
git push origin main
```

### 2. Configurar variables de entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

**Variables requeridas:**
```
AWS_REGION=us-east-1
AWS_INPUT_BUCKET=image-processor-input-felipe-1
AWS_OUTPUT_BUCKET=image-processor-output-felipe-2
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
PORT=3002
```

**Variables del frontend (con prefijo VITE_):**
```
VITE_AWS_REGION=us-east-1
VITE_AWS_INPUT_BUCKET=image-processor-input-felipe-1
VITE_AWS_OUTPUT_BUCKET=image-processor-output-felipe-2
VITE_LAMBDA_FUNCTION_NAME=ImageFilterProcessor
VITE_API_URL=https://tu-proyecto.vercel.app
```

⚠️ **IMPORTANTE:** Cambia `VITE_API_URL` a la URL de tu proyecto en Vercel (ej: `https://aws-lambda-image.vercel.app`)

### 3. Redeploy en Vercel

Después de configurar las variables de entorno:
1. Ve a Deployments
2. Haz clic en los tres puntos del último deployment
3. Selecciona "Redeploy"

---

## ⚠️ CONSIDERACIONES IMPORTANTES:

### 1. Vercel es Serverless

Vercel NO mantiene un servidor Express corriendo 24/7. Cada request inicia una función serverless.

**Esto significa:**
- ✅ El frontend funcionará perfectamente
- ❌ El backend Express NO funcionará como está

### 2. Opciones para el Backend:

#### Opción A: Usar Vercel Serverless Functions (RECOMENDADO)

Necesitas convertir las rutas de Express a funciones serverless de Vercel.

**Estructura:**
```
api/
  presigned-upload-url.ts
  presigned-download-url.ts
  list-processed-images.ts
```

#### Opción B: Desplegar Backend en otro servicio

- **Railway:** Soporta Node.js con Express
- **Render:** Soporta Node.js con Express
- **Heroku:** Soporta Node.js con Express
- **AWS EC2/ECS:** Más control pero más complejo

#### Opción C: Solo Frontend en Vercel

Desplegar solo el frontend en Vercel y mantener el backend en tu máquina local o en otro servicio.

---

## 🔧 CONVERSIÓN A VERCEL SERVERLESS FUNCTIONS

Si quieres usar Vercel para todo, necesitas crear funciones serverless:

### Ejemplo: `api/presigned-upload-url.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, filter } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename es requerido' });
    }

    const key = `uploads/${filter}_${Date.now()}_${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_INPUT_BUCKET,
      Key: key,
      ContentType: 'image/*',
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });

    return res.json({ presignedUrl, key });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error generando URL presignada' });
  }
}
```

---

## 📝 RESUMEN:

1. ✅ **Lockfile actualizado** - Ya no tendrás el error de pnpm
2. ✅ **vercel.json creado** - Vercel sabe cómo construir el proyecto
3. ⚠️ **Backend necesita adaptación** - Express no funciona directamente en Vercel

---

## 🎯 RECOMENDACIÓN:

Para un despliegue rápido:

1. **Frontend en Vercel** (funciona out-of-the-box)
2. **Backend en Railway o Render** (soportan Express sin cambios)

O si prefieres todo en Vercel:

1. Convertir rutas de Express a Vercel Serverless Functions
2. Crear carpeta `api/` con las funciones
3. Actualizar `VITE_API_URL` para apuntar a `/api`

---

¿Quieres que te ayude a:
- A) Convertir el backend a Vercel Serverless Functions
- B) Configurar el backend en Railway/Render
- C) Solo desplegar el frontend en Vercel
