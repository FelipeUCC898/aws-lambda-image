/**
 * Configuración de AWS
 * 
 * Este archivo centraliza toda la configuración de AWS
 * para que sea fácil de cambiar en un solo lugar
 */

// Configuración personalizada para Felipe
export const AWS_CONFIG = {
  // Tu región de AWS
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  
  // Nombres de tus buckets S3
  buckets: {
    input: import.meta.env.VITE_AWS_INPUT_BUCKET || 'image-processor-input-felipe-1',
    output: import.meta.env.VITE_AWS_OUTPUT_BUCKET || 'image-processor-output-felipe-2',
  },
  
  // Nombre de tu función Lambda
  lambdaFunctionName: import.meta.env.VITE_LAMBDA_FUNCTION_NAME || 'ImageFilterProcessor',
  
  // URL del API backend
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  
  // Tiempo de expiración de URLs presignadas (en segundos )
  presignedUrlExpiration: 900, // 15 minutos
};

// Debug: Mostrar configuración al cargar
console.log('🔧 AWS_CONFIG cargado:');
console.log('   API URL:', AWS_CONFIG.apiUrl);
console.log('   VITE_API_URL env:', import.meta.env.VITE_API_URL);

// Validar configuración
export function validateConfig(): boolean {
  const errors: string[] = [];

  // Verificar que los buckets están configurados
  if (!AWS_CONFIG.buckets.input || AWS_CONFIG.buckets.input.includes('default')) {
    errors.push('❌ Bucket de entrada no configurado');
  }

  if (!AWS_CONFIG.buckets.output || AWS_CONFIG.buckets.output.includes('default')) {
    errors.push('❌ Bucket de salida no configurado');
  }

  if (errors.length > 0) {
    console.error('Errores de configuración:');
    errors.forEach(err => console.error(err));
    return false;
  }

  console.log('✅ Configuración de AWS válida');
  console.log(`   Región: ${AWS_CONFIG.region}`);
  console.log(`   Bucket entrada: ${AWS_CONFIG.buckets.input}`);
  console.log(`   Bucket salida: ${AWS_CONFIG.buckets.output}`);
  return true;
}
