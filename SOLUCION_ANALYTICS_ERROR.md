# 🔧 SOLUCIÓN: Error URIError con %VITE_ANALYTICS_ENDPOINT%

## ❌ ERROR EN LOS LOGS:

```
URIError: Failed to decode param '/%VITE_ANALYTICS_ENDPOINT%/umami'
```

## 🎯 CAUSA:

El navegador está intentando acceder a una URL con variables de entorno sin reemplazar. Esto puede ser:
1. Cache del navegador
2. Archivos compilados antiguos en `dist/`
3. Service workers antiguos

## ✅ SOLUCIÓN:

### Paso 1: Detén los servidores
Presiona `Ctrl+C` en la terminal donde corre `npm run dev:all`

### Paso 2: Limpia el cache y archivos compilados
```bash
# Elimina la carpeta dist
rm -rf dist

# Elimina la carpeta .vite (cache de Vite)
rm -rf client/.vite

# Opcional: Limpia node_modules/.vite
rm -rf node_modules/.vite
```

### Paso 3: Reinicia los servidores
```bash
npm run dev:all
```

### Paso 4: Limpia el cache del navegador
1. Abre http://localhost:3001
2. Presiona `Ctrl+Shift+R` (recarga forzada)
3. O abre DevTools (F12) → Application → Clear storage → Clear site data

---

## 🚀 ALTERNATIVA RÁPIDA (SI LO ANTERIOR NO FUNCIONA):

### Opción A: Modo incógnito
Abre el navegador en modo incógnito y ve a http://localhost:3001

### Opción B: Otro navegador
Prueba con otro navegador (Chrome, Firefox, Edge)

---

## ✅ VERIFICACIÓN:

Después de seguir los pasos, deberías ver:

**En la terminal:**
```
✅ Servidor backend corriendo en http://localhost:3002/
📡 API disponible en http://localhost:3002/api
```

**En el navegador:**
- NO deberías ver errores de `%VITE_ANALYTICS_ENDPOINT%`
- La aplicación debería cargar correctamente

---

## 📝 NOTA:

El archivo `client/index.html` ya está limpio (sin referencias a analytics). El error es solo cache del navegador o archivos compilados antiguos.
