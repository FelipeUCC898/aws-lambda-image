# 🚀 Instrucciones de Desarrollo

## Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

Ya están configuradas en:
- `.env` (backend - puerto 3002) - ✅ Creado
- `client/.env.local` (frontend - puerto 3001) - ✅ Creado

### 3. Configurar credenciales de AWS

Asegúrate de tener tus credenciales de AWS configuradas:

**Opción 1: Variables de entorno**
```bash
# Windows (PowerShell)
$env:AWS_ACCESS_KEY_ID="tu_access_key"
$env:AWS_SECRET_ACCESS_KEY="tu_secret_key"

# Windows (CMD)
set AWS_ACCESS_KEY_ID=tu_access_key
set AWS_SECRET_ACCESS_KEY=tu_secret_key
```

**Opción 2: Archivo de credenciales**
Crea el archivo `~/.aws/credentials`:
```
[default]
aws_access_key_id = tu_access_key
aws_secret_access_key = tu_secret_key
```

## Iniciar el Proyecto

### Opción 1: Iniciar todo junto (RECOMENDADO)
```bash
npm run dev:all
```

Esto iniciará:
- Frontend en `http://localhost:3001`
- Backend en `http://localhost:3002`

### Opción 2: Iniciar por separado

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Verificar que todo funciona

1. Abre el navegador en `http://localhost:3001`
2. Abre la consola del navegador (F12)
3. Selecciona una imagen
4. Haz clic en "PROCESAR IMAGEN"
5. Deberías ver estos logs:

```
🚀 Iniciando proceso de subida
📁 Archivo: tu-imagen.jpg
🎨 Filtro: grayscale
⏰ Timestamp: 1774332398009
📡 Solicitando URL presignada...
✅ URL presignada obtenida
⬆️ Subiendo archivo a S3...
✅ Archivo subido exitosamente
🔄 Iniciando polling para imagen procesada...
   Intento 1/15...
   Intento 2/15...
   ✅ Imagen procesada encontrada: processed/grayscale_grayscale_..._1774332398009_...
📥 Descargando imagen procesada...
✅ URL de descarga obtenida
🎉 Proceso completado exitosamente
```

## Solución de Problemas

### Error: "POST http://localhost:3002/api/presigned-upload-url 404"

**Causa:** El servidor backend no está corriendo.

**Solución:** Asegúrate de ejecutar `npm run dev:server` o `npm run dev:all`

### Error: "CORS"

**Causa:** El backend no está permitiendo peticiones del frontend.

**Solución:** Ya está configurado en `server/index.ts` con headers CORS.

### Error: "AWS credentials not found"

**Causa:** No tienes credenciales de AWS configuradas.

**Solución:** Configura tus credenciales de AWS:

```bash
# Windows
set AWS_ACCESS_KEY_ID=tu_access_key
set AWS_SECRET_ACCESS_KEY=tu_secret_key

# O crea el archivo ~/.aws/credentials
```

## Estructura del Proyecto

```
.
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── lib/         # Utilidades (S3, AWS config)
│   │   └── pages/       # Páginas
│   └── .env.local       # Variables de entorno del frontend
├── server/              # Backend Express
│   ├── routes/          # Rutas de la API
│   └── index.ts         # Servidor principal
├── .env                 # Variables de entorno del backend
└── package.json         # Scripts y dependencias
```

## Scripts Disponibles

- `npm run dev` - Inicia solo el frontend (puerto 3001)
- `npm run dev:server` - Inicia solo el backend (puerto 3000)
- `npm run dev:all` - Inicia frontend y backend juntos
- `npm run build` - Construye para producción
- `npm run start` - Inicia en modo producción
- `npm run check` - Verifica tipos de TypeScript
- `npm run format` - Formatea el código con Prettier

## Flujo de Procesamiento de Imágenes

1. Usuario selecciona imagen en el frontend y elige un filtro
2. Frontend captura timestamp (Date.now()) ANTES de subir
3. Frontend solicita URL presignada al backend (`POST /api/presigned-upload-url`)
4. Backend genera URL presignada usando AWS SDK
5. Frontend sube la imagen directamente a S3 (bucket de entrada)
6. Lambda se activa automáticamente cuando detecta la nueva imagen en S3
7. Lambda procesa la imagen aplicando el filtro
8. Lambda guarda la imagen procesada en el bucket de salida
9. Frontend hace polling cada 2 segundos buscando la imagen procesada por timestamp
10. Frontend encuentra la imagen procesada (con nombre complejo que incluye el filtro repetido)
11. Frontend descarga la imagen procesada usando URL presignada
12. Frontend muestra la imagen procesada en la galería

## Próximos Pasos

- [ ] Configurar credenciales de AWS
- [ ] Verificar que los buckets S3 existen
- [ ] Desplegar la función Lambda
- [ ] Configurar el trigger S3 → Lambda
- [ ] Probar el flujo completo
