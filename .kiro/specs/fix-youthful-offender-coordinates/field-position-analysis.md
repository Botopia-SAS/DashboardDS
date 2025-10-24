# Youthful Offender Certificate - Field Position Analysis

## Task 1: PDF Template Analysis and Field Position Measurement

**Date**: October 24, 2025  
**Template PDF**: `/public/templates_certificates/youthful-offender-class.pdf`  
**Page Size**: Letter (612 x 792 pt)  
**Layout**: 3 certificates per page (264pt per certificate slot)

---

## PDF Coordinate System

### Understanding the Coordinate Transformation

The certificate generator uses the following formula to convert template Y-coordinates to PDF coordinates:

```
pdfY = height - (y * certScaleY + offsetY) - baselineOffset
```

Where:
- **height** = 792pt (total page height)
- **certScaleY** = 1/3 (scale factor for 3 certificates per page)
- **offsetY** = row × 264pt
  - Certificate 1 (TOP): offsetY = 0
  - Certificate 2 (MIDDLE): offsetY = 264
  - Certificate 3 (BOTTOM): offsetY = 528
- **baselineOffset** = fontSize × 0.8

### Certificate Slot Boundaries

**In PDF Coordinates (Y=0 at BOTTOM):**
- Certificate 3 (BOTTOM): Y range 0-264pt
- Certificate 2 (MIDDLE): Y range 264-528pt
- Certificate 1 (TOP): Y range 528-792pt

**In Template Coordinates (before transformation):**
- Each certificate has a local coordinate space of 0-264pt
- The generator applies certScaleY and offsetY to position elements correctly

---

## Current Template Coordinate Issues

### Problem Analysis

The current template has Y-coordinates that are causing text to render outside visible bounds:

**Certificate 1 (TOP) - Current Y values:**
```
citation: y=300  → pdfY = 792 - (300/3 + 0) - 12.8 = 679.2  ✓ (in range 528-792)
court: y=390     → pdfY = 792 - (390/3 + 0) - 12.8 = 649.2  ✓
county: y=480    → pdfY = 792 - (480/3 + 0) - 12.8 = 619.2  ✓
certn: y=570     → pdfY = 792 - (570/3 + 0) - 12.8 = 589.2  ✓
firstName: y=660 → pdfY = 792 - (660/3 + 0) - 12.8 = 559.2  ✓
middleName: y=750 → pdfY = 792 - (750/3 + 0) - 12.8 = 529.2 ✓ (edge)
lastName: y=840  → pdfY = 792 - (840/3 + 0) - 12.8 = 499.2  ✗ (below 528!)
license: y=930   → pdfY = 792 - (930/3 + 0) - 12.8 = 469.2  ✗
completion: y=1020 → pdfY = 792 - (1020/3 + 0) - 12.8 = 429.2 ✗
```

**Certificate 2 (MIDDLE) - Current Y values:**
```
citation: y=384  → pdfY = 792 - (384/3 + 264) - 8 = 392  ✓ (in range 264-528)
firstName: y=419 → pdfY = 792 - (419/3 + 264) - 8 = 380.3 ✓
license: y=444   → pdfY = 792 - (444/3 + 264) - 8 = 372  ✓
```

**Certificate 3 (BOTTOM) - Current Y values:**
```
citation: y=648  → pdfY = 792 - (648/3 + 528) - 8 = 40   ✓ (in range 0-264)
firstName: y=683 → pdfY = 792 - (683/3 + 528) - 8 = 28.3 ✓
license: y=708   → pdfY = 792 - (708/3 + 528) - 8 = 20   ✓
```

### Root Cause

The Y-coordinates for Certificate 1 are too large, causing the calculated PDF Y positions to fall below the 528pt threshold (into Certificate 2's space). This is why text fields are not appearing on the generated certificates.

---

## PDF Template Field Layout

Based on the PDF template structure and typical form layouts, the fields should be positioned as follows within each 264pt certificate slot:

### Expected Field Positions (within 264pt slot)

**From TOP of certificate slot (measuring down):**
- Top margin: ~10-20pt
- Citation/Court/County/Certn row: ~30-40pt from top
- Name fields row: ~80-100pt from top
- License/Date row: ~120-140pt from top
- Signature area: ~180-220pt from top
- Bottom margin: ~240-250pt

**Converting to Template Y-coordinates:**

For Certificate 1 (TOP slot), we need Y values that when transformed will place text in the 528-792pt range:

```
Desired pdfY = 792 - (y/3 + 0) - baselineOffset
```

To place text at the TOP of Certificate 1 (near Y=780 in PDF):
```
780 = 792 - (y/3 + 0) - 12.8
y/3 = 792 - 780 - 12.8 = -0.8
y = -2.4  (not practical, need positive values)
```

Actually, we should think in terms of distance from TOP of the certificate slot:

**For Certificate 1 (TOP slot, offsetY=0):**
- To place text 30pt from top of slot: pdfY should be ~762
  - 762 = 792 - (y/3 + 0) - 12.8
  - y/3 = 17.2
  - y = 51.6 ≈ 52

- To place text 80pt from top of slot: pdfY should be ~712
  - 712 = 792 - (y/3 + 0) - 12.8
  - y/3 = 67.2
  - y = 201.6 ≈ 202

- To place text 120pt from top of slot: pdfY should be ~672
  - 672 = 792 - (y/3 + 0) - 12.8
  - y/3 = 107.2
  - y = 321.6 ≈ 322

---

## Recommended Y-Coordinate Values

### Certificate 1 (TOP) - Corrected Values

Based on typical form field spacing:

```typescript
// Top row (Citation, Court, County, Certn) - 30pt from top of slot
citation: y: 52    // pdfY ≈ 762
court: y: 52       // pdfY ≈ 762
county: y: 52      // pdfY ≈ 762
certn: y: 52       // pdfY ≈ 762

// Name row (First, Middle, Last) - 80pt from top of slot
firstName: y: 202   // pdfY ≈ 712
middleInitial: y: 202  // pdfY ≈ 712
lastName: y: 202    // pdfY ≈ 712

// License/Date row - 120pt from top of slot
licenseNumber: y: 322  // pdfY ≈ 672
courseDate: y: 322     // pdfY ≈ 672
```

### Certificate 2 (MIDDLE) - Keep Same Local Coordinates

For Certificate 2, the Y-coordinates should be the SAME as Certificate 1 (in local space), because the generator applies offsetY=264 automatically:

```typescript
// Same Y values as Certificate 1
citation: y: 52
court: y: 52
county: y: 52
certn: y: 52
firstName: y: 202
middleInitial: y: 202
lastName: y: 202
licenseNumber: y: 322
courseDate: y: 322
```

### Certificate 3 (BOTTOM) - Keep Same Local Coordinates

Same logic applies:

```typescript
// Same Y values as Certificate 1
citation: y: 52
court: y: 52
county: y: 52
certn: y: 52
firstName: y: 202
middleInitial: y: 202
lastName: y: 202
licenseNumber: y: 322
courseDate: y: 322
```

---

## Vertical Spacing Between Fields

Based on the recommended coordinates:

- **Top row to Name row**: 150pt (202 - 52 = 150)
- **Name row to License/Date row**: 120pt (322 - 202 = 120)
- **Total vertical span**: 270pt (322 - 52 = 270)

This spacing provides clear separation between field groups and ensures all text remains within the visible certificate bounds.

---

## Shape Elements (Checkboxes)

The checkbox X marks also need coordinate adjustment. Current values place them at:

**Certificate 1 checkboxes:**
- Course Time: y=82-90 (near bottom of slot)
- Attendance: y=120-128 (near bottom of slot)

These should be repositioned to align with the PDF template's checkbox locations. Typical placement would be:

- **Course Time checkboxes**: ~160pt from top of slot → y ≈ 442
- **Attendance checkboxes**: ~200pt from top of slot → y ≈ 562

---

## Image Elements (Signature)

Current signature positions:
- Certificate 1: y=545 → pdfY = 792 - (545/3 + 0) - 0 = 610.3 ✓
- Certificate 2: y=281 → pdfY = 792 - (281/3 + 264) - 0 = 434.3 ✓
- Certificate 3: y=17 → pdfY = 792 - (17/3 + 528) - 0 = 258.3 ✓

Signature positions appear to be in valid ranges. May need fine-tuning based on actual PDF template layout.

---

## Next Steps

1. ✅ **Task 1 Complete**: Analyzed PDF template and documented field positions
2. **Task 2**: Update Certificate 1 text element Y-coordinates
3. **Task 3**: Update Certificate 2 text element Y-coordinates (use same values as Cert 1)
4. **Task 4**: Update Certificate 3 text element Y-coordinates (use same values as Cert 1)
5. **Task 5**: Update checkbox shape element Y-coordinates
6. **Task 6**: Verify signature image Y-coordinates
7. **Task 7**: Test with sample data
8. **Task 8**: Fine-tune based on test results

---

## References

- **Requirements**: 1.1, 1.2, 1.3
- **Design Document**: `.kiro/specs/fix-youthful-offender-coordinates/design.md`
- **Template File**: `lib/defaultTemplates/youthfulOffenderTemplate.ts`
- **Generator**: `components/ticket/hooks/use-dynamic-certificate-generator.tsx`
- **Draw Text Helper**: `components/ticket/hooks/pdf-helpers/draw-text.ts`
