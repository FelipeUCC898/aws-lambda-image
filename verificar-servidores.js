#!/usr/bin/env node

/**
 * Script para verificar que los servidores estén corriendo
 */

console.log('🔍 Verificando servidores...\n');

async function checkServer(name, url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`✅ ${name} está corriendo en ${url}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} NO está corriendo en ${url}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('1️⃣ Verificando Frontend (puerto 3001)...');
  const frontendOk = await checkServer('Frontend', 'http://localhost:3001');
  
  console.log('\n2️⃣ Verificando Backend (puerto 3002)...');
  const backendOk = await checkServer('Backend', 'http://localhost:3002');
  
  console.log('\n' + '='.repeat(50));
  
  if (frontendOk && backendOk) {
    console.log('✅ Ambos servidores están corriendo correctamente');
    console.log('\n🎉 Puedes usar la aplicación en: http://localhost:3001');
  } else {
    console.log('❌ Hay servidores que no están corriendo\n');
    console.log('📝 Para iniciar los servidores:');
    console.log('   Opción 1: npm run dev:all');
    console.log('   Opción 2: Dos terminales separadas');
    console.log('      Terminal 1: npm run dev:server');
    console.log('      Terminal 2: npm run dev');
  }
  
  console.log('='.repeat(50));
}

main();
