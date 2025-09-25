# BDI Certificate Generator

Este módulo proporciona funcionalidad para generar y descargar certificados BDI (Basic Driver Improvement) en formato PDF basados en la imagen de referencia del Departamento de Seguridad Vial y Vehículos Motorizados de Florida.

## Características

- ✅ **Campos Editables**: Todos los campos del certificado son completamente personalizables
- ✅ **Descarga PDF**: Genera y descarga automáticamente el certificado en formato PDF
- ✅ **Sin Main Menu**: El certificado no incluye enlaces al menú principal
- ✅ **Diseño Fiel**: Replica exactamente el formato oficial del certificado
- ✅ **Integración Fácil**: Se integra perfectamente con el sistema existente

## Archivos Creados

### 1. `bdi-certificate.tsx` 
Componente completo independiente con formulario y vista previa.

### 2. `bdi-certificate-modal.tsx`
Componente modal reutilizable para integrar en la aplicación existente.

### 3. `hooks/use-bdi-certificate-downloader.tsx`
Hook personalizado que maneja la generación y descarga del PDF.

### 4. `bdi-certificate-button.tsx`
Botón de integración que mapea automáticamente los datos del estudiante.

## Uso

### Uso Básico (Componente Modal)

```tsx
import BdiCertificateModal from "./bdi-certificate-modal";

function MyComponent() {
  return (
    <BdiCertificateModal
      initialData={{
        certificateNumber: "47558093",
        studentName: "CALDERON, ROMELIA",
        // ... más campos
      }}
      onDownload={(data) => {
        console.log("Certificate downloaded:", data);
      }}
    />
  );
}
```

### Uso con Datos de Estudiante

```tsx
import { BdiCertificateButton } from "./bdi-certificate-button";

function StudentTable({ student }) {
  return (
    <div>
      <BdiCertificateButton 
        student={student}
        variant="outline"
        size="sm"
      />
    </div>
  );
}
```

### Uso del Hook Directamente

```tsx
import { useBdiCertificateDownloader } from "./hooks/use-bdi-certificate-downloader";

function MyComponent() {
  const { downloadBdiCertificate } = useBdiCertificateDownloader();
  
  const handleDownload = async () => {
    const success = await downloadBdiCertificate({
      certificateNumber: "47558093",
      studentName: "CALDERON, ROMELIA",
      // ... todos los campos requeridos
    });
    
    if (success) {
      console.log("PDF generated successfully!");
    }
  };
  
  return (
    <button onClick={handleDownload}>
      Download BDI Certificate
    </button>
  );
}
```

## Campos del Certificado

Todos estos campos son editables y se pueden personalizar:

- **Certificate Number**: Número de certificado único
- **Print Date**: Fecha de impresión
- **Course Completion Date**: Fecha de finalización del curso
- **Citation Number**: Número de citación
- **Citation County**: Condado de la citación
- **Course Provider**: Proveedor del curso
- **Provider Phone**: Teléfono del proveedor
- **School Name**: Nombre de la escuela
- **School Phone**: Teléfono de la escuela
- **Drivers License Number**: Número de licencia de conducir
- **Student Name**: Nombre del estudiante
- **Date of Birth**: Fecha de nacimiento
- **Reason Attending**: Razón de asistencia

## Integración en el Sistema Existente

Para integrar en las tablas de estudiantes existentes, puedes agregar el botón en `row-action-buttons.tsx`:

```tsx
import { BdiCertificateButton } from "./bdi-certificate-button";

// En tu componente RowActionButtons:
<BdiCertificateButton 
  student={original} 
  variant="ghost" 
  size="sm" 
/>
```

## Dependencias

- `pdf-lib`: Para la generación de PDFs
- `lucide-react`: Para los iconos
- Componentes UI existentes del proyecto

## Notas Técnicas

- El PDF se genera en tamaño US Letter estándar (612 x 792 puntos)
- Utiliza las fuentes Helvetica y Helvetica-Bold para mantener compatibilidad
- La descarga se maneja automáticamente sin requerir servidor
- Todos los campos son validados antes de la generación del PDF

## Personalización

Puedes personalizar fácilmente:
- Estilos del certificado modificando los parámetros de `drawText` y `drawRectangle`
- Posicionamiento de elementos ajustando las coordenadas x/y
- Colores usando `rgb()` con diferentes valores
- Tamaños de fuente modificando el parámetro `size`

El certificado mantiene la fidelidad visual con el documento oficial de Florida DMV mientras permite total flexibilidad en la edición de datos.