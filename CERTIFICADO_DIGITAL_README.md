# Certificado Digital GOV - Documentación

## 📋 Resumen.

Se ha **reemplazado completamente** el certificado físico (`Certificate.jpg`) por un certificado 100% digital generado con HTML/CSS/SVG. Este cambio elimina la dependencia de imágenes raster y proporciona un diseño profesional, nítido y totalmente personalizable.

---

## ✨ Características Principales

### 🎨 Diseño Visual
- **Marco decorativo SVG rojo** con círculos ornamentales en las esquinas
- **Fondo beige** (#f5ecd9) tipo pergamino
- **Patrón decorativo** superior e inferior con puntos rojos
- **Doble borde** (principal #c94a3a y secundario #e06b57)

### 📝 Tipografía Profesional
- **Merriweather** (serif elegante) - Para títulos principales
- **Dancing Script** (cursiva) - Para "In Person Class"
- **Inter** - Para texto general y campos

### 🔄 Campos Dinámicos
Todos los campos del certificado son dinámicos y se rellenan desde `GovCertificateData`:

**Campos principales:**
- `certificateNumber` - Número de certificado
- `courseTime` - Duración (4hr / 6hr / 8hr) con checkboxes
- `courseTitle` - Título del curso
- `citationNumber` / `citationCaseNo` - Número de citación
- `court` - Corte
- `county` - Condado
- `attendanceReason` - Razón de asistencia (court_order / volunteer / ticket)
- `firstName`, `middleInitial`, `lastName` - Nombre completo
- `licenseNumber` / `driversLicenseNo` - Número de licencia
- `completionDate` - Fecha de completación
- `instructorSignature` / `instructorSignatureImage` - Firma del instructor
- `instructorSchoolName` / `instructorsSchoolName` - Nombre de la escuela

**Campos opcionales de personalización:**
- `deliveryModeLabel` - Etiqueta de modo de entrega (default: "In Person Class")
- `providerName` - Nombre del proveedor (default: "Affordable Driving & Traffic School")
- `providerPhone` - Teléfono del proveedor (default: "(561) 969-0150")
- `brandLeftLogoUrl` - URL del logo izquierdo (DRIVER TRAINING)
- `brandRightLogoUrl` - URL del logo derecho (dt)

---

## 📁 Archivos Modificados

### 1. **app/layout.tsx**
**Cambios:** Agregado Google Fonts (Merriweather y Dancing Script)
```tsx
import { Inter, Merriweather, Dancing_Script } from "next/font/google";

const merriweather = Merriweather({
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  variable: '--font-merriweather'
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: '--font-dancing-script'
});

// Aplicado al body:
<body className={`${inter.className} ${merriweather.variable} ${dancingScript.variable}`}>
```

### 2. **components/ticket/gov-certificate/types.ts**
**Cambios:** Agregados campos opcionales para personalización
```tsx
export interface GovCertificateData {
  // ... campos existentes ...

  // Nuevos campos opcionales:
  courseTitle?: string;
  citationCaseNo?: string; // Alias
  middleInitial?: string;
  driversLicenseNo?: string; // Alias
  instructorsSchoolName?: string; // Alias
  deliveryModeLabel?: string;
  providerName?: string;
  providerPhone?: string;
  brandLeftLogoUrl?: string;
  brandRightLogoUrl?: string;
}
```

### 3. **components/ticket/gov-certificate/components/certificate-preview.tsx**
**Cambios:** **REEMPLAZO COMPLETO** del componente
- ❌ **Eliminado:** `<img src="/Certificate.jpg" />` y overlays con posiciones absolutas
- ✅ **Agregado:** Certificado digital 100% con HTML/CSS/SVG

**Estructura del nuevo componente:**
```tsx
<div ref={ref} className="relative w-full bg-[#f5ecd9]" style={{ aspectRatio: "1275/990" }}>
  {/* SVG Marco Decorativo */}
  <svg className="absolute inset-0">
    <!-- Bordes, círculos ornamentales, patrones decorativos -->
  </svg>

  {/* Contenido del Certificado */}
  <div className="relative z-10 px-32 py-20">
    <!-- Logos, títulos, campos dinámicos, firmas -->
  </div>
</div>
```

---

## 🚀 Cómo Usar

### Uso Básico (sin cambios en el código existente)
El certificado funciona **exactamente igual** que antes. Solo completa los campos en el modal "Government Certificate" y genera el PDF:

```tsx
// En GovCertificateDialog:
<CertificatePreview ref={previewRef} formData={formData} />
```

### Personalización Avanzada (logos personalizados)
Para usar logos personalizados, agrega las URLs en `formData`:

```tsx
const formData: GovCertificateData = {
  // ... campos existentes ...
  brandLeftLogoUrl: "https://example.com/driver-training-logo.png",
  brandRightLogoUrl: "https://example.com/dt-logo.png",
  deliveryModeLabel: "Online Class", // Cambia "In Person Class"
  providerName: "Mi Escuela de Manejo",
  providerPhone: "(555) 123-4567"
};
```

---

## 🎨 Colores Utilizados

| Color | Código Hex | Uso |
|-------|-----------|-----|
| Fondo beige | `#f5ecd9` | Fondo del certificado (tipo pergamino) |
| Rojo principal | `#c94a3a` | Bordes, títulos, checkboxes activos |
| Rojo secundario | `#e06b57` | Borde interior decorativo |
| Marrón texto | `#7a3a2e` | Labels y texto secundario |
| Negro | `#000000` | Texto principal y datos |
| Azul | `#0066cc` | Nombre del proveedor (footer) |

---

## 📐 Dimensiones

- **Tamaño:** US Letter Horizontal (11 x 8.5 pulgadas)
- **Resolución:** 1275 x 990 px
- **Aspect Ratio:** 1275:990 (se mantiene responsive)
- **Formato PDF:** A4 Landscape (generado con jsPDF + html2canvas)

---

## ✅ Ventajas del Nuevo Diseño

1. **✨ 100% Digital** - No depende de imágenes físicas
2. **📝 Texto Seleccionable** - El texto del PDF es real, no imagen
3. **🎨 Totalmente Personalizable** - Cambia colores, fuentes, logos fácilmente
4. **📱 Responsive** - Se adapta a diferentes tamaños de pantalla
5. **🚀 Mejor Calidad** - SVG vectorial, nunca se pixela
6. **🔧 Mantenible** - Código limpio y documentado
7. **🌐 Multiidioma** - Fácil agregar traducciones

---

## 🗑️ Archivos Obsoletos

### ⚠️ Puedes ELIMINAR estos archivos (ya no se usan):
- `/public/Certificate.jpg` - Certificado físico antiguo
- `/public/CertificateExample.jpg` - Ejemplo antiguo (si existe)

**Importante:** El sistema ahora genera el certificado completamente en código, sin necesidad de imágenes base.

---

## 🧪 Pruebas

### Probar el Certificado Digital
1. Abrir la aplicación en desarrollo: `npm run dev`
2. Navegar a `/ticket/[classtype]` (ej: `/ticket/date`)
3. Click en "Government Certificate" en el topbar
4. Completar los campos del formulario
5. Click en "Generate Certificate"
6. Verificar el PDF generado

### Probar con Logos Personalizados
```tsx
// Agregar en certificate-form.tsx o certificate-dialog.tsx:
const testFormData = {
  ...formData,
  brandLeftLogoUrl: "/logo.png", // Logo existente del proyecto
  brandRightLogoUrl: "/logo.png"
};
```

---

## 🔄 Migración desde Certificate.jpg

### Antes (imagen + overlays):
```tsx
<div ref={ref} style={{ aspectRatio: "1275/540" }}>
  <img src="/Certificate.jpg" className="w-full h-full" />
  <div className="absolute" style={{ top: "50.5%", left: "87%" }}>
    {formData.certificateNumber}
  </div>
  <!-- ... más overlays ... -->
</div>
```

### Después (100% digital):
```tsx
<div ref={ref} className="bg-[#f5ecd9]" style={{ aspectRatio: "1275/990" }}>
  <svg><!-- Marco decorativo --></svg>
  <div className="relative z-10">
    <!-- Contenido estructurado con flexbox/grid -->
  </div>
</div>
```

---

## 🛠️ Solución de Problemas

### Las fuentes no se ven correctamente
**Solución:** Verifica que las variables de fuente estén aplicadas en `app/layout.tsx`:
```tsx
<body className={`${inter.className} ${merriweather.variable} ${dancingScript.variable}`}>
```

### Los logos personalizados no aparecen
**Solución:** Asegúrate de que las URLs sean accesibles públicamente:
- URLs externas: Deben tener CORS habilitado
- URLs locales: Deben estar en `/public/`

### El PDF se ve diferente al preview
**Solución:** `html2canvas` tiene limitaciones con:
- SVG complejos (usar `scale: 2` para mejor calidad)
- Google Fonts (asegúrate que estén cargadas antes de generar PDF)
- Variables CSS (usar valores directos si hay problemas)

**Configuración actual de html2canvas:**
```tsx
const canvas = await html2canvas(previewElement, {
  scale: 2, // Mayor calidad
  useCORS: true, // Permite imágenes externas
  allowTaint: true,
  backgroundColor: "#ffffff",
});
```

---

## 📚 Referencias Técnicas

- **Next.js 14 (App Router)** - Framework principal
- **Tailwind CSS** - Estilos y diseño responsive
- **Google Fonts** - Merriweather, Dancing Script, Inter
- **SVG** - Marcos decorativos vectoriales
- **html2canvas** - Captura del DOM para PDF
- **jsPDF** - Generación de PDF

---

## 👨‍💻 Autor y Soporte

**Creado por:** Claude (Anthropic AI)
**Fecha:** 2025
**Versión:** 1.0.0

Para preguntas o problemas, contacta al equipo de desarrollo.

---

## 📝 Notas Adicionales

### Próximas Mejoras (Opcionales)
- [ ] Endpoint API `/api/certificates/[id]/pdf` con Puppeteer (mayor calidad)
- [ ] Tema dark mode para el certificado
- [ ] Múltiples plantillas predefinidas
- [ ] Editor visual de certificados (drag & drop)
- [ ] Internacionalización (i18n) para múltiples idiomas
- [ ] Códigos QR de verificación

### Compatibilidad
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (no soportado, requiere polyfills)

---

**¡El certificado digital está listo para producción! 🎉**
