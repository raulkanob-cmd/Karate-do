# 🥋 Karate Do Loma Dorada — Formulario de Inscripción

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-sitio%20est%C3%A1tico-blue)
![HTML](https://img.shields.io/badge/HTML5-sem%C3%A1ntico-E34F26)
![CSS](https://img.shields.io/badge/CSS3-soft%20brutalism-1572B6)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E)
![WCAG](https://img.shields.io/badge/Accesibilidad-WCAG%202.1%20AA-success)

Sitio estático de la **Escuela Karate Do Loma Dorada** con el formulario oficial de
inscripción escolar: wizard de **4 pasos**, validación accesible, modo oscuro,
barra de progreso siempre visible y envío del resumen por **WhatsApp al 477 673 7908**
con animación de kanji japoneses 🇯🇵.

> **Vista previa en vivo:** <https://raulkanob-cmd.github.io/Karate-do/>

---

## ✨ Características

- **Wizard de 4 pasos** (datos personales → contacto/tutor → modalidad/horario → historial)
  con barra de progreso *sticky* sobre la tarjeta del formulario y navegación por puntos.
- **Validación accesible** WCAG 2.1 AA: `aria-invalid`, `aria-describedby`, resumen con
  `role="alert"`, foco visible (`:focus-visible`), trampa de foco en el modal, `Escape` para cerrar
  y soporte de `prefers-reduced-motion`.
- **Modo día/noche** como icono único en el header (persiste en `localStorage`).
- **Envío por WhatsApp**: mensaje preformateado a `wa.me/5214776737908` (el usuario pulsa el
  botón dentro del modal; nada se envía a un servidor).
- **Responsive de 320px a escritorio**, sin scroll horizontal y con inputs ≥16px (sin zoom en iOS).
- **Imágenes optimizadas** con FFmpeg (`hero` 810 KB → 134 KB JPG + 84 KB WebP).
- **SEO + Open Graph + Schema.org + robots + sitemap + llms.txt** listos para indexación.

---

## 📁 Estructura del proyecto

```
Karate-do/
├── index.html              ← página única (formulario, modal, footer con mapa)
├── css/styles.css          ← todo el estilo (temas, wizard, responsive, accesibilidad)
├── js/app.js               ← wizard, validación, kanji, WhatsApp, modo oscuro
├── assets/images/          ← fotos, favicon e iconos (ver tabla de imágenes)
│
│  ── Archivos para GitHub Pages / SEO ──
├── manifest.webmanifest    ← [PWA] manifest del sitio (iconos, colores, modo standalone)
├── robots.txt              ← [ROBOTS] instrucciones para rastreadores + sitemap
├── sitemap.xml             ← [SITEMAP] mapa del sitio
├── llms.txt                ← [LLM] ficha del sitio para asistentes de IA
├── favicon.ico             ← [FAVICON] respaldo clásico 48px
├── .nojekyll               ← le dice a GitHub Pages que sirva los archivos tal cual
├── .gitignore              ← [GITIGNORE] node_modules, OS, editores, temporales
├── package.json            ← scripts npm (start, test)
├── tests/test.js           ← 73 pruebas con jsdom
└── README.md               ← este archivo
```

### 🔍 ¿Dónde está cada cosa? (comentarios para reconocerla)

| Qué | Dónde | Cómo reconocerlo |
|---|---|---|
| Metas SEO (description, canonical, robots, theme-color) | `index.html` `<head>` | Comentario `═══ [SEO] Metas básicas ═══` |
| Open Graph + Twitter Card | `index.html` `<head>` | Comentario `═══ [OG] Open Graph + Twitter Card ═══` |
| Favicon + manifest | `index.html` `<head>` | Comentario `═══ [FAVICON] + [PWA] manifest ═══` |
| Datos estructurados Schema.org (JSON-LD) | `index.html` `<head>` | Comentario `═══ [SCHEMA] ═══` |
| Imagen optimizada del hero (`<picture>` + WebP) | `index.html` hero | Comentario `<!-- [PERFORMANCE] ... -->` |
| Rastreadores | `robots.txt` | Primera línea `# [ROBOTS] ...` |
| Mapa del sitio | `sitemap.xml` | Comentario XML `<!-- [SITEMAP] ... -->` |
| Ficha para IAs | `llms.txt` | Primer encabezado `# Escuela Karate Do Loma Dorada` |
| Manifest PWA | `manifest.webmanifest` | Campos `name`, `icons`, `theme_color` |
| Iconos del sitio | `assets/images/` | `favicon-*`, `apple-touch-icon`, `icon-192/512` |
| Ignorados por Git | `.gitignore` | Comentario `# [GITIGNORE] ...` |

> **Importante:** si renombras el repositorio, busca y reemplaza
> `https://raulkanob-cmd.github.io/Karate-do/` en: `index.html` (SEO/OG/SCHEMA),
> `robots.txt`, `sitemap.xml` y `llms.txt`.

---

## 🖼️ Imágenes

| Archivo | Uso | Tamaño |
|---|---|---|
| `hero_karate.jpg` | Foto principal (respaldo) | 134 KB (antes 810 KB) |
| `hero_karate.webp` | Foto principal (navegadores modernos) | 84 KB |
| `og-cover.png` | Portada al compartir el enlace (1200×630) | 736 KB * |
| `favicon.svg` / `favicon-16/32.png` / `favicon.ico` | Pestaña del navegador | < 5 KB |
| `apple-touch-icon.png` | Icono en iPhone/iPad (180×180) | 5 KB |
| `icon-192/512.png` + `icon-512-maskable.png` | Iconos PWA/manifest | 9–26 KB |

\* El cover es **PNG sin pérdida** a propósito: es el formato con soporte garantizado en
WhatsApp/Facebook. Solo lo descarga el rastreador al compartir, **no afecta** la carga de la página.

**Herramientas de optimización usadas:**
- **FFmpeg 9.0.2** (`-q:v 4` para JPEG, `libwebp -preset photo` para WebP, compresión del PNG del cover).
- **Pillow** (Python) para redimensionar, generar el cover y dibujar los favicons (kanji 空).

---

## 🚀 Desarrollo local

```bash
# opción1: Python
python -m http.server 8080
# opción2: Node
npx http-server -p 8080 -c-1 .
```

Abre <http://localhost:8080>.

## 🧪 Pruebas (73 pruebas con jsdom)

```bash
npm install     # instala jsdom (una sola vez)
npm test        # ejecuta tests/test.js
```

Cubre: navegación del wizard, validación por paso, accesibilidad (ARIA), modal con trampa
de foco, mensaje de WhatsApp, kanji al enviar, reinicio del formulario, tema oscuro,
SEO/OG/robots en HTML y ausencia de elementos obsoletos.

## 🌐 Despliegue en GitHub Pages

1. Sube el proyecto a GitHub (`git push origin main`).
2. En el repositorio: **Settings → Pages → Source: Deploy from a branch → rama `main` / carpeta `/ (root)`** → *Save*.
3. En unos segundos queda en `https://raulkanob-cmd.github.io/Karate-do/`.
4. Verifica con las [pruebas de Rich Results de Google](https://search.google.com/test/rich-results)
   y el [Sharing Debugger de Meta](https://developers.facebook.com/tools/debug/) que el cover y el
   JSON-LD se lean correctamente.

> El archivo `.nojekyll` evita que GitHub Pages procese el sitio con Jekyll.

## ✅ Accesibilidad (WCAG 2.1 AA)

- Skip link, jerarquía de encabezados (un solo `h1`), lenguaje `es-MX`.
- Campos con etiqueta + `aria-describedby` + `aria-invalid`; errores anunciados con `role="alert"`.
- Modal como `role="dialog"` con trampa de foco, cierre con `Escape` y clic en el fondo.
- Contraste AA en ambos temas (rojo profundo `#C52219` para texto sobre blanco).
- Animaciones desactivadas con `prefers-reduced-motion: reduce`.

## 📇 Contacto

- **WhatsApp:** [477 673 7908](https://wa.me/5214776737908)
- **Facebook:** [Karate Do Loma Dorada](https://www.facebook.com/profile.php?id=61581570449597)
- **Ubicación:** Loma Dorada, León, Guanajuato — [Google Maps](https://maps.app.goo.gl/w9wsZBPoF5JBn1ok6)
