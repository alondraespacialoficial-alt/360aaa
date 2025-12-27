#!/bin/bash
# Script para limpiar console.log innecesarios de la aplicación

echo "🧹 Limpiando console.log de la aplicación..."

# Archivos principales a limpiar
FILES=(
  "services/supabaseClient.ts"
  "services/aiAssistant.ts"
  "services/providerRegistration.ts"
  "context/AIStatusContext.tsx"
)

# Crear backup
echo "📦 Creando backup..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.backup"
    echo "  ✅ Backup: $file.backup"
  fi
done

# Función para comentar console.log pero mantener console.error
clean_file() {
  local file=$1
  echo "🔍 Procesando: $file"
  
  # Comentar console.log, console.info, console.debug, console.warn
  # PERO mantener console.error sin cambios
  sed -i.tmp \
    -e 's/^\(\s*\)console\.log(/\1\/\/ console.log(/' \
    -e 's/^\(\s*\)console\.info(/\1\/\/ console.info(/' \
    -e 's/^\(\s*\)console\.debug(/\1\/\/ console.debug(/' \
    -e 's/^\(\s*\)console\.warn(/\1\/\/ console.warn(/' \
    "$file"
  
  rm "$file.tmp"
  echo "  ✅ Limpiado: $file"
}

# Limpiar cada archivo
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    clean_file "$file"
  else
    echo "  ⚠️  No encontrado: $file"
  fi
done

echo ""
echo "✅ Limpieza completada!"
echo "📝 Los archivos originales están en *.backup"
echo "🔄 Para restaurar: mv archivo.backup archivo"
