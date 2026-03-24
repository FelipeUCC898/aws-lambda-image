# 🔴 SOLUCIÓN: Error "ERR_CONNECTION_REFUSED"

## ❌ ERROR QUE ESTÁS VIENDO:

```
Failed to load resource: net::ERR_CONNECTION_REFUSED
Error obteniendo URL presignada: TypeError: Failed to fetch
```

## 🎯 CAUSA DEL ERROR:

El **backend NO está corriendo** en el puerto 3002. El frontend intenta conectarse pero no hay nada escuchando.

## ✅ SOLUCIÓN RÁPIDA:

### Paso 1: Verifica qué servidores están corriendo

```bash
npm run check-servers
```

Verás algo como:
```
❌ Frontend NO está corriendo en http://localhost:3001
❌ Backend NO está corriendo en http://localhost:3002
```

### Paso 2: Inicia los servidores

**Opción A: Todo junto (RECOMENDADO)**
```bash
npm run dev:all
```

**Opción B: Por separado**

Terminal 1:
```bash
npm run dev:server
```

Terminal 2:
```bash
npm run dev
```

### Paso 3: Verifica que estén corriendo

Deberías ver:

**Backend (Terminal 1):**
```
✅ Servidor backend corriendo en http://localhost:3002/
📡 API disponible en http://localhost:3002/api
🪣 Bucket de entrada: image-processor-input-felipe-1
🪣 Bucket de salida: image-processor-output-felipe-2
```

**Frontend (Terminal 2):**
```
VITE v7.3.1  ready in 7317 ms
➜  Local:   http://localhost:3001/
```

### Paso 4: Prueba de nuevo

1. Abre http://localhost:3001
2. Sube una imagen
3. Debería funcionar correctamente

---

## 🔍 VERIFICACIÓN ADICIONAL:

Si después de iniciar los servidores sigues viendo el error:

### 1. Verifica el puerto del backend

```bash
# En el archivo client/.env.local debe decir:
VITE_API_URL=http://localhost:3002
```

### 2. Verifica que el backend esté en el puerto correcto

```bash
# En el archivo .env debe decir:
PORT=3002
```

### 3. Reinicia el frontend después de cambiar .env.local

Si cambiaste `client/.env.local`, debes reiniciar Vite:
```bash
# Detén con Ctrl+C y vuelve a ejecutar:
npm run dev
```

---

## 📝 RESUMEN DE PUERTOS:

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3001 | http://localhost:3001 |
| Backend | 3002 | http://localhost:3002 |

---

## ⚠️ NOTA IMPORTANTE:

**NO toqué ninguna funcionalidad de subida de imágenes.** Solo aumenté el timeout del polling de 30 a 60 segundos. El error que ves es simplemente porque el backend no está corriendo.

---

## 🚀 COMANDOS ÚTILES:

```bash
# Verificar configuración
npm run check-setup

# Verificar servidores corriendo
npm run check-servers

# Iniciar todo
npm run dev:all

# Solo backend
npm run dev:server

# Solo frontend
npm run dev
```

---

## ✅ CHECKLIST:

- [ ] Backend corriendo en puerto 3002
- [ ] Frontend corriendo en puerto 3001
- [ ] `client/.env.local` tiene `VITE_API_URL=http://localhost:3002`
- [ ] `.env` tiene `PORT=3002`
- [ ] Ambos comandos ejecutados desde la raíz del proyecto
- [ ] Credenciales de AWS configuradas

---

**Si sigues teniendo problemas después de seguir estos pasos, avísame y te ayudo a diagnosticar más a fondo.**
