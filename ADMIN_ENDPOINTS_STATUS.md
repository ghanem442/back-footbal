# 📋 Admin Endpoints Status

## ✅ Available Endpoints

### 1. **GET /api/v1/admin/fields**
- **الوصف**: جلب كل الملاعب مع فلاتر
- **المعاملات**:
  - `page` (optional): رقم الصفحة
  - `limit` (optional): عدد النتائج في الصفحة
  - `search` (optional): البحث بالاسم أو العنوان
  - `status` (optional): حالة الملعب
  - `ownerId` (optional): معرف المالك
- **الحماية**: يتطلب Admin token
- **مثال**:
  ```bash
  GET /api/v1/admin/fields?page=1&limit=10&status=ACTIVE
  ```

### 2. **GET /api/v1/admin/bookings**
- **الوصف**: جلب كل الحجوزات مع فلاتر
- **المعاملات**:
  - `page` (optional): رقم الصفحة
  - `limit` (optional): عدد النتائج في الصفحة
  - `status` (optional): حالة الحجز (PENDING_PAYMENT, CONFIRMED, COMPLETED, etc.)
  - `fieldId` (optional): معرف الملعب
  - `ownerId` (optional): معرف المالك
  - `search` (optional): البحث برقم الحجز أو البريد أو الهاتف
  - `startDate` (optional): تاريخ البداية
  - `endDate` (optional): تاريخ النهاية
- **الحماية**: يتطلب Admin token
- **مثال**:
  ```bash
  GET /api/v1/admin/bookings?status=CONFIRMED&page=1&limit=20
  ```

### 3. **GET /api/v1/admin/pending-payments** ✨ (جديد)
- **الوصف**: جلب كل الحجوزات اللي حالتها PENDING_PAYMENT
- **المعاملات**:
  - `page` (optional): رقم الصفحة
  - `limit` (optional): عدد النتائج في الصفحة
  - `fieldId` (optional): معرف الملعب
  - `ownerId` (optional): معرف المالك
  - `search` (optional): البحث برقم الحجز أو البريد أو الهاتف
- **الحماية**: يتطلب Admin token
- **ملاحظة**: هذا endpoint يستخدم نفس logic الـ bookings لكن بفلتر تلقائي على status=PENDING_PAYMENT
- **مثال**:
  ```bash
  GET /api/v1/admin/pending-payments?page=1&limit=10
  ```

---

## 🔐 Authentication

كل الـ endpoints دي تتطلب:
1. **JWT Token** في الـ Authorization header
2. **Role = ADMIN** في الـ token

**مثال على الـ header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testing

استخدم الـ script ده لاختبار الـ endpoints:

```powershell
.\test-admin-routes.ps1 YOUR_ADMIN_TOKEN
```

---

## ❌ Common Errors

### 404 Not Found
- **السبب**: الـ endpoint مش موجود أو الـ URL غلط
- **الحل**: تأكد من الـ URL صحيح: `/api/v1/admin/...`

### 401 Unauthorized
- **السبب**: الـ token مش موجود أو expired
- **الحل**: سجل دخول مرة تانية واحصل على token جديد

### 403 Forbidden
- **السبب**: الـ user مش admin
- **الحل**: تأكد إن الـ user role = ADMIN في الـ database

---

## 📝 Notes

- الـ endpoint `/api/v1/admin/pending-payments` تم إضافته كـ shortcut للحصول على الحجوزات المعلقة
- يمكنك استخدام `/api/v1/admin/bookings?status=PENDING_PAYMENT` بدلاً منه إذا أردت
- كل الـ endpoints تدعم pagination بشكل افتراضي
- الـ default page size = 10 items

---

## 🔄 Alternative: Using bookings endpoint

بدلاً من استخدام `/pending-payments`، يمكنك استخدام:

```bash
GET /api/v1/admin/bookings?status=PENDING_PAYMENT
```

النتيجة ستكون نفسها تماماً.
