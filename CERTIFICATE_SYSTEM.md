# Sistema de Certificados Dinámico

## Descripción General

Este proyecto utiliza un sistema de certificados dinámico y configurable que permite agregar fácilmente nuevos tipos de certificados sin modificar el código principal.

## Arquitectura

### Archivos Principales

1. **`/lib/certificateConfig.ts`** - Configuración central de todos los certificados
2. **`/lib/certificateTypes.ts`** - Definiciones de tipos TypeScript
3. **`/components/ticket/hooks/use-unified-certificate-generator.tsx`** - Hook unificado para generar PDFs
4. **`/public/*.pdf`** - Plantillas PDF para cada tipo de certificado

## Cómo Funciona

### 1. Configuración de Certificados

Cada tipo de clase tiene su configuración en `/lib/certificateConfig.ts`:

```typescript
'DATE': {
  classType: 'DATE',
  pdfPath: '/date_data.pdf',  // PDF en /public/
  displayName: 'DATE Certificate',
  variables: [
    {
      key: 'studentName',        // Campo en la base de datos
      label: 'Student Full Name', // Etiqueta descriptiva
      x: 390,                     // Posición X en el PDF
      y: 242,                     // Posición Y en el PDF
      fontSize: 14,
      fontFamily: 'Times-Roman',
      align: 'center',
      transform: (value, student) => {  // Función opcional de transformación
        const firstName = student?.first_name || '';
        const lastName = student?.last_name || '';
        return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
      }
    },
    // ... más variables
  ]
}
```

### 2. Generación de Certificados

El sistema usa un solo hook (`useUnifiedCertificateGenerator`) que:
1. Lee la configuración del tipo de clase
2. Carga el PDF template correspondiente
3. Aplica las transformaciones a los datos
4. Escribe el texto en las coordenadas especificadas
5. Genera el PDF final

## Cómo Agregar un Nuevo Certificado

### Paso 1: Diseñar el PDF Template

1. Crea tu certificado en cualquier programa de diseño (Adobe, Canva, etc.)
2. Exporta como PDF
3. Guarda el archivo en `/public/` (ejemplo: `/public/mi_certificado.pdf`)

### Paso 2: Encontrar las Coordenadas

Para encontrar las coordenadas donde colocar el texto:
- El origen (0,0) está en la esquina **superior izquierda**
- X aumenta hacia la derecha
- Y aumenta hacia abajo
- Usa herramientas como Adobe Acrobat o prueba y error

**Tip**: Comienza con coordenadas aproximadas y ajusta según necesites.

### Paso 3: Agregar Configuración

Abre `/lib/certificateConfig.ts` y agrega tu configuración:

```typescript
export const CERTIFICATE_CONFIGS: Record<string, CertificateConfig> = {
  // ... configuraciones existentes ...

  // Tu nuevo certificado
  'MI NUEVA CLASE': {
    classType: 'MI NUEVA CLASE',
    pdfPath: '/mi_certificado.pdf',
    displayName: 'Mi Certificado Nuevo',
    variables: [
      {
        key: 'studentName',
        label: 'Nombre del Estudiante',
        x: 400,  // Centro horizontal (para 792px de ancho)
        y: 250,  // Ajusta según tu diseño
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          return `${student.first_name} ${student.last_name}`.toUpperCase();
        }
      },
      {
        key: 'courseDate',
        label: 'Fecha del Curso',
        x: 400,
        y: 300,
        fontSize: 12,
        fontFamily: 'Helvetica',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Número de Certificado',
        x: 400,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  }
};
```

### Paso 4: ¡Listo!

El sistema automáticamente:
- Detectará el nuevo tipo de certificado
- Lo usará cuando se generen certificados para esa clase
- Aplicará todas las transformaciones configuradas

## Variables Disponibles

Las variables provienen del objeto `Student` en la base de datos:

### Campos Principales
- `first_name` - Nombre
- `last_name` - Apellido
- `midl` - Segundo nombre
- `certn` - Número de certificado
- `birthDate` - Fecha de nacimiento
- `licenseNumber` - Número de licencia
- `courseDate` - Fecha de completación
- `classTitle` - Título de la clase
- `classType` - Tipo de clase
- `address` - Dirección/Ubicación
- `citationNumber` - Número de citación

### Crear Variables Compuestas

Usa la función `transform` para combinar datos:

```typescript
{
  key: 'fullAddress',
  label: 'Dirección Completa',
  x: 300,
  y: 400,
  transform: (value, student) => {
    return `${student.address}, ${student.city}, ${student.state} ${student.zip}`;
  }
}
```

## Opciones de Configuración

### Alineación (`align`)
- `'left'` - Alineado a la izquierda
- `'center'` - Centrado (X es el punto central)
- `'right'` - Alineado a la derecha

### Fuentes (`fontFamily`)
- `'Times-Roman'` - Serif formal (recomendado para certificados)
- `'Helvetica'` - Sans-serif moderna
- `'Courier'` - Monospace

### Tamaño de Página Estándar
- Carta: 792px × 612px (landscape)
- Carta: 612px × 792px (portrait)

## Funciones de Transformación

### Formatear Fechas
```typescript
transform: (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
```

### Convertir a Mayúsculas
```typescript
transform: (value) => value?.toUpperCase() || ''
```

### Formatear Nombres
```typescript
transform: (value, student) => {
  const { first_name, last_name, midl } = student;
  return `${first_name} ${midl} ${last_name}`.trim().toUpperCase();
}
```

### Valores Condicionales
```typescript
transform: (value, student) => {
  return student.courseTime === '8hr' ? '8 Horas' : '4 Horas';
}
```

## Ejemplos Completos

### Certificado Simple (3 Variables)
```typescript
'CLASE BASICA': {
  classType: 'CLASE BASICA',
  pdfPath: '/clase_basica.pdf',
  displayName: 'Certificado Básico',
  variables: [
    {
      key: 'studentName',
      label: 'Nombre',
      x: 396,
      y: 250,
      fontSize: 16,
      align: 'center',
      transform: (v, s) => `${s.first_name} ${s.last_name}`.toUpperCase()
    },
    {
      key: 'courseDate',
      label: 'Fecha',
      x: 396,
      y: 300,
      fontSize: 12,
      align: 'center',
      transform: (v) => new Date(v || Date.now()).toLocaleDateString('en-US')
    },
    {
      key: 'certn',
      label: 'Certificado #',
      x: 396,
      y: 350,
      fontSize: 12,
      align: 'center'
    }
  ]
}
```

### Certificado Complejo (Múltiples Variables)
```typescript
'CLASE AVANZADA': {
  classType: 'CLASE AVANZADA',
  pdfPath: '/clase_avanzada.pdf',
  displayName: 'Certificado Avanzado',
  variables: [
    // Información del estudiante
    { key: 'firstName', label: 'Nombre', x: 200, y: 200, fontSize: 12, align: 'left' },
    { key: 'lastName', label: 'Apellido', x: 200, y: 220, fontSize: 12, align: 'left' },
    { key: 'licenseNumber', label: 'Licencia #', x: 200, y: 240, fontSize: 10, align: 'left' },

    // Información del curso
    { key: 'classTitle', label: 'Título', x: 500, y: 200, fontSize: 12, align: 'left' },
    { key: 'courseDate', label: 'Fecha', x: 500, y: 220, fontSize: 12, align: 'left',
      transform: (v) => new Date(v).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    },
    { key: 'address', label: 'Ubicación', x: 500, y: 240, fontSize: 10, align: 'left' },

    // Certificado
    { key: 'certn', label: 'Certificado #', x: 396, y: 500, fontSize: 14, align: 'center',
      transform: (v) => `#${String(v).padStart(5, '0')}`
    }
  ]
}
```

## Solución de Problemas

### El texto no aparece en el PDF
- Verifica que las coordenadas estén dentro del tamaño de la página
- Asegúrate de que el color no sea blanco sobre fondo blanco
- Revisa que `fontSize` sea mayor a 0

### El texto está en el lugar incorrecto
- Recuerda: Y=0 está arriba, aumenta hacia abajo
- Si usas `align: 'center'`, X debe ser el punto central deseado
- Prueba con diferentes valores en incrementos de 10-20px

### La transformación no funciona
- Verifica que la función `transform` retorne un string
- Chequea que los campos existan en el objeto `student`
- Usa `console.log` dentro de transform para debug

### PDF no se carga
- Confirma que el archivo existe en `/public/`
- Verifica que el nombre del archivo coincida exactamente (case-sensitive)
- Asegúrate de que el PDF no esté corrupto

## Mejores Prácticas

1. **Usa nombres descriptivos** para las variables
2. **Centraliza transformaciones comunes** (fechas, nombres, etc.)
3. **Prueba con datos reales** antes de desplegar
4. **Documenta coordenadas especiales** en comentarios
5. **Usa constantes** para valores repetidos:

```typescript
const CERT_CENTER_X = 396; // Centro de página 792px
const CERT_TITLE_Y = 250;
const CERT_FONT_LARGE = 16;

// Luego úsalas en tu config:
{ x: CERT_CENTER_X, y: CERT_TITLE_Y, fontSize: CERT_FONT_LARGE, ... }
```

## Arquitectura Técnica

### Flujo de Generación

```
Usuario solicita certificado
    ↓
DataTable llama a useUnifiedCertificateGenerator
    ↓
Hook obtiene configuración desde certificateConfig.ts
    ↓
Carga PDF template desde /public/
    ↓
Para cada variable:
  - Obtiene valor de student
  - Aplica transform si existe
  - Dibuja texto en coordenadas (x, y)
    ↓
Retorna PDF Blob
    ↓
Usuario descarga certificado
```

### Beneficios del Sistema

✅ **Un solo hook para todos los certificados**
✅ **Configuración centralizada y fácil de mantener**
✅ **No requiere modificar código para agregar certificados**
✅ **Transformaciones reutilizables**
✅ **Type-safe con TypeScript**
✅ **Fácil de testear y debuggear**

## Migración desde Sistema Anterior

El sistema anterior usaba hooks separados para cada tipo de certificado (`use-date-certificate-generator`, `use-bdi-certificate-generator`, etc.).

**Ahora todo está unificado** en:
- Un solo hook: `useUnifiedCertificateGenerator`
- Una configuración: `certificateConfig.ts`
- Sin duplicación de código

Los archivos viejos fueron eliminados para mantener el código limpio.

## Soporte

Para agregar soporte a nuevos campos en los certificados:
1. Agregar el campo al modelo `Student` en la base de datos
2. Agregarlo a la configuración en `certificateConfig.ts`
3. Opcionalmente crear una transformación personalizada

¡Eso es todo! El sistema es completamente extensible y fácil de mantener.
