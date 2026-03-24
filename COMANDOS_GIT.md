# 📝 COMANDOS PARA HACER COMMIT Y PUSH

## 🚀 Ejecuta estos comandos en orden:

### 1. Ver qué archivos cambiaron
```bash
git status
```

### 2. Agregar todos los cambios
```bash
git add .
```

### 3. Hacer commit
```bash
git commit -m "fix: actualizar pnpm-lock.yaml y configurar Vercel"
```

### 4. Push a GitHub
```bash
git push origin main
```

---

## ✅ Después del push:

Vercel detectará automáticamente el nuevo commit y empezará a construir de nuevo.

---

## 📋 Archivos que se van a subir:

- ✅ `pnpm-lock.yaml` (actualizado)
- ✅ `vercel.json` (nuevo)
- ✅ `.vercelignore` (nuevo)
- ✅ Todos los cambios de código que hicimos

---

## ⚠️ IMPORTANTE:

Después de hacer push, ve a Vercel y:

1. **Configura las variables de entorno** (ver DESPLIEGUE_VERCEL.md)
2. **Redeploy** el proyecto

Sin las variables de entorno, el proyecto no funcionará correctamente.
