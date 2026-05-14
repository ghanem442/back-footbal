# Railway Storage Setup - تم الإنجاز ✅

## ما تم إنجازه على الباك إند

### 1. Endpoint جديد لرفع الملفات ✅

**المسار:** `POST /api/v1/uploads/payment-proof`

**نوع الطلب:** `multipart/form-data`

**الحقول المطلوبة:**
- `file` - ملف الصورة (JPEG, PNG, WebP)
- `paymentId` - معرف الدفع (UUID)

**الحد الأقصى لحجم الملف:** 5MB

### 2. شكل الرد (Response)

```json
{
  "success": true,
  "data": {
    "url": "http://your-railway-host/uploads/payment-proof/payment-id-timestamp.jpg",
    "screenshotUrl": "http://your-railway-host/uploads/payment-proof/payment-id-timestamp.jpg",
    "paymentId": "uuid-here",
    "filename": "screenshot.jpg",
    "size": 123456,
    "mimeType": "image/jpeg"
  },
  "message": {
    "en": "Payment proof uploaded successfully",
    "ar": "تم رفع إثبات الدفع بنجاح"
  }
}
```

**ملاحظة:** الرد يحتوي على كل من `url` و `screenshotUrl` للتوافق مع أي من الحقلين.

### 3. الإعدادات المطلوبة

#### للتطوير المحلي (Local):
في ملف `.env`:
```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_LOCAL_BASE_URL=http://localhost:3000/uploads
```

#### للإنتاج على Railway:
في ملف `.env.railway` أو Railway Dashboard:
```env
# Option 1: استخدام Local Storage على Railway
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_LOCAL_BASE_URL=https://your-app.railway.app/uploads

# Option 2: استخدام AWS S3 (موصى به للإنتاج)
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Option 3: استخدام Cloudinary
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. الملفات التي تم تعديلها/إنشاؤها

#### ملفات جديدة:
- ✅ `src/modules/storage/storage.controller.ts` - Controller للرفع
- ✅ `src/modules/payments/dto/upload-screenshot.dto.ts` - DTO محدث

#### ملفات معدلة:
- ✅ `src/modules/storage/storage.module.ts` - إضافة Controller
- ✅ `src/modules/storage/providers/local-storage.provider.ts` - دعم المجلدات الفرعية
- ✅ `src/modules/payments/controllers/payment.controller.ts` - تحديث endpoint الرفع

### 5. الميزات

✅ **رفع آمن:** 
- التحقق من نوع الملف (صور فقط)
- التحقق من حجم الملف (حد أقصى 5MB)
- أسماء ملفات فريدة لتجنب التضارب

✅ **تنظيم الملفات:**
- الملفات تُحفظ في `uploads/payment-proof/`
- اسم الملف: `{paymentId}-{timestamp}.{ext}`

✅ **مرونة التخزين:**
- دعم Local Storage (للتطوير)
- دعم AWS S3 (للإنتاج)
- دعم Cloudinary (بديل)

✅ **حماية:**
- يتطلب JWT Authentication
- التحقق من صلاحية المستخدم

---

## للمطور الأمامي (Flutter)

### المسار الافتراضي
```
https://your-railway-host/api/v1/uploads/payment-proof
```

### مثال على الاستخدام

```dart
// لا حاجة لـ dart-define، المسار الافتراضي يعمل مباشرة
final response = await dio.post(
  'https://your-railway-host/api/v1/uploads/payment-proof',
  data: FormData.fromMap({
    'file': await MultipartFile.fromFile(
      imagePath,
      filename: 'screenshot.jpg',
    ),
    'paymentId': paymentId,
  }),
  options: Options(
    headers: {
      'Authorization': 'Bearer $token',
    },
  ),
);

// الرد
final url = response.data['data']['url'];
// أو
final screenshotUrl = response.data['data']['screenshotUrl'];
```

### الإعدادات الافتراضية (تعمل بدون dart-define)

✅ **اسم حقل الملف:** `file` (افتراضي)
✅ **المسار:** `/api/v1/uploads/payment-proof` (افتراضي)
✅ **الرد:** يحتوي على `url` و `screenshotUrl`

### إذا أردت تغيير الإعدادات (اختياري)

```bash
# فقط إذا كان المسار مختلف
--dart-define=PAYMENT_PROOF_UPLOAD_PATH=/custom/path

# فقط إذا كان اسم الحقل مختلف
--dart-define=PAYMENT_PROOF_FILE_FIELD=screenshot
```

---

## الاختبار

### اختبار محلي (Local)

```bash
curl -X POST http://localhost:3000/api/v1/uploads/payment-proof \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/screenshot.jpg" \
  -F "paymentId=uuid-here"
```

### اختبار على Railway

```bash
curl -X POST https://your-app.railway.app/api/v1/uploads/payment-proof \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/screenshot.jpg" \
  -F "paymentId=uuid-here"
```

### الرد المتوقع

```json
{
  "success": true,
  "data": {
    "url": "https://your-app.railway.app/uploads/payment-proof/uuid-timestamp.jpg",
    "screenshotUrl": "https://your-app.railway.app/uploads/payment-proof/uuid-timestamp.jpg",
    "paymentId": "uuid-here",
    "filename": "screenshot.jpg",
    "size": 123456,
    "mimeType": "image/jpeg"
  },
  "message": {
    "en": "Payment proof uploaded successfully",
    "ar": "تم رفع إثبات الدفع بنجاح"
  }
}
```

---

## ملاحظات مهمة

### 1. Railway Storage
⚠️ **تحذير:** Railway لا يوفر persistent storage بشكل افتراضي. الملفات المرفوعة قد تُحذف عند إعادة تشغيل الـ container.

**الحلول:**
- ✅ **موصى به:** استخدام AWS S3 أو Cloudinary للإنتاج
- ⚠️ **للتطوير فقط:** استخدام Local Storage

### 2. إعداد AWS S3 (موصى به للإنتاج)

1. إنشاء S3 Bucket على AWS
2. إعداد IAM User مع صلاحيات S3
3. إضافة المتغيرات في Railway Dashboard:
   ```
   STORAGE_PROVIDER=s3
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   ```

### 3. إعداد Cloudinary (بديل)

1. إنشاء حساب على Cloudinary
2. الحصول على API credentials
3. إضافة المتغيرات في Railway Dashboard:
   ```
   STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

---

## Swagger Documentation

بعد تشغيل السيرفر، يمكنك رؤية التوثيق الكامل على:
```
http://localhost:3000/api/docs
```

ابحث عن:
- **Uploads** → `POST /uploads/payment-proof`

---

## الخلاصة

✅ **تم إنشاء Endpoint جديد:** `POST /api/v1/uploads/payment-proof`
✅ **يستقبل:** `multipart/form-data` مع `file` و `paymentId`
✅ **يرجع:** JSON مع `url` و `screenshotUrl`
✅ **يدعم:** Local, S3, Cloudinary storage
✅ **آمن:** يتطلب JWT authentication
✅ **جاهز للاستخدام:** لا حاجة لإعدادات إضافية في Flutter

**المسار الافتراضي يعمل مباشرة بدون dart-define! 🎉**
