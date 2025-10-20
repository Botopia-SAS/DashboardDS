# Session Checklist Feature

## Overview

This feature allows tracking and displaying detailed session checklists for driving lessons. Each checklist contains assessment items with ratings, comments, and instructor notes.

## Components

### 1. Database Model

**File**: `lib/models/SessionChecklist.ts`

**Schema**:
```typescript
{
  checklistType: String,        // e.g., "Driving Skills Basics"
  sessionId: ObjectId,           // Reference to the session
  studentId: ObjectId,           // Reference to the student (User)
  instructorId: ObjectId,        // Reference to the instructor
  items: [{
    name: String,                // Item name
    completed: Boolean,          // Whether item is completed
    rating: Number (0-10),       // Performance rating
    comments: String,            // Instructor comments
    tally: Number                // Count or score
  }],
  notes: [{
    text: String,                // Note content
    date: Date                   // When note was added
  }],
  status: String,                // "pending", "in_progress", "completed"
  createdAt: Date,
  updatedAt: Date
}
```

### 2. API Endpoints

#### Get Checklists by Customer
```
GET /api/customers/[customerId]/session-checklists
```

**Response**: Array of checklists with calculated progress and average rating.

#### Get Single Checklist
```
GET /api/session-checklist?id={checklistId}
GET /api/session-checklist?sessionId={sessionId}
```

#### Create Checklist
```
POST /api/session-checklist
Body: {
  checklistType: string,
  sessionId: string,
  studentId: string,
  instructorId: string,
  items: ChecklistItem[],
  notes?: ChecklistNote[],
  status?: string
}
```

#### Update Checklist
```
PATCH /api/session-checklist
Body: {
  checklistId: string,
  items?: ChecklistItem[],
  notes?: ChecklistNote[],
  status?: string
}
```

#### Delete Checklist
```
DELETE /api/session-checklist?id={checklistId}
```

### 3. UI Component

**File**: `components/customers/ClassHistory.tsx`

**Location**: Customer Detail Page → Class History → Driving Lesson Tab

**Features**:
- Expandable table showing all checklists
- Date and status filters
- Progress bar showing completion percentage
- Average rating display
- Detailed view with all assessment items
- Star rating visualization
- Instructor notes display

### 4. TypeScript Types

**File**: `types/checklist.ts`

```typescript
export interface ChecklistItem {
  name: string;
  completed: boolean;
  rating?: number;
  comments?: string;
  tally?: number;
}

export interface ChecklistNote {
  text: string;
  date: string | Date;
}

export interface SessionChecklist {
  _id?: string;
  checklistType: string;
  sessionId: string;
  studentId: string;
  instructorId: string;
  instructorName?: string;
  items: ChecklistItem[];
  notes: ChecklistNote[];
  status: "pending" | "in_progress" | "completed";
  createdAt?: string | Date;
  updatedAt?: string | Date;
  progress?: number;
  averageRating?: string;
}
```

## Usage

### Viewing Checklists

1. Navigate to **Customers** page
2. Click on a customer
3. Go to **Class History** tab
4. Select **Driving Lesson** sub-tab
5. Click **View Details** on any checklist to expand

### Creating a Checklist

Use the POST endpoint:

```javascript
const response = await fetch('/api/session-checklist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checklistType: "Driving Skills Basics",
    sessionId: "SESSION_ID",
    studentId: "STUDENT_ID",
    instructorId: "INSTRUCTOR_ID",
    items: [
      {
        name: "Seat Adjustment",
        completed: false,
        rating: 8,
        comments: "Good positioning",
        tally: 0
      }
      // ... more items
    ],
    notes: [
      {
        text: "Student performed well overall",
        date: new Date()
      }
    ],
    status: "in_progress"
  })
});
```

### Seeding Sample Data

Run the seed script to create sample checklist data:

```bash
npx tsx scripts/seed-checklist.ts
```

## Progress Calculation

Progress is calculated as:
```typescript
const itemsWithRating = items.filter(item => item.rating > 0);
const progress = (itemsWithRating.length / items.length) * 100;
```

## Average Rating Calculation

Average rating is calculated as:
```typescript
const totalRating = items.reduce((sum, item) => sum + (item.rating || 0), 0);
const averageRating = (totalRating / items.length).toFixed(1);
```

## Responsive Design

The component is fully responsive:
- **Desktop**: 2-column grid for assessment items
- **Mobile**: Single column layout
- **Tablet**: Responsive table with horizontal scroll if needed

## Status Colors

- **Pending**: Yellow border
- **In Progress**: Blue border
- **Completed**: Green border

## Future Enhancements

- [ ] Add ability to edit checklists from the UI
- [ ] Export checklist as PDF
- [ ] Real-time updates with WebSocket
- [ ] Checklist templates
- [ ] Performance analytics dashboard
- [ ] Email notifications when checklist is completed
