# 📋 Sistema de Certificados - Documentación

## 🎯 Estructura Organizada

El sistema de certificados ahora está completamente centralizado y organizado para facilitar la gestión de diferentes tipos de certificados.

## 📁 Archivos Principales

### 1. **Configuración Central** (`lib/certificateConfigurations.ts`)

Este es el **archivo más importante**. Aquí defines TODO sobre cada tipo de certificado:

```typescript
export const CERTIFICATE_CONFIGURATIONS: Record<string, CertificateConfig> = {
  DATE: {
    classType: 'DATE',
    name: 'DATE Certificate (Official)',
    pdfTemplate: '/templates_certificates/date.pdf',
    certificatesPerPage: 1,           // 1 = solo un certificado por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [                  // Columnas que se muestran en la tabla
      { key: 'firstName', label: 'First Name', example: 'JORGE' },
      { key: 'lastName', label: 'Last Name', example: 'GUARIN' },
      // ... más variables
    ],
    allowCombinedPDF: false,          // false = NO muestra botón morado
  },

  ADI: {
    // ... configuración de ADI
    certificatesPerPage: 1,           // Puedes cambiar a 2 o 3
    allowCombinedPDF: false,          // Cambia a true si quieres el botón morado
  },

  BDI: {
    // ... configuración de BDI
    certificatesPerPage: 3,           // 3 certificados por hoja
    allowCombinedPDF: true,           // true = SÍ muestra botón morado
  }
};
```

### 2. **Templates** (`lib/defaultTemplates/`)

Cada tipo de certificado tiene su propio template que **lee** la configuración central:

- `dateTemplate.ts` - Template para DATE
- `adiTemplate.ts` - Template para ADI
- `bdiTemplate.ts` - Template para BDI (ya existía)

**Ejemplo de template simplificado:**
```typescript
export const getDefaultDATETemplate = () => {
  const config = CERTIFICATE_CONFIGURATIONS.DATE;  // Lee la config

  return {
    name: config.name,
    classType: config.classType,
    certificatesPerPage: config.certificatesPerPage,
    background: {
      type: 'pdf',
      value: config.pdfTemplate,  // Usa el PDF configurado
    },
    availableVariables: config.tableVariables,  // Usa las variables configuradas
    // ... resto de la configuración
  };
};
```

## 🛠️ Cómo Agregar un Nuevo Tipo de Certificado

### Paso 1: Agregar configuración

Edita `lib/certificateConfigurations.ts` y agrega tu nuevo tipo:

```typescript
export const CERTIFICATE_CONFIGURATIONS = {
  // ... DATE, ADI, BDI existentes

  NUEVO_TIPO: {
    classType: 'NUEVO_TIPO',
    name: 'Nuevo Tipo Certificate',
    pdfTemplate: '/templates_certificates/nuevo_tipo.pdf',
    certificatesPerPage: 2,  // 2 certificados por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      { key: 'customField', label: 'Custom Field', example: 'Example' },
    ],
    allowCombinedPDF: true,  // Mostrar botón morado
  },
};
```

### Paso 2: Crear template (opcional)

Si quieres un template personalizado, crea `lib/defaultTemplates/nuevoTipoTemplate.ts`:

```typescript
import { CertificateTemplate } from "@/lib/certificateTypes";
import { CERTIFICATE_CONFIGURATIONS } from "@/lib/certificateConfigurations";

export const getDefaultNuevoTipoTemplate = () => {
  const config = CERTIFICATE_CONFIGURATIONS.NUEVO_TIPO;

  return {
    name: config.name,
    classType: config.classType,
    pageSize: config.pageSize,
    certificatesPerPage: config.certificatesPerPage,
    background: { type: 'pdf', value: config.pdfTemplate },
    availableVariables: config.tableVariables,
    shapeElements: [],
    textElements: [],
    imageElements: [],
    checkboxElements: [],
    isDefault: true,
    isActive: true,
  };
};
```

### Paso 3: Actualizar page.tsx

Edita `app/(dashboard)/ticket/[classtype]/class-records/[classId]/page.tsx`:

```typescript
if (!fetchedTemplate) {
  const normalizedType = certType.toUpperCase();

  if (normalizedType === 'DATE') {
    const { getDefaultDATETemplate } = await import("@/lib/defaultTemplates/dateTemplate");
    fetchedTemplate = getDefaultDATETemplate();
  } else if (normalizedType === 'ADI') {
    const { getDefaultADITemplate } = await import("@/lib/defaultTemplates/adiTemplate");
    fetchedTemplate = getDefaultADITemplate();
  } else if (normalizedType === 'NUEVO_TIPO') {  // ← Agregar aquí
    const { getDefaultNuevoTipoTemplate } = await import("@/lib/defaultTemplates/nuevoTipoTemplate");
    fetchedTemplate = getDefaultNuevoTipoTemplate();
  } else {
    // Default BDI
  }
}
```

## 🎨 Configuración por Tipo

### Columnas de la Tabla

Define qué columnas se muestran en `tableVariables`:

```typescript
tableVariables: [
  { key: 'firstName', label: 'First Name', example: 'JOHN' },
  {
    key: 'courseTime',
    label: 'Course Time',
    example: '4hr',
    options: ['4hr', '6hr', '8hr']  // ← Dropdown en la tabla
  },
]
```

### Certificados por Página

```typescript
certificatesPerPage: 1,  // 1 = Un certificado por hoja (DATE, ADI)
certificatesPerPage: 2,  // 2 = Dos certificados por hoja
certificatesPerPage: 3,  // 3 = Tres certificados por hoja (BDI)
```

### Botón "Download combined PDF (dynamic)"

```typescript
allowCombinedPDF: false,  // NO mostrar botón morado (DATE, ADI)
allowCombinedPDF: true,   // SÍ mostrar botón morado (BDI)
```

## 📊 Resumen de Tipos Actuales

| Tipo | PDF Template | Certs/Page | Botón Morado | Columnas Especiales |
|------|--------------|------------|--------------|---------------------|
| **DATE** | `date.pdf` | 1 | ❌ No | Sin License Number ni Course Time |
| **ADI** | `adi.pdf` | 1 | ❌ No | Con License Number y Course Time |
| **BDI** | `bdi.pdf` | 3 | ✅ Sí | Con Citation Number |

## 🔧 Funciones Útiles

```typescript
import {
  getCertificateConfig,
  allowsCombinedPDF,
  getCertificatesPerPage
} from "@/lib/certificateConfigurations";

// Obtener configuración completa
const config = getCertificateConfig('DATE');

// Verificar si permite PDF combinado
const allows = allowsCombinedPDF('DATE');  // false

// Obtener certificados por página
const perPage = getCertificatesPerPage('BDI');  // 3
```

## 📝 Notas Importantes

1. **Los PDFs deben estar en** `public/templates_certificates/`
2. **El nombre del archivo debe coincidir** con `pdfTemplate` en la configuración
3. **Siempre usa nombres en MAYÚSCULAS** para `classType`
4. **Las variables en `tableVariables`** determinan las columnas de la tabla
5. **`allowCombinedPDF`** controla la visibilidad del botón morado automáticamente

## 🎯 Ventajas del Sistema Centralizado

✅ **Un solo lugar** para configurar todo
✅ **Fácil de agregar** nuevos tipos de certificados
✅ **No duplicar código** entre templates
✅ **Configuración clara y organizada**
✅ **Control total** sobre columnas, botones y comportamiento

---

**¿Preguntas? Revisa `lib/certificateConfigurations.ts` - todo está ahí!**
