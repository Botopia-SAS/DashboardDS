# 🎓 Sistema de Certificados Dinámicos

## 📋 Descripción General

Este sistema permite crear y gestionar plantillas de certificados completamente personalizables para diferentes tipos de clases (DATE, BDI, ADI, y cualquier nueva clase que se agregue en el futuro).

### ✨ Características Principales

- ✅ **Editor Visual de Certificados**: Diseña certificados arrastrando y soltando elementos
- ✅ **Templates Dinámicos**: Crea plantillas reutilizables para cada tipo de clase
- ✅ **Variables Dinámicas**: Usa variables como `{{studentName}}`, `{{certn}}`, etc.
- ✅ **Múltiples Elementos**: Agrega texto, imágenes, formas (rectángulos, líneas, círculos)
- ✅ **Backward Compatible**: Si no existe template, usa los generadores legacy (DATE, BDI, ADI)
- ✅ **Base de Datos MongoDB**: Todos los templates se guardan en la base de datos

---

## 🚀 Cómo Empezar

### 1. Inicializar Templates por Defecto

La primera vez que uses el sistema, debes crear los templates por defecto:

1. Navega a: `/ticket/certificate-templates`
2. Haz clic en el botón **"Initialize Defaults"**
3. Esto creará templates por defecto para DATE, BDI, y ADI basados en los diseños actuales

**Alternativamente**, puedes llamar directamente al API:
```bash
POST /api/certificate-templates/initialize
```

---

## 📝 Flujo de Uso

### Para Usuarios (Generando Certificados)

1. **Navegar a Day of Class**
   ```
   /ticket/day-of-class/[classType]
   ```
   Ejemplo: `/ticket/day-of-class/date`

2. **Dos Opciones Disponibles**:
   - **"Edit Certificate Design"**: Personalizar el diseño del certificado
   - **"View the Class Records"**: Ver estudiantes y generar certificados

3. **Seleccionar Clase y Generar Certificados**:
   - Selecciona una clase del dropdown
   - Entra a "View the Class Records"
   - Selecciona estudiantes
   - Haz clic en "Download Certificates"
   - El sistema automáticamente usa el template personalizado

---

## 🎨 Cómo Usar el Editor Visual

### Acceder al Editor

**Opción 1: Desde Day of Class**
```
/ticket/day-of-class/[classType] → Click "Edit Certificate Design"
```

**Opción 2: Desde la Página de Templates**
```
/ticket/certificate-templates → Click "Edit" en cualquier template
```

**Opción 3: Directamente**
```
/ticket/[classtype]/certificate-editor
```

### Interfaz del Editor

El editor tiene 3 paneles:

#### Panel Izquierdo (Herramientas)
- **Template Settings**: Nombre, tipo de clase, activar/desactivar
- **Add Elements**: Botones para agregar texto, imágenes, formas
- **Available Variables**: Lista de variables disponibles

#### Panel Central (Canvas)
- Vista previa del certificado
- Arrastra elementos para moverlos
- Haz clic en un elemento para seleccionarlo
- Toggle "Preview Mode" para ver sin controles

#### Panel Derecho (Propiedades)
- Solo aparece cuando seleccionas un elemento
- Edita propiedades específicas del elemento seleccionado
- Botón "Delete" para eliminar el elemento

### Agregar Elementos

#### 1. Texto
```
1. Click "Add Text"
2. Arrastra el texto a la posición deseada
3. En el panel derecho, edita:
   - Content: Usa texto normal o variables {{studentName}}
   - Position: X, Y coordinates
   - Font Size, Family, Weight
   - Color, Alignment
```

**Variables Disponibles**:
- `{{studentName}}` - Nombre completo (JOHN MICHAEL DOE)
- `{{firstName}}` - Nombre (JOHN)
- `{{lastName}}` - Apellido (DOE)
- `{{middleName}}` - Segundo nombre (MICHAEL)
- `{{certn}}` - Número de certificado
- `{{birthDate}}` - Fecha de nacimiento
- `{{courseDate}}` - Fecha de completación del curso
- `{{printDate}}` - Fecha de impresión
- `{{classTitle}}` - Título de la clase
- `{{classType}}` - Tipo de clase (DATE, BDI, etc.)
- `{{licenseNumber}}` - Número de licencia
- `{{citationNumber}}` - Número de citación
- `{{address}}` - Dirección
- `{{courseAddress}}` - Dirección del curso
- `{{courseTime}}` - Horario del curso
- `{{instructorName}}` - Nombre del instructor

#### 2. Imágenes
```
1. Click "Add Image"
2. En propiedades, ingresa la URL de la imagen
   - Puede ser relativa: /logo.png
   - O absoluta: https://example.com/image.png
3. Ajusta posición y tamaño
```

#### 3. Formas
```
1. Click "Add Rectangle" o "Add Line"
2. Ajusta posición, tamaño, colores en propiedades
3. Útil para bordes, líneas decorativas, cajas de información
```

---

## 💾 Gestión de Templates

### Ver Todos los Templates
```
/ticket/certificate-templates
```

### Crear Nuevo Template
1. Ve a `/ticket/certificate-templates`
2. Click "Create New Template"
3. Ingresa el tipo de clase (ej: DEFENSIVE-DRIVING)
4. Diseña el certificado en el editor
5. Click "Save Template"

### Editar Template Existente
1. Ve a `/ticket/certificate-templates`
2. Encuentra el template que quieres editar
3. Click "Edit"
4. Realiza cambios
5. Click "Save Template"

### Establecer Template por Defecto
1. Ve a `/ticket/certificate-templates`
2. Click "Set Default" en el template deseado
3. Solo puede haber UN template por defecto por cada tipo de clase

### Eliminar Template
1. Ve a `/ticket/certificate-templates`
2. Click en el ícono de basura (🗑️)
3. Confirma la eliminación

---

## 🔧 APIs Disponibles

### 1. Obtener Templates
```http
GET /api/certificate-templates
GET /api/certificate-templates?classType=DATE
GET /api/certificate-templates?classType=BDI&default=true
```

### 2. Crear Template
```http
POST /api/certificate-templates
Content-Type: application/json

{
  "name": "My Custom Certificate",
  "classType": "DATE",
  "pageSize": { "width": 842, "height": 595, "orientation": "landscape" },
  "background": { "type": "color", "value": "#FFFFFF" },
  "textElements": [...],
  "imageElements": [...],
  "shapeElements": [...],
  "isDefault": true
}
```

### 3. Actualizar Template
```http
PUT /api/certificate-templates/[templateId]
Content-Type: application/json

{
  "name": "Updated Name",
  "isDefault": true
}
```

### 4. Eliminar Template
```http
DELETE /api/certificate-templates/[templateId]
```

### 5. Inicializar Templates por Defecto
```http
POST /api/certificate-templates/initialize
```

---

## 🏗️ Arquitectura del Sistema

### Modelos de Datos

#### CertificateTemplate
```typescript
{
  _id: ObjectId,
  name: string,
  classType: string,  // DATE, BDI, ADI, etc.
  pageSize: {
    width: number,
    height: number,
    orientation: 'portrait' | 'landscape'
  },
  background: {
    type: 'color' | 'image' | 'pdf',
    value: string
  },
  textElements: TextElement[],
  imageElements: ImageElement[],
  shapeElements: ShapeElement[],
  availableVariables: Variable[],
  isDefault: boolean,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Componentes Principales

1. **CertificateEditor** (`components/certificate-editor/CertificateEditor.tsx`)
   - Componente principal del editor visual
   - Maneja la lógica de agregar/editar/eliminar elementos

2. **CertificateCanvas** (`components/certificate-editor/CertificateCanvas.tsx`)
   - Renderiza el preview del certificado
   - Permite arrastrar elementos
   - Muestra preview con datos de ejemplo

3. **useDynamicCertificateGenerator** (`components/ticket/hooks/use-dynamic-certificate-generator.tsx`)
   - Hook que genera PDFs usando templates dinámicos
   - Reemplaza variables con datos reales del estudiante
   - Usa `pdf-lib` para crear el PDF

4. **useCertificateGenerator** (`components/ticket/hooks/use-master-certificate-generator.tsx`)
   - Hook maestro que decide qué generador usar
   - Prioridad:
     1. Template dinámico (si existe)
     2. Generador legacy (BDI, ADI, DATE)

---

## 🔄 Flujo de Generación de Certificados

```
1. Usuario selecciona estudiantes y click "Download Certificates"
   ↓
2. Sistema llama a useCertificateGenerator
   ↓
3. Busca template dinámico para el classType
   ↓
4. ¿Template existe?
   ├── SÍ → Usa useDynamicCertificateGenerator
   │        ├── Carga template desde DB
   │        ├── Reemplaza variables con datos del estudiante
   │        └── Genera PDF con pdf-lib
   │
   └── NO → Usa generador legacy
            ├── useDateCertificateGenerator (DATE)
            ├── useBdiCertificateGenerator (BDI)
            └── useAdiCertificateGenerator (ADI)
   ↓
5. PDF se descarga al usuario
```

---

## 🆕 Agregar Nuevos Tipos de Clase

### Paso 1: Crear el Tipo de Clase
Asegúrate de que el nuevo tipo de clase existe en tu base de datos de `ClassType`.

### Paso 2: Crear Template
1. Ve a `/ticket/certificate-templates`
2. Click "Create New Template"
3. Ingresa el nombre del nuevo tipo (ej: "DEFENSIVE-DRIVING")
4. Diseña el certificado en el editor visual
5. Marca como "Default"
6. Guarda el template

### Paso 3: Listo!
El sistema automáticamente:
- Detectará el nuevo tipo de clase
- Usará el template que creaste
- Generará certificados con ese diseño

**No necesitas modificar código!** 🎉

---

## 📊 Coordenadas y Dimensiones

### Sistema de Coordenadas
- Origen (0,0) está en la **esquina superior izquierda**
- X aumenta hacia la derecha
- Y aumenta hacia abajo

### Tamaños de Página Comunes
- **A4 Landscape**: 842 x 595 puntos
- **A4 Portrait**: 595 x 842 puntos
- **Letter Landscape**: 792 x 612 puntos
- **Letter Portrait**: 612 x 792 puntos

### Escala en el Editor
El editor muestra el certificado al 70% (scale = 0.7) para que quepa en la pantalla.

---

## 🐛 Solución de Problemas

### El certificado no se genera
1. Verifica que existe un template para ese tipo de clase
2. Revisa la consola del navegador para errores
3. Asegúrate de que el template tenga `isDefault: true`
4. Verifica que `isActive: true`

### Las variables no se reemplazan
1. Usa la sintaxis correcta: `{{variableName}}`
2. Sin espacios: `{{studentName}}` ✅ `{{ studentName }}` ❌
3. Case-sensitive: `{{studentName}}` ✅ `{{StudentName}}` ❌

### Las imágenes no aparecen
1. Verifica que la URL de la imagen sea accesible
2. Usa rutas relativas para imágenes en `/public`
3. Para imágenes externas, asegúrate de que permitan CORS

### El texto está cortado
1. Ajusta el tamaño de fuente
2. Verifica las coordenadas X, Y
3. Usa texto más corto o múltiples elementos de texto

---

## 🎯 Mejores Prácticas

### Diseño
1. **Usa variables siempre que sea posible** en lugar de texto hardcodeado
2. **Centra elementos importantes** usando align: 'center'
3. **Prueba con preview mode** antes de guardar
4. **Usa fuentes consistentes** (Helvetica, Times-Roman)

### Organización
1. **Nombra templates descriptivamente**: "DATE Certificate Default", "BDI Certificate - Spanish Version"
2. **Un template por defecto por tipo de clase**
3. **Mantén templates activos** solo los que realmente uses
4. **Documenta cambios significativos** en el nombre o descripción

### Performance
1. **Optimiza imágenes** antes de usarlas (reduce tamaño, comprime)
2. **Evita muchas formas complejas** (puede ralentizar la generación)
3. **Usa background PDF** solo si es necesario

---

## 📚 Recursos Adicionales

### Librerías Utilizadas
- **pdf-lib**: Generación de PDFs programática
- **@react-pdf/renderer**: Alternativa para PDFs con React (instalada pero no usada actualmente)
- **MongoDB**: Base de datos para almacenar templates

### Archivos Clave
```
/lib/models/CertificateTemplate.ts          # Modelo de MongoDB
/app/api/certificate-templates/             # APIs REST
/components/certificate-editor/             # Componentes del editor
/components/ticket/hooks/                   # Hooks de generación
/app/(dashboard)/ticket/certificate-templates/  # Página de administración
```

---

## 🎓 Ejemplos de Uso

### Ejemplo 1: Crear Certificado para Nueva Clase "TEEN DRIVING"

```typescript
// 1. Usuario crea template visualmente en /ticket/teen-driving/certificate-editor

// 2. Sistema guarda en MongoDB
{
  "name": "Teen Driving Certificate",
  "classType": "TEEN-DRIVING",
  "textElements": [
    {
      "content": "TEEN DRIVER CERTIFICATE",
      "x": 400,
      "y": 100,
      "fontSize": 24,
      "align": "center"
    },
    {
      "content": "{{studentName}}",
      "x": 400,
      "y": 200,
      "fontSize": 18,
      "align": "center"
    }
  ],
  "isDefault": true
}

// 3. Al generar certificados, el sistema automáticamente usa este template
```

### Ejemplo 2: Personalizar Certificado BDI con Logo de Cliente

```typescript
// 1. Edita template BDI existente
// 2. Agrega imagen del logo del cliente
{
  "imageElements": [
    {
      "url": "/client-logo.png",
      "x": 50,
      "y": 50,
      "width": 100,
      "height": 100
    }
  ]
}
// 3. Guarda - todos los nuevos certificados BDI tendrán el logo
```

---

## 🚀 Próximas Mejoras Posibles

- [ ] Importar templates desde archivo JSON
- [ ] Exportar templates para compartir
- [ ] Plantillas pre-diseñadas (gallery)
- [ ] Preview en tiempo real con datos reales
- [ ] Soporte para múltiples idiomas
- [ ] Firmas digitales
- [ ] QR codes dinámicos
- [ ] Batch editing de templates

---

## 📞 Soporte

Para problemas o preguntas sobre el sistema de certificados:
1. Revisa esta documentación
2. Verifica los logs en la consola del navegador
3. Revisa los logs del servidor
4. Contacta al equipo de desarrollo

---

**¡Disfruta creando certificados hermosos y personalizados!** 🎨✨
