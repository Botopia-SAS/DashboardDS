# Cron Job and Scheduled Task Analysis Report

## Overview

This document identifies and catalogs all models that are used in cron jobs, scheduled tasks, and background processes to ensure they are preserved during the model organization cleanup process.

## Identified Cron Job Files and Scheduled Tasks

### 1. Script Files (Direct Execution)
- `scripts/sendScheduledEmails.ts` - Processes and sends scheduled emails
- `scripts/generateDailySessionSummary.ts` - Generates daily session summaries and cleans up session data
- `scripts/seed-checklist.ts` - Seeds checklist data (development/maintenance script)

### 2. API Cron Endpoints (External Cron Service Calls)
- `app/api/cron/send-scheduled-email/route.ts` - Processes scheduled emails via API
- `app/api/cron/send-ticketclass-reminders/route.ts` - Sends ticket class reminders
- `app/api/cron/send-class-reminders/route.ts` - Sends driving class reminders
- `app/api/cron/send-instructor-schedule/route.ts` - Sends instructor schedule notifications
- `app/api/cron/send-birthday-emails/route.ts` - Sends birthday emails to customers
- `app/api/cron/generate-daily-session-summary/route.ts` - Generates daily session summaries via API

### 3. Package.json Scripts
- `generate:daily-session-summary` - npm script to run daily session summary generation

## Models Used in Cron Jobs and Background Processes

### Critical Cron-Related Models (MUST PRESERVE)

#### 1. **ScheduledEmail** 
- **Usage**: Core model for email scheduling system
- **Files**: 
  - `scripts/sendScheduledEmails.ts`
  - `app/api/cron/send-scheduled-email/route.ts`
  - `app/api/email/send/route.ts`
- **Purpose**: Stores emails to be sent at specific times
- **Protection Level**: CRITICAL - Core functionality

#### 2. **ResumenSeccion** (Session Summary)
- **Usage**: Stores daily session analytics summaries
- **Files**: 
  - `scripts/generateDailySessionSummary.ts`
  - `app/api/cron/generate-daily-session-summary/route.ts`
- **Purpose**: Daily aggregation of session data
- **Protection Level**: CRITICAL - Data aggregation

#### 3. **Session** 
- **Usage**: Source data for daily summaries (gets cleaned up after processing)
- **Files**: 
  - `scripts/generateDailySessionSummary.ts`
  - `app/api/cron/generate-daily-session-summary/route.ts`
- **Purpose**: Raw session data that gets processed and archived
- **Protection Level**: CRITICAL - Data processing

#### 4. **SessionChecklist**
- **Usage**: Seeding and maintenance operations
- **Files**: 
  - `scripts/seed-checklist.ts`
- **Purpose**: Checklist data management
- **Protection Level**: HIGH - Maintenance operations

#### 5. **EmailTemplate**
- **Usage**: Email template processing for scheduled emails
- **Files**: 
  - `scripts/sendScheduledEmails.ts`
- **Purpose**: Email template rendering
- **Protection Level**: HIGH - Email system

### Models Used in Cron Reminder Systems

#### 6. **TicketClass**
- **Usage**: Ticket class reminder notifications
- **Files**: 
  - `app/api/cron/send-ticketclass-reminders/route.ts`
- **Purpose**: Sends reminders for upcoming ticket classes
- **Protection Level**: HIGH - Customer notifications

#### 7. **Class**
- **Usage**: Driving class reminder notifications
- **Files**: 
  - `app/api/cron/send-class-reminders/route.ts`
- **Purpose**: Sends reminders for upcoming driving classes
- **Protection Level**: HIGH - Customer notifications

#### 8. **Instructor**
- **Usage**: Instructor schedule notifications
- **Files**: 
  - `app/api/cron/send-instructor-schedule/route.ts`
- **Purpose**: Sends daily schedule to instructors
- **Protection Level**: HIGH - Staff notifications

#### 9. **Customer** (implied from birthday emails)
- **Usage**: Birthday email notifications
- **Files**: 
  - `app/api/cron/send-birthday-emails/route.ts`
- **Purpose**: Customer birthday notifications
- **Protection Level**: HIGH - Customer engagement

### Additional Models Marked as Cron-Related by Analysis

The following models were identified as cron-related by the automated analysis tool but may have indirect or less obvious connections to background processes:

- **CertificateTemplate** - May be used in certificate generation background processes
- **ClassType** - Referenced in class-related cron jobs
- **Collection** - May be used in data collection/aggregation processes
- **OnlineCourse** - May have scheduled notifications or processing
- **Order** - May have scheduled order processing or notifications
- **Package** - May be part of package-related notifications
- **Phone** - May be used in SMS/phone notification systems
- **Product** - May be part of product-related scheduled processes
- **SEO** - May be used in SEO data processing or reporting
- **Settings** - May be referenced in various background processes
- **users** - Core user model likely referenced in many background processes

## Protection Rules

### NEVER REMOVE
These models are directly used in active cron jobs and scheduled tasks:
- ScheduledEmail
- ResumenSeccion
- Session
- SessionChecklist
- EmailTemplate
- TicketClass
- Class
- Instructor
- Customer

### REVIEW BEFORE REMOVAL
These models are marked as cron-related but may have indirect usage:
- CertificateTemplate
- ClassType
- Collection
- OnlineCourse
- Order
- Package
- Phone
- Product
- SEO
- Settings
- users

## Verification Process

1. **Direct Usage Check**: Verify each model is directly imported and used in cron files
2. **Dynamic Reference Check**: Look for dynamic model references or string-based model access
3. **API Endpoint Check**: Ensure models used in cron API endpoints are preserved
4. **Background Process Check**: Check for any additional background processes not identified

## Special Considerations

### External Cron Services
The application uses external cron services (likely Vercel Cron or similar) that call API endpoints with a secret token. These endpoints must remain functional:
- All `/api/cron/*` endpoints require their dependent models
- Secret-based authentication suggests production cron job usage

### Data Lifecycle Management
Some cron jobs perform data lifecycle management:
- `generateDailySessionSummary.ts` creates summaries and deletes raw session data
- `sendScheduledEmails.ts` sends emails and deletes scheduled email records

### Development vs Production
Some scripts may be development-only (like `seed-checklist.ts`), but their models should still be preserved as they may be used in production maintenance.

## Conclusion

A total of **18 models** have been identified as cron-related and should be protected from removal during the model organization process. The core email scheduling and session summary systems are the most critical, followed by the various reminder and notification systems.