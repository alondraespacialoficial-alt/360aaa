# 🔧 CONFIGURACIÓN PARA CORREGIR ERRORES DEL FORMULARIO

Este documento explica cómo resolver los errores mostrados en las capturas.

## 🚨 **PROBLEMAS IDENTIFICADOS Y SOLUCIONES:**

### 1. **Error IA - "No puedo generar en este momento"**

**Problema:** Falta la clave API de Gemini para la IA

**Solución:** 
- Reemplaza `AIzaSyDummyKeyReplaceWithReal` en `.env` con tu clave real de Gemini AI
- Obtén tu clave en: https://aistudio.google.com/app/apikey

```bash
# En .env - reemplazar con clave real
VITE_GEMINI_API_KEY=TU_CLAVE_REAL_DE_GEMINI
```

### 2. **Error Paso 7 - "new row violates row-level security policy"**

**Problema:** Las políticas RLS de Supabase bloquean inserts anónimos

**Solución:** Ejecutar el script SQL de corrección:

```sql
-- Ejecutar en Supabase SQL Editor:
-- Copiar y pegar el contenido completo de:
-- /database/fix_provider_registrations_rls.sql
```

### 3. **Errores Service Worker (403, tracking prevention)**

**Problema:** Navegador bloquea service worker y tracking

**Solución:** Estos son warnings normales, no afectan funcionalidad

---

## ✅ **PASOS PARA APLICAR LAS CORRECCIONES:**

### Paso 1: Configurar Gemini AI (Opcional)
```bash
# 1. Obtener clave API de Google AI Studio
# 2. Editar .env y reemplazar la clave dummy
# 3. Reiniciar el servidor de desarrollo
npm run dev
```

### Paso 2: Corregir Base de Datos (Obligatorio)
```sql
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar TODO el contenido de database/fix_provider_registrations_rls.sql
-- 3. Pegarlo y ejecutar (Run)
-- 4. Verificar que aparezcan los mensajes de éxito
```

### Paso 3: Verificar Funcionamiento
```bash
# 1. Recargar la página del formulario
# 2. Llenar hasta el paso 7
# 3. El guardado debería funcionar correctamente
```

---

## 🔍 **VERIFICACIÓN DE CORRECCIONES:**

### ✅ IA Funcionando:
- [ ] Botón "Generar con IA" habilitado
- [ ] No muestra mensaje de "no disponible"
- [ ] Genera descripción al hacer clic

### ✅ Guardado Funcionando:
- [ ] Paso 7 se completa sin errores
- [ ] Aparece el paso 8 (selección de plan)
- [ ] No hay errores en consola

### ✅ Base de Datos:
- [ ] Tabla `provider_registrations` permite inserts
- [ ] Funciones RPC creadas exitosamente
- [ ] Políticas RLS configuradas correctamente

---

## 🆘 **SI SIGUES TENIENDO PROBLEMAS:**

### Error "GEMINI_API_KEY not found":
```bash
# Verificar que el archivo .env contiene:
VITE_GEMINI_API_KEY=TU_CLAVE_REAL

# Reiniciar servidor:
npm run dev
```

### Error "RPC function does not exist":
```sql
-- Verificar en Supabase que las funciones existen:
SELECT proname FROM pg_proc WHERE proname LIKE '%provider_registration%';

-- Debería mostrar:
-- insert_provider_registration_public
-- check_email_exists_public
```

### Error "Permission denied":
```sql
-- Verificar permisos en Supabase:
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'provider_registrations';
```

---

## 📞 **SOPORTE:**

Si necesitas ayuda adicional:
1. Verificar logs de consola del navegador
2. Revisar logs de Supabase
3. Comprobar que todas las variables de entorno están configuradas
4. Reiniciar servidor y limpiar caché del navegador

**¡Con estos cambios el formulario debería funcionar perfectamente!** 🚀