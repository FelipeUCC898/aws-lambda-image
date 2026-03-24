#!/usr/bin/env node

/**
 * Script para verificar que todo está configurado correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuración del proyecto...\n');

let hasErrors = false;

// 1. Verificar archivo .env
console.log('1️⃣ Verificando archivo .env (backend)...');
if (fs.existsSync('.env')) {
  console.log('   ✅ Archivo .env existe');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const requiredVars = ['AWS_REGION', 'AWS_INPUT_BUCKET', 'AWS_OUTPUT_BUCKET'];
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`   ✅ ${varName} configurado`);
    } else {
      console.log(`   ❌ ${varName} NO configurado`);
      hasErrors = true;
    }
  });
} else {
  console.log('   ❌ Archivo .env NO existe');
  hasErrors = true;
}

// 2. Verificar archivo client/.env.local
console.log('\n2️⃣ Verificando archivo client/.env.local (frontend)...');
if (fs.existsSync('client/.env.local')) {
  console.log('   ✅ Archivo client/.env.local existe');
  const envContent = fs.readFileSync('client/.env.local', 'utf-8');
  const requiredVars = ['VITE_AWS_REGION', 'VITE_AWS_INPUT_BUCKET', 'VITE_AWS_OUTPUT_BUCKET', 'VITE_API_URL'];
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`   ✅ ${varName} configurado`);
    } else {
      console.log(`   ❌ ${varName} NO configurado`);
      hasErrors = true;
    }
  });
} else {
  console.log('   ❌ Archivo client/.env.local NO existe');
  hasErrors = true;
}

// 3. Verificar node_modules
console.log('\n3️⃣ Verificando dependencias...');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ node_modules existe');
  
  // Verificar dependencias críticas
  const criticalDeps = ['express', 'dotenv', 'concurrently', '@aws-sdk/client-s3'];
  criticalDeps.forEach(dep => {
    if (fs.existsSync(`node_modules/${dep}`)) {
      console.log(`   ✅ ${dep} instalado`);
    } else {
      console.log(`   ❌ ${dep} NO instalado`);
      hasErrors = true;
    }
  });
} else {
  console.log('   ❌ node_modules NO existe. Ejecuta: npm install');
  hasErrors = true;
}

// 4. Verificar archivos del servidor
console.log('\n4️⃣ Verificando archivos del servidor...');
const serverFiles = [
  'server/index.ts',
  'server/routes/presigned-urls.ts'
];
serverFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} existe`);
  } else {
    console.log(`   ❌ ${file} NO existe`);
    hasErrors = true;
  }
});

// 5. Verificar archivos del cliente
console.log('\n5️⃣ Verificando archivos del cliente...');
const clientFiles = [
  'client/src/App.tsx',
  'client/src/pages/Home.tsx',
  'client/src/components/ImageUploader.tsx',
  'client/src/lib/s3-utils.ts',
  'client/src/lib/aws-config.ts'
];
clientFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} existe`);
  } else {
    console.log(`   ❌ ${file} NO existe`);
    hasErrors = true;
  }
});

// Resumen
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Se encontraron errores en la configuración');
  console.log('\n📝 Acciones recomendadas:');
  console.log('   1. Ejecuta: npm install');
  console.log('   2. Verifica que los archivos .env existan');
  console.log('   3. Revisa INSTRUCCIONES_DESARROLLO.md');
  process.exit(1);
} else {
  console.log('✅ Todo está configurado correctamente');
  console.log('\n🚀 Puedes iniciar el proyecto con:');
  console.log('   npm run dev:all');
  console.log('\n   O por separado:');
  console.log('   Terminal 1: npm run dev:server');
  console.log('   Terminal 2: npm run dev');
}
console.log('='.repeat(50));
