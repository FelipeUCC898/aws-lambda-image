#!/bin/bash

# Script de Configuración Rápida - Procesador de Imágenes AWS
# Este script automatiza la creación de recursos en AWS
# Uso: ./setup-aws.sh

set -e

echo "=========================================="
echo "Procesador de Imágenes AWS - Setup"
echo "=========================================="
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI no está instalado"
    echo "Instálalo con: pip install awscli"
    exit 1
fi

# Obtener región
read -p "Ingresa tu región AWS (ej. us-east-1): " AWS_REGION
export AWS_DEFAULT_REGION=$AWS_REGION

# Obtener nombre único
read -p "Ingresa un nombre único para los buckets (ej. mi-proyecto-123): " UNIQUE_NAME
INPUT_BUCKET="image-processor-input-${UNIQUE_NAME}"
OUTPUT_BUCKET="image-processor-output-${UNIQUE_NAME}"

echo ""
echo "Configuración:"
echo "  Región: $AWS_REGION"
echo "  Bucket Entrada: $INPUT_BUCKET"
echo "  Bucket Salida: $OUTPUT_BUCKET"
echo ""

# Crear buckets S3
echo "📦 Creando buckets S3..."
aws s3api create-bucket \
    --bucket "$INPUT_BUCKET" \
    --region "$AWS_REGION" \
    $(if [ "$AWS_REGION" != "us-east-1" ]; then echo "--create-bucket-configuration LocationConstraint=$AWS_REGION"; fi) \
    2>/dev/null || echo "⚠️  Bucket de entrada ya existe"

aws s3api create-bucket \
    --bucket "$OUTPUT_BUCKET" \
    --region "$AWS_REGION" \
    $(if [ "$AWS_REGION" != "us-east-1" ]; then echo "--create-bucket-configuration LocationConstraint=$AWS_REGION"; fi) \
    2>/dev/null || echo "⚠️  Bucket de salida ya existe"

# Bloquear acceso público
echo "🔒 Bloqueando acceso público a buckets..."
aws s3api put-public-access-block \
    --bucket "$INPUT_BUCKET" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-public-access-block \
    --bucket "$OUTPUT_BUCKET" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Crear rol IAM
echo "👤 Creando rol IAM..."
ROLE_NAME="ImageProcessorLambdaRole"

aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' 2>/dev/null || echo "⚠️  Rol ya existe"

# Adjuntar política de ejecución básica
echo "📋 Adjuntando políticas..."
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
    2>/dev/null || echo "⚠️  Política ya adjunta"

# Crear política personalizada para S3
POLICY_NAME="S3ImageProcessorPolicy"
POLICY_DOCUMENT="{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
        {
            \"Effect\": \"Allow\",
            \"Action\": [\"s3:GetObject\"],
            \"Resource\": \"arn:aws:s3:::${INPUT_BUCKET}/*\"
        },
        {
            \"Effect\": \"Allow\",
            \"Action\": [\"s3:PutObject\"],
            \"Resource\": \"arn:aws:s3:::${OUTPUT_BUCKET}/*\"
        }
    ]
}"

aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT"

echo ""
echo "✅ Configuración de AWS completada"
echo ""
echo "Próximos pasos:"
echo "1. Crear Lambda Layer con Pillow (ver GUIA_IMPLEMENTACION.md)"
echo "2. Desplegar función Lambda"
echo "3. Configurar notificaciones de eventos S3"
echo ""
echo "Información de recursos:"
echo "  Rol IAM: $ROLE_NAME"
echo "  Bucket Entrada: $INPUT_BUCKET"
echo "  Bucket Salida: $OUTPUT_BUCKET"
echo ""
