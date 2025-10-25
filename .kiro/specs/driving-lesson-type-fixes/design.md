# Design Document

## Overview

This design addresses TypeScript type consistency issues in the driving lesson scheduling system by aligning the ScheduleDrivingLesson interface with the Mongoose schema definition. The primary issue is that the TypeScript interface defines `paymentMethod` as optional (`paymentMethod?: string`) while the Mongoose schema defines it as required (`paymentMethod: String`), causing build failures when trying to delete or conditionally set this property.

## Architecture

The fix involves updating the Mongoose schema definition to make the `paymentMethod` field optional, which aligns with the existing TypeScript interface and the business logic that allows lessons to exist without payment methods initially.

### Current State
- TypeScript Interface: `paymentMethod?: string` (optional)
- Mongoose Schema: `paymentMethod: String` (required)
- API Logic: Attempts to delete/set paymentMethod conditionally

### Target State
- TypeScript Interface: `paymentMethod?: string` (optional) - no change needed
- Mongoose Schema: `paymentMethod: { type: String, required: false }` (optional)
- API Logic: Works correctly with optional field handling

## Components and Interfaces

### 1. ScheduleDrivingLesson Interface
**Location:** `lib/models/Instructor.ts`
**Status:** No changes required - already correctly defined as optional

```typescript
interface ScheduleDrivingLesson {
  _id?: string;
  date: string;
  start: string;
  end: string;
  status: string;
  classType: string;
  pickupLocation: string;
  dropoffLocation: string;
  selectedProduct: string;
  studentId: Schema.Types.ObjectId;
  studentName: string;
  paid: boolean;
  paymentMethod?: string; // Already optional - correct
}
```

### 2. Mongoose Schema Definition
**Location:** `lib/models/Instructor.ts`
**Required Changes:** Update paymentMethod field definition

**Current:**
```javascript
schedule_driving_lesson: [{
  // ... other fields
  paymentMethod: String // Required field
}]
```

**Updated:**
```javascript
schedule_driving_lesson: [{
  // ... other fields
  paymentMethod: { type: String, required: false } // Optional field
}]
```

### 3. API Endpoint Logic
**Location:** `app/api/instructors/[instructorId]/schedule/driving-lesson/[lessonId]/reject/route.ts`
**Status:** No changes required - logic is already correct for optional fields

## Data Models

### Instructor Model Updates

The `schedule_driving_lesson` array schema needs modification to make `paymentMethod` optional:

```javascript
schedule_driving_lesson: [{
  _id: String,
  date: String,
  start: String,
  end: String,
  status: String,
  classType: String,
  pickupLocation: String,
  dropoffLocation: String,
  selectedProduct: String,
  studentId: { type: Schema.Types.ObjectId, ref: "User" },
  studentName: String,
  paid: Boolean,
  paymentMethod: { type: String, required: false } // Updated to optional
}]
```

### Database Migration Considerations

Since we're making a required field optional, this is a non-breaking change:
- Existing documents with paymentMethod values will continue to work
- New documents can be created without paymentMethod
- No data migration is required

## Error Handling

### TypeScript Compilation
- After the schema update, TypeScript will no longer throw errors about missing paymentMethod property
- The optional field handling in the API will work correctly

### Runtime Behavior
- When `paymentMethod` is null: Property is deleted from the document
- When `paymentMethod` has a value: Property is set on the document
- When `paymentMethod` is undefined: Property remains unchanged

## Testing Strategy

### Unit Tests
- Test Mongoose schema validation with and without paymentMethod
- Verify that documents can be saved without paymentMethod
- Confirm that paymentMethod can be set and unset dynamically

### Integration Tests
- Test the driving lesson rejection API endpoint
- Verify that lessons can be created without paymentMethod
- Confirm that paymentMethod can be updated through API calls

### Type Checking
- Ensure TypeScript compilation succeeds
- Verify that IDE provides correct type hints for optional paymentMethod

## Implementation Approach

1. **Schema Update**: Modify the Mongoose schema to make paymentMethod optional
2. **Validation**: Ensure the change doesn't break existing functionality
3. **Testing**: Run existing tests to confirm backward compatibility
4. **Build Verification**: Confirm TypeScript compilation succeeds

## Backward Compatibility

This change is fully backward compatible:
- Existing documents with paymentMethod will continue to work
- API endpoints will function identically
- No changes required to client-side code
- TypeScript interfaces remain unchanged