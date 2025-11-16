# 🔧 Debug de Preview en Redes Sociales

## ✅ Cambios Aplicados

### 1. **URLs Actualizadas**
- ✅ Dominio correcto: `https://charlietroneventos360.com`
- ✅ Open Graph image: URL directa de Wix (1200x630)
- ✅ Twitter Card: URL directa de Wix (1200x630)
- ✅ Schema.org: URLs actualizadas

### 2. **Imagen Open Graph Optimizada**
```html
<!-- Facebook/LinkedIn -->
<meta property="og:image" content="https://static.wixstatic.com/media/7fb206_893f39bbcc1d4a469839dce707985bf7~mv2.png/v1/fill/w_1200,h_630,al_c,q_90,usm_0.66_1.00_0.01/charlitron-logo.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://static.wixstatic.com/media/7fb206_893f39bbcc1d4a469839dce707985bf7~mv2.png/v1/fill/w_1200,h_630,al_c,q_90,usm_0.66_1.00_0.01/charlitron-logo.png" />
```

### 3. **Tamaños Recomendados para Redes Sociales**
- ✅ **Facebook/LinkedIn**: 1200x630 (ratio 1.91:1)
- ✅ **Twitter**: 1200x630 (summary_large_image)
- ✅ **WhatsApp**: Usa og:image (1200x630)

---

## 🚀 Pasos para Verificar el Logo en Redes Sociales

### 1. **Limpiar Caché de Facebook**
```
https://developers.facebook.com/tools/debug/

Pasos:
1. Pega tu URL: https://charlietroneventos360.com
2. Click en "Debug"
3. Click en "Scrape Again" para forzar actualización
4. Verifica que aparezca la imagen del logo
```

### 2. **Limpiar Caché de Twitter**
```
https://cards-dev.twitter.com/validator

Pasos:
1. Pega tu URL: https://charlietroneventos360.com
2. Click en "Preview card"
3. Verifica que aparezca la imagen
```

### 3. **Limpiar Caché de LinkedIn**
```
https://www.linkedin.com/post-inspector/

Pasos:
1. Pega tu URL: https://charlietroneventos360.com
2. Click en "Inspect"
3. Verifica la preview
```

### 4. **WhatsApp**
WhatsApp usa Open Graph automáticamente. Para forzar actualización:
- Envía el link en un chat contigo mismo
- Si no aparece, espera 24hrs o usa los debuggers de arriba primero

---

## 🐛 Troubleshooting

### ❌ **Problema: No aparece el logo**
**Solución:**
1. Verifica que el sitio esté desplegado en producción
2. Usa Facebook Debugger para limpiar caché
3. Espera 5-10 minutos después de limpiar caché
4. Vuelve a compartir el link

### ❌ **Problema: Aparece logo viejo**
**Solución:**
1. Ejecuta "Scrape Again" en Facebook Debugger
2. Borra el mensaje anterior y vuelve a compartir
3. Si persiste, verifica que el archivo esté en producción

### ❌ **Problema: Imagen muy pequeña**
**Solución:**
Las URLs actuales ya están optimizadas a 1200x630. Si se ve pequeña:
1. Verifica que `og:image:width` y `og:image:height` estén correctos
2. Usa `summary_large_image` en Twitter (ya está configurado)

---

## 📝 Verificación Rápida

Después de desplegar, verifica estos meta tags en el HTML:

```bash
curl -s https://charlietroneventos360.com | grep -A 2 "og:image"
```

Deberías ver:
```html
<meta property="og:image" content="https://static.wixstatic.com/media/7fb206_893f39bbcc1d4a469839dce707985bf7~mv2.png/v1/fill/w_1200,h_630..." />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

## ✅ Checklist Final

Antes de compartir en redes:
- [ ] Código desplegado en producción
- [ ] Facebook Debugger ejecutado (Scrape Again)
- [ ] Twitter Card Validator ejecutado
- [ ] Logo aparece en preview de Facebook
- [ ] Logo aparece en preview de Twitter
- [ ] Compartir link de prueba en WhatsApp

---

## 💡 Notas Importantes

1. **Caché de redes sociales**: Facebook/Twitter cachean las previews por 24-48 horas
2. **Primera vez**: Puede tardar hasta 5 minutos en aparecer
3. **URL directa de Wix**: Más confiable que servir desde tu servidor
4. **Formato PNG**: Mejor compatibilidad que JPG para logos
5. **Dimensiones**: 1200x630 es el estándar para todas las redes

---

## 🔗 Links Útiles

- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Open Graph Protocol: https://ogp.me/
- Twitter Cards Guide: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
