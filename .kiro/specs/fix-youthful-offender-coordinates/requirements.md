# Requirements Document

## Introduction

The Youthful Offender Class certificate template generates PDFs with 3 certificates per page, but the text variables (firstName, lastName, licenseNumber, etc.) are not appearing in the generated PDF. This is due to incorrect Y-coordinate values in the template configuration that place text elements outside the visible certificate areas.

## Glossary

- **Certificate Template**: A configuration object that defines the layout, positioning, and styling of certificate elements
- **PDF Coordinate System**: A coordinate system where Y=0 is at the bottom of the page and Y increases upward
- **Certificate Slot**: One of three vertical sections on a Letter-size page (792pt height ÷ 3 = 264pt per slot)
- **Text Element**: A configurable text field in the certificate template that displays student information
- **Y-Coordinate**: Vertical position measured from the bottom of the page in PDF points

## Requirements

### Requirement 1

**User Story:** As a certificate administrator, I want the student information fields to appear correctly positioned on all three certificates when generating a Youthful Offender Class certificate PDF, so that the certificates are readable and properly formatted.

#### Acceptance Criteria

1. WHEN the system generates a Youthful Offender Class certificate PDF, THE Certificate Generator SHALL render all text elements within the visible bounds of each certificate slot
2. WHEN a text element has a Y-coordinate value, THE Certificate Generator SHALL position the text at the correct vertical location measured from the bottom of the page
3. WHEN the template specifies 3 certificates per page, THE Certificate Generator SHALL ensure text elements for certificate 1 appear in the top slot (Y: 528-792pt), certificate 2 in the middle slot (Y: 264-528pt), and certificate 3 in the bottom slot (Y: 0-264pt)

### Requirement 2

**User Story:** As a developer maintaining the certificate system, I want the coordinate system to be clearly documented and consistent, so that future template adjustments are straightforward and error-free.

#### Acceptance Criteria

1. THE Youthful Offender Template SHALL include comments explaining the PDF coordinate system and how Y-coordinates are calculated
2. THE Youthful Offender Template SHALL use Y-coordinate values that correctly account for the 264pt height of each certificate slot
3. WHEN positioning text elements for multiple certificates, THE Template SHALL use a consistent offset pattern (0pt for bottom, 264pt for middle, 528pt for top)

### Requirement 3

**User Story:** As a certificate administrator, I want all variable fields (names, dates, license numbers, etc.) to be visible and properly aligned on the generated certificates, so that the certificates meet official requirements.

#### Acceptance Criteria

1. THE Certificate Generator SHALL display all student name fields (firstName, middleInitial, lastName) at their designated positions
2. THE Certificate Generator SHALL display all administrative fields (citationNumber, court, county, certn, licenseNumber, courseDate) at their designated positions
3. WHEN generating multiple certificates on one page, THE Certificate Generator SHALL apply the same data to all three certificate copies with correct positioning
