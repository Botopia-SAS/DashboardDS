# Youthful Offender Certificate Template

## Overview

This template generates **DTA STUDENT TRAFFIC OFFENDER PROGRAM (STOP)** certificates for "youthful offender class" type. It uses the official template PDF that prints **3 certificates per page**.

## Template Configuration

- **File**: `youthfulOffenderTemplate.ts`
- **PDF Background**: `/templates_certificates/youthful-offender-class.pdf`
- **Page Size**: Letter (612 x 792 pt, Portrait)
- **Certificates Per Page**: 3
- **Class Type**: `youthful offender class` (ONLY)

## Required Student Data Fields

The following fields from the Student table are used to populate the certificates:

### Personal Information
- `first_name` → First Name field
- `midl` → Middle Initial (MI) field
- `last_name` → Last Name field
- `licenseNumber` → Driver's License No

### Citation/Court Information
- `citation_number` → Citation/Case No
- `court` → Court field (optional)
- `county` → County field (e.g., "Palm Beach County, FL")

### Course Information
- `courseDate` → Completion Date
- `courseTime` or `duration` or `hourt` → Used to determine course time checkboxes (4hr, 6hr, 8hr)
- `attendanceReason` → Used to determine attendance checkboxes

### Certificate Information
- `certn` → Certificate Number

## Checkbox Variables

The template automatically determines which checkboxes to mark based on the student data:

### Course Time Checkboxes
- `courseTime4hr` → Checked if course time contains "4"
- `courseTime6hr` → Checked if course time contains "6"
- `courseTime8hr` → Checked if course time contains "8"

**Example**: If `courseTime = "4 hr"`, the 4hr checkbox will be marked.

### Attendance Checkboxes
- `attendanceCourtOrder` → Checked if attendance reason contains "court"
- `attendanceVolunteer` → Checked if attendance reason contains "volunteer"
- `attendanceTicket` → Checked if attendance reason contains "ticket" or "citation"

**Example**: If `attendanceReason = "Court Order"`, the Court Order checkbox will be marked.

## Field Coordinates

All fields are positioned to align with the pre-printed PDF template. The coordinates are **carefully calibrated** for exact placement on each of the 3 certificates:

### Certificate 1 (Top Third)
- Y-coordinate range: ~685-763

### Certificate 2 (Middle Third)
- Y-coordinate range: ~421-499

### Certificate 3 (Bottom Third)
- Y-coordinate range: ~157-235

## Usage

### 1. Initialize the Template (First Time Only)

Call the initialize API to create the template in the database:

```bash
POST /api/certificate-templates/initialize
```

This will create all default templates including the youthful offender template.

### 2. Generate Certificates

The system uses the **dynamic certificate generator** which automatically:

1. Loads the youthful offender template when `classType = "youthful offender class"`
2. Applies the PDF background
3. Positions all text fields and checkboxes
4. Generates 3 certificates per page

### 3. Example Student Data

```javascript
{
  first_name: "Technology",
  midl: "S.A.S",
  last_name: "Botopia",
  licenseNumber: "A1234567",
  citation_number: "0",
  court: "",
  county: "Palm Beach County, FL",
  courseDate: "2025-10-18",
  courseTime: "4 hr", // or "6 hr" or "8 hr"
  attendanceReason: "Ticket/Citation", // or "Court Order" or "Volunteer"
  certn: "12345"
}
```

## Template Restrictions

This template is **ONLY** for class type `"youthful offender class"`. It will NOT work with other class types like:
- BDI
- ADI
- DATE
- etc.

To use this template, ensure your class records have the exact class type: `"youthful offender class"`

## Coordinate System

The template uses a **top-down canvas coordinate system** that gets converted to PDF's **bottom-up coordinate system** during generation:

```
Canvas (Design):           PDF (Output):
(0,0) at top-left         (0,0) at bottom-left
Y increases downward       Y increases upward
```

## Color Codes

- **Field Labels**: `#C65D3B` (Orange/Red - DTA brand color)
- **Regular Text**: `#000000` (Black)
- **Helper Text**: `#808080` (Gray)

## Static Template Text

The following text is pre-printed on the PDF background and does NOT need to be added:
- "CERTIFICATE OF COMPLETION" title
- "DTA STUDENT TRAFFIC OFFENDER PROGRAM (STOP)" subtitle
- "AN UNDER 25 YOUTHFUL OFFENDER COURSE" description
- Course Provider information
- School name and phone number
- Decorative borders

## Troubleshooting

### Fields Not Aligning
If fields don't align with the PDF template:
1. Check the PDF background path is correct: `/templates_certificates/youthful-offender-class.pdf`
2. Verify page size is Letter: 612 x 792 pt
3. Ensure `certificatesPerPage` is set to `3`

### Checkboxes Not Marking
1. Verify the student data contains the correct keywords:
   - Course time: "4", "6", or "8"
   - Attendance: "court", "volunteer", "ticket", or "citation"
2. Check console logs for variable parsing

### Wrong Class Type
The template will only load for `classType = "youthful offender class"`. Make sure:
1. The class type is spelled exactly as shown (all lowercase)
2. The template `classType` field matches in the database
3. The API is using the correct class type filter

## File Locations

- Template Definition: `lib/defaultTemplates/youthfulOffenderTemplate.ts`
- PDF Background: `public/templates_certificates/youthful-offender-class.pdf`
- API Initialization: `app/api/certificate-templates/initialize/route.ts`
- Generator Hook: Uses existing `components/ticket/hooks/use-dynamic-certificate-generator.tsx`
- Utilities: `components/ticket/hooks/pdf-helpers/utils.ts`

## Technical Details

### Font Information
- **Primary Font**: Helvetica
- **Label Font Sizes**: 8-9pt
- **Value Font Sizes**: 9-10pt
- **Helper Text**: 7pt

### Checkbox Specifications
- **Size**: 10x10 pt
- **Type**: Square boxes with X marks when checked
- **Positioning**: Precise X,Y coordinates per certificate section

### Scaling
The dynamic generator automatically handles scaling for 3-per-page layout:
- Text scale factor: 0.795
- Border width scale: 0.795
- Certificate height: 264pt (792/3)

## Future Enhancements

Potential improvements:
1. Support for instructor signature images
2. Optional logo placement
3. Customizable checkbox styles
4. Additional attendance reason options
5. Court and County auto-fill from location data
