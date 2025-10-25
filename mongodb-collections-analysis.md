# MongoDB Collections Analysis Report

## Summary
- **Total Collections**: 29
- **Total Models**: 21
- **Collections Missing Models**: 15
- **Models Without Collections**: 7

## Existing Collections
- scheduledemails
- users
- packages
- sessionchecklists
- authcodes
- products
- resumenseccions
- carts
- classtypes
- transactions
- ticketclasses
- locations
- contacts
- certificates
- instructors
- gmailtemplates
- sessions
- onlinecourses
- seos
- drivingclasses
- orders
- certificatetemplates
- faq
- settings
- passwordresetcodes
- phones
- payments
- admin
- notes

## Existing Models
- Cerificate
- CertificateTemplate
- Class
- ClassType
- Collection
- EmailTemplate
- Instructor
- Locations
- OnlineCourse
- Order
- Package
- Payments
- Phone
- Product
- ResumenSeccion
- ScheduledEmail
- SEO
- SessionChecklist
- Settings
- TicketClass
- users

## Collections Missing Models
- **users** → Should create: `User.ts`
- **authcodes** → Should create: `AuthCode.ts`
- **carts** → Should create: `Cart.ts`
- **transactions** → Should create: `Transaction.ts`
- **locations** → Should create: `Location.ts`
- **contacts** → Should create: `Contact.ts`
- **certificates** → Should create: `Certificate.ts`
- **gmailtemplates** → Should create: `GmailTemplate.ts`
- **sessions** → Should create: `Session.ts`
- **drivingclasses** → Should create: `DrivingClass.ts`
- **faq** → Should create: `FAQ.ts`
- **passwordresetcodes** → Should create: `PasswordResetCode.ts`
- **payments** → Should create: `Payment.ts`
- **admin** → Should create: `Admin.ts`
- **notes** → Should create: `Note.ts`

## Models Without Collections
- **Cerificate** → No matching collection found (candidate for removal)
- **Class** → No matching collection found (candidate for removal)
- **Collection** → No matching collection found (candidate for removal)
- **EmailTemplate** → No matching collection found (candidate for removal)
- **Locations** → No matching collection found (candidate for removal)
- **Payments** → No matching collection found (candidate for removal)
- **users** → No matching collection found (candidate for removal)

## Complete Collection → Model Mapping
- scheduledemails → ScheduledEmail ✅
- users → User ❌
- packages → Package ✅
- sessionchecklists → SessionChecklist ✅
- authcodes → AuthCode ❌
- products → Product ✅
- resumenseccions → ResumenSeccion ✅
- carts → Cart ❌
- classtypes → ClassType ✅
- transactions → Transaction ❌
- ticketclasses → TicketClass ✅
- locations → Location ❌
- contacts → Contact ❌
- certificates → Certificate ❌
- instructors → Instructor ✅
- gmailtemplates → GmailTemplate ❌
- sessions → Session ❌
- onlinecourses → OnlineCourse ✅
- seos → SEO ✅
- drivingclasses → DrivingClass ❌
- orders → Order ✅
- certificatetemplates → CertificateTemplate ✅
- faq → FAQ ❌
- settings → Settings ✅
- passwordresetcodes → PasswordResetCode ❌
- phones → Phone ✅
- payments → Payment ❌
- admin → Admin ❌
- notes → Note ❌

## Model → Collection Mapping
- Cerificate → certificates ✅
- CertificateTemplate → certificatetemplates ✅
- Class → drivingclasses ✅
- ClassType → classtypes ✅
- EmailTemplate → gmailtemplates ✅
- Instructor → instructors ✅
- Locations → locations ✅
- OnlineCourse → onlinecourses ✅
- Order → orders ✅
- Package → packages ✅
- Phone → phones ✅
- Product → products ✅
- ResumenSeccion → resumenseccions ✅
- ScheduledEmail → scheduledemails ✅
- SEO → seos ✅
- SessionChecklist → sessionchecklists ✅
- Settings → settings ✅
- TicketClass → ticketclasses ✅

## Recommendations

### Models to Create
- Create `lib/models/User.ts` for collection `users`
- Create `lib/models/AuthCode.ts` for collection `authcodes`
- Create `lib/models/Cart.ts` for collection `carts`
- Create `lib/models/Transaction.ts` for collection `transactions`
- Create `lib/models/Location.ts` for collection `locations`
- Create `lib/models/Contact.ts` for collection `contacts`
- Create `lib/models/Certificate.ts` for collection `certificates`
- Create `lib/models/GmailTemplate.ts` for collection `gmailtemplates`
- Create `lib/models/Session.ts` for collection `sessions`
- Create `lib/models/DrivingClass.ts` for collection `drivingclasses`
- Create `lib/models/FAQ.ts` for collection `faq`
- Create `lib/models/PasswordResetCode.ts` for collection `passwordresetcodes`
- Create `lib/models/Payment.ts` for collection `payments`
- Create `lib/models/Admin.ts` for collection `admin`
- Create `lib/models/Note.ts` for collection `notes`

### Models to Review for Removal
- Review `lib/models/Cerificate.ts` - no matching collection found
- Review `lib/models/Class.ts` - no matching collection found
- Review `lib/models/Collection.ts` - no matching collection found
- Review `lib/models/EmailTemplate.ts` - no matching collection found
- Review `lib/models/Locations.ts` - no matching collection found
- Review `lib/models/Payments.ts` - no matching collection found
- Review `lib/models/users.ts` - no matching collection found

---
Generated on: 2025-10-25T00:12:06.468Z
