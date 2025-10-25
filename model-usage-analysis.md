# Model Usage Analysis Report

## Summary
- **Total models found**: 21
- **Total files scanned**: 344
- **Unused models**: 0
- **Potentially unused models** (cron-related): 0

## Detailed Model Usage

### Cerificate
- **File**: `lib\models\Cerificate.ts`
- **Used in 3 files**
- **Usage locations**:
  - `app\api\customers\[customerId]\certificates\route.ts`
  - `app\api\ticket\classes\students\[classId]\route.ts`
  - `lib\mongoDB.ts`

### CertificateTemplate
- **File**: `lib\models\CertificateTemplate.ts`
- **Used in 20 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\ticket\certificate-templates\page.tsx`
  - `app\(dashboard)\ticket\youthful-offender-class\class-records\[classId]\page.tsx`
  - `app\(dashboard)\ticket\[classtype]\certificate-editor\page.tsx`
  - `app\(dashboard)\ticket\[classtype]\class-records\[classId]\page.tsx`
  - `app\api\certificate-templates\add-youthful-offender\route.ts`
  - `app\api\certificate-templates\initialize\route.ts`
  - `app\api\certificate-templates\route.ts`
  - `app\api\certificate-templates\[templateId]\route.ts`
  - `components\certificate-editor\CertificateCanvas.tsx`
  - `components\certificate-editor\CertificateEditor.tsx`
  - `components\certificate-editor\types.ts`
  - `components\certificate-editor\VariableValidationModal.tsx`
  - `components\ticket\hooks\pdf-helpers\draw-background.ts`
  - `components\ticket\hooks\use-dynamic-certificate-generator.tsx`
  - `components\ticket\hooks\use-master-certificate-generator.tsx`
  - `lib\defaultTemplates\bdiTemplate.ts`
  - `lib\defaultTemplates\govTemplate.ts`
  - `lib\defaultTemplates\youthfulOffenderTemplate.ts`
  - `lib\models\CertificateTemplate.ts`
  - `scripts\analyze-mongodb-collections.ts`

### Class
- **File**: `lib\models\Class.tsx`
- **Used in 52 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\classes\page.tsx`
  - `app\(dashboard)\classes\[classId]\page.tsx`
  - `app\(dashboard)\classes\[classId]\seo\page.tsx`
  - `app\(dashboard)\console\contact\page.tsx`
  - `app\(dashboard)\ticket\day-of-class\[classType]\page.tsx`
  - `app\(dashboard)\ticket\youthful-offender-class\class-records\[classId]\page.tsx`
  - `app\(dashboard)\ticket\[classtype]\page.tsx`
  - `app\api\certificate-templates\initialize\route.ts`
  - `app\api\classes\route.ts`
  - `app\api\classes\[classId]\route.ts`
  - `app\api\classtypes\route.ts`
  - `app\api\classtypes\[classtypeId]\route.ts`
  - `app\api\cron\send-class-reminders\route.ts`
  - `app\api\cron\send-instructor-schedule\route.ts`
  - `app\api\cron\send-ticketclass-reminders\route.ts`
  - `app\api\customers\[customerId]\certificates\route.ts`
  - `app\api\customers\[customerId]\classes\route.ts`
  - `app\api\instructors\[instructorId]\route.tsx`
  - `app\api\orders\route.ts`
  - `app\api\ticket\calendar\route.ts`
  - `app\api\ticket\classes\route.ts`
  - `app\api\ticket\classes\students\[classId]\route.ts`
  - `app\api\ticket\classes\[classId]\route.ts`
  - `components\certificate-editor\CertificateEditor.tsx`
  - `components\certificate-editor\types.ts`
  - `components\classes\ClassesForm.tsx`
  - `components\classes\ClassTypeManager.tsx`
  - `components\custom ui\SeoTab.tsx`
  - `components\customers\CertificateHistory.tsx`
  - `components\customers\ClassHistory.tsx`
  - `components\customers\CustomerTabs.tsx`
  - `components\driving-test-lessons\ScheduleModal.tsx`
  - `components\instructors\InstructorBasicInfo.tsx`
  - `components\instructors\InstructorForm.tsx`
  - `components\instructors\InstructorsColumns.tsx`
  - `components\ticket\adi-certificate\components\certificate-preview.tsx`
  - `components\ticket\adi-certificate\hooks\use-pdf-generator.tsx`
  - `components\ticket\gov-certificate\components\certificate-preview.tsx`
  - `components\ticket\gov-certificate\types.ts`
  - `components\ticket\hooks\use-adi-certificate-generator.tsx`
  - `components\ticket\hooks\use-date-certificate-generator.tsx`
  - `components\ticket\ScheduleModal.tsx`
  - `components\ui\ContactForm.tsx`
  - `components\ui\GuideButton.tsx`
  - `components\ui\notifications\DrivingLessonsNotifications.tsx`
  - `components\ui\notifications\DrivingTestNotifications.tsx`
  - `components\ui\notifications\TicketNotifications.tsx`
  - `lib\defaultTemplates\bdiTemplate.ts`
  - `lib\defaultTemplates\govTemplate.ts`
  - `lib\defaultTemplates\youthfulOffenderTemplate.ts`
  - `lib\models\CertificateTemplate.ts`
  - `lib\mongoDB.ts`

### ClassType
- **File**: `lib\models\ClassType.ts`
- **Used in 6 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\classes\[classId]\route.ts`
  - `app\api\classtypes\route.ts`
  - `app\api\classtypes\[classtypeId]\route.ts`
  - `components\classes\ClassesForm.tsx`
  - `lib\models\ClassType.ts`
  - `scripts\analyze-mongodb-collections.ts`

### Collection
- **File**: `lib\models\Collection.ts`
- **Used in 6 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\collections\route.ts`
  - `app\api\collections\[collectionId]\route.ts`
  - `components\ui\GuideButton.tsx`
  - `lib\models\Collection.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### EmailTemplate
- **File**: `lib\models\EmailTemplate.ts`
- **Used in 4 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\email\templates\route.ts`
  - `lib\models\EmailTemplate.ts`
  - `lib\mongoDB.ts`
  - `scripts\sendScheduledEmails.ts`

### Instructor
- **File**: `lib\models\Instructor.ts`
- **Used in 55 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\driving-test-lessons\page.tsx`
  - `app\(dashboard)\instructors\page.tsx`
  - `app\(dashboard)\instructors\[instructorId]\page.tsx`
  - `app\api\certificate-templates\initialize\route.ts`
  - `app\api\cron\send-class-reminders\route.ts`
  - `app\api\cron\send-instructor-schedule\route.ts`
  - `app\api\customers\[customerId]\driving-lessons\route.ts`
  - `app\api\customers\[customerId]\driving-tests\route.ts`
  - `app\api\driving-test-lessons\copy-event\route.ts`
  - `app\api\driving-test-lessons\delete-event\route.ts`
  - `app\api\driving-test-lessons\driving-lesson\route.ts`
  - `app\api\driving-test-lessons\driving-test\route.ts`
  - `app\api\driving-test-lessons\events\route.ts`
  - `app\api\driving-test-lessons\pending\route.ts`
  - `app\api\driving-test-lessons\update-event\route.ts`
  - `app\api\instructors\pending\route.ts`
  - `app\api\instructors\route.tsx`
  - `app\api\instructors\schedule\route.ts`
  - `app\api\instructors\stream\route.ts`
  - `app\api\instructors\[instructorId]\route.tsx`
  - `app\api\instructors\[instructorId]\schedule\driving-lesson\[lessonId]\accept\route.ts`
  - `app\api\instructors\[instructorId]\schedule\driving-lesson\[lessonId]\reject\route.ts`
  - `app\api\instructors\[instructorId]\schedule\driving-test\[testId]\accept\route.ts`
  - `app\api\instructors\[instructorId]\schedule\driving-test\[testId]\reject\route.ts`
  - `app\api\instructors\[instructorId]\schedule\route.ts`
  - `app\api\instructors\[instructorId]\ticket-classes\route.ts`
  - `app\api\ticket\classes\batch\route.ts`
  - `components\certificate-editor\CertificateEditor.tsx`
  - `components\custom ui\Delete.tsx`
  - `components\custom ui\SeoTab.tsx`
  - `components\customers\ClassHistory.tsx`
  - `components\driving-test-lessons\InstructorsRow.tsx`
  - `components\driving-test-lessons\ScheduleModal.tsx`
  - `components\instructors\InstructorBasicInfo.tsx`
  - `components\instructors\InstructorForm.tsx`
  - `components\instructors\useInstructorForm.ts`
  - `components\locations\LocationsForm.tsx`
  - `components\ticket\gov-certificate\components\certificate-form.tsx`
  - `components\ticket\gov-certificate\components\certificate-preview.tsx`
  - `components\ticket\hooks\use-certificate-generator.tsx`
  - `components\ui\ContactForm.tsx`
  - `components\ui\GuideButton.tsx`
  - `components\ui\notifications\DrivingLessonsNotifications.tsx`
  - `components\ui\notifications\DrivingTestNotifications.tsx`
  - `components\ui\TemplatesPanel.tsx`
  - `lib\defaultTemplates\bdiTemplate.ts`
  - `lib\defaultTemplates\govTemplate.ts`
  - `lib\defaultTemplates\youthfulOffenderTemplate.ts`
  - `lib\models\Cerificate.ts`
  - `lib\models\Instructor.ts`
  - `lib\models\Locations.tsx`
  - `lib\models\SessionChecklist.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`
  - `scripts\seed-checklist.ts`

### Locations
- **File**: `lib\models\Locations.tsx`
- **Used in 12 files**
- **⚡ Dynamically imported**
- **Usage locations**:
  - `app\(dashboard)\console\analytics\page.tsx`
  - `app\(dashboard)\locations\page.tsx`
  - `app\api\customers\[customerId]\classes\route.ts`
  - `app\api\locations\route.tsx`
  - `app\api\locations\[locationId]\route.tsx`
  - `app\api\ticket\calendar\route.ts`
  - `app\api\ticket\classes\batch\route.ts`
  - `app\api\ticket\classes\route.ts`
  - `app\api\ticket\classes\students\[classId]\route.ts`
  - `components\ui\GuideButton.tsx`
  - `lib\constants.tsx`
  - `lib\mongoDB.ts`

### OnlineCourse
- **File**: `lib\models\OnlineCourse.ts`
- **Used in 9 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\online-courses\[online-courseId]\seo\page.tsx`
  - `app\api\online-courses\route.ts`
  - `app\api\online-courses\[courseId]\route.ts`
  - `components\custom ui\SeoTab.tsx`
  - `components\seo\SeoPage.tsx`
  - `lib\models\OnlineCourse.ts`
  - `lib\models\SEO.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### Order
- **File**: `lib\models\Order.ts`
- **Used in 22 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\orders\page.tsx`
  - `app\(dashboard)\ticket\youthful-offender-class\class-records\[classId]\page.tsx`
  - `app\api\customers\route.ts`
  - `app\api\customers\[customerId]\route.ts`
  - `app\api\orders\route.ts`
  - `app\api\orders\stream\route.ts`
  - `app\api\ticket\classes\students\[classId]\route.ts`
  - `components\customers\RegisterAndPaymentInformation.tsx`
  - `components\OrdersTable.tsx`
  - `components\OrdersTable_fixed.tsx`
  - `components\ticket\gov-certificate\components\certificate-form.tsx`
  - `components\ticket\gov-certificate\components\certificate-preview.tsx`
  - `components\ticket\payment-method-modal.tsx`
  - `components\ui\GuideButton.tsx`
  - `lib\defaultTemplates\govTemplate.ts`
  - `lib\defaultTemplates\youthfulOffenderTemplate.ts`
  - `lib\models\Order.ts`
  - `lib\models\Payments.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`
  - `scripts\test-youthful-offender-certificate.ts`
  - `types\order.ts`

### Package
- **File**: `lib\models\Package.ts`
- **Used in 10 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\packages\page.tsx`
  - `app\(dashboard)\packages\[packageId]\page.tsx`
  - `app\api\packages\route.ts`
  - `components\OrdersTable.tsx`
  - `components\OrdersTable_fixed.tsx`
  - `components\packages\PackageForm.tsx`
  - `components\ui\GuideButton.tsx`
  - `lib\models\Package.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### Payments
- **File**: `lib\models\Payments.ts`
- **Used in 5 files**
- **Usage locations**:
  - `app\api\customers\route.ts`
  - `app\api\customers\[customerId]\route.ts`
  - `app\api\ticket\classes\students\[classId]\route.ts`
  - `lib\models\Payments.ts`
  - `lib\mongoDB.ts`

### Phone
- **File**: `lib\models\Phone.ts`
- **Used in 17 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\console\page.tsx`
  - `app\api\generate-adi-certificate\route.ts`
  - `app\api\phones\route.ts`
  - `app\api\phones\[id]\route.ts`
  - `components\customers\ContactInformation.tsx`
  - `components\customers\CustomersForm.tsx`
  - `components\modals\PhoneEditModal.tsx`
  - `components\modals\UserInfoModal.tsx`
  - `components\ticket\bdi-certificate-modal.tsx`
  - `components\ticket\bdi-certificate.tsx`
  - `components\ticket\hooks\use-adi-certificate-downloader.tsx`
  - `components\ticket\hooks\use-bdi-certificate-downloader.tsx`
  - `components\ticket\hooks\use-multi-certificate-downloader.tsx`
  - `lib\defaultTemplates\govTemplate.ts`
  - `lib\models\Phone.ts`
  - `hooks\usePhone.ts`
  - `scripts\analyze-mongodb-collections.ts`

### Product
- **File**: `lib\models\Product.ts`
- **Used in 10 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\packages\[packageId]\route.ts`
  - `app\api\products\route.ts`
  - `app\api\products\[productId]\route.ts`
  - `components\driving-test-lessons\ScheduleModal.tsx`
  - `components\products\ProductDetails.tsx`
  - `components\products\ProductForm.tsx`
  - `components\ui\GuideButton.tsx`
  - `lib\models\Product.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### ResumenSeccion
- **File**: `lib\models\ResumenSeccion.ts`
- **Used in 6 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\analytics\route.ts`
  - `app\api\cron\generate-daily-session-summary\route.ts`
  - `lib\models\ResumenSeccion.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`
  - `scripts\generateDailySessionSummary.ts`

### ScheduledEmail
- **File**: `lib\models\ScheduledEmail.ts`
- **Used in 6 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\cron\send-scheduled-email\route.ts`
  - `app\api\email\send\route.ts`
  - `lib\models\ScheduledEmail.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`
  - `scripts\sendScheduledEmails.ts`

### SEO
- **File**: `lib\models\SEO.ts`
- **Used in 16 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\classes\page.tsx`
  - `app\(dashboard)\seo\page.tsx`
  - `app\(dashboard)\seo\seo-service.ts`
  - `app\(dashboard)\seo\settings.tsx`
  - `app\api\seo\route.ts`
  - `app\api\seo\[seoId]\route.ts`
  - `components\classes\ClassesForm.tsx`
  - `components\custom ui\SeoTab.tsx`
  - `components\locations\LocationsForm.tsx`
  - `components\online-courses\OnlineCourseForm.tsx`
  - `components\seo\SeoPage.tsx`
  - `components\ui\GuideButton.tsx`
  - `lib\constants.tsx`
  - `lib\models\SEO.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### SessionChecklist
- **File**: `lib\models\SessionChecklist.ts`
- **Used in 6 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\customers\[customerId]\session-checklists\route.ts`
  - `app\api\session-checklist\route.ts`
  - `lib\models\SessionChecklist.ts`
  - `scripts\analyze-mongodb-collections.ts`
  - `scripts\seed-checklist.ts`
  - `types\checklist.ts`

### Settings
- **File**: `lib\models\Settings.ts`
- **Used in 18 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\classes\page.tsx`
  - `app\(dashboard)\seo\page.tsx`
  - `app\(dashboard)\seo\settings.tsx`
  - `app\(dashboard)\ticket\[classtype]\certificate-editor\page.tsx`
  - `app\api\cron\send-birthday-emails\route.ts`
  - `app\api\cron\send-class-reminders\route.ts`
  - `app\api\cron\send-ticketclass-reminders\route.ts`
  - `app\api\settings\route.ts`
  - `components\certificate-editor\CertificateEditor.tsx`
  - `components\classes\ClassesForm.tsx`
  - `components\custom ui\SeoTab.tsx`
  - `components\locations\LocationsForm.tsx`
  - `components\online-courses\OnlineCourseForm.tsx`
  - `components\seo\SeoPage.tsx`
  - `components\ui\GuideButton.tsx`
  - `lib\models\Settings.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### TicketClass
- **File**: `lib\models\TicketClass.ts`
- **Used in 22 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\api\check-indexes\route.ts`
  - `app\api\cron\send-ticketclass-reminders\route.ts`
  - `app\api\customers\route.ts`
  - `app\api\customers\[customerId]\certificates\route.ts`
  - `app\api\customers\[customerId]\classes\route.ts`
  - `app\api\customers\[customerId]\route.ts`
  - `app\api\instructors\[instructorId]\route.tsx`
  - `app\api\instructors\[instructorId]\ticket-classes\route.ts`
  - `app\api\orders\route.ts`
  - `app\api\ticket\calendar\route.ts`
  - `app\api\ticket\classes\batch\route.ts`
  - `app\api\ticket\classes\route.ts`
  - `app\api\ticket\classes\students\[classId]\route.ts`
  - `app\api\ticket\classes\[classId]\route.ts`
  - `app\api\ticket\migrate-indexes\route.ts`
  - `app\api\ticket\pending\route.ts`
  - `app\api\ticketclasses\route.ts`
  - `components\ticket\ScheduleModal.tsx`
  - `components\ui\notifications\TicketNotifications.tsx`
  - `lib\models\TicketClass.ts`
  - `lib\mongoDB.ts`
  - `scripts\analyze-mongodb-collections.ts`

### users
- **File**: `lib\models\users.ts`
- **Used in 26 files**
- **🕒 Used in cron/scheduled tasks**
- **Usage locations**:
  - `app\(dashboard)\console\page.tsx`
  - `app\(dashboard)\orders\page.tsx`
  - `app\api\cron\send-birthday-emails\route.ts`
  - `app\api\cron\send-class-reminders\route.ts`
  - `app\api\cron\send-ticketclass-reminders\route.ts`
  - `app\api\customers\route.ts`
  - `app\api\customers\[customerId]\certificates\route.ts`
  - `app\api\debug\check-db\route.ts`
  - `app\api\heatmap\route.ts`
  - `app\api\init-admin\route.ts`
  - `app\api\orders\route.ts`
  - `app\api\orders\stream\route.ts`
  - `app\api\users\route.ts`
  - `app\api\users\[userId]\route.ts`
  - `components\customers\CustomersForm.tsx`
  - `components\driving-test-lessons\ScheduleModal.tsx`
  - `components\ticket\gov-certificate\hooks\use-user-search.tsx`
  - `components\ticket\hooks\use-dynamic-certificate-generator.tsx`
  - `components\ui\ActiveUsersCard.tsx`
  - `components\ui\ContactForm.tsx`
  - `components\ui\GuideButton.tsx`
  - `components\ui\InactiveUsersCard.tsx`
  - `components\ui\notifications\TicketNotifications.tsx`
  - `lib\mongoDB.ts`
  - `hooks\useNotifications.ts`
  - `scripts\analyze-mongodb-collections.ts`

