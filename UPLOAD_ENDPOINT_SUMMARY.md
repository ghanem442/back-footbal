# Upload Endpoint - Quick Summary

## ✅ What's Done

### New Endpoint Created
```
POST /api/v1/uploads/payment-proof
```

### Request Format
- **Type:** `multipart/form-data`
- **Fields:**
  - `file` (required) - Image file (JPEG, PNG, WebP, max 5MB)
  - `paymentId` (required) - Payment UUID

### Response Format
```json
{
  "success": true,
  "data": {
    "url": "https://your-host/uploads/payment-proof/uuid-timestamp.jpg",
    "screenshotUrl": "https://your-host/uploads/payment-proof/uuid-timestamp.jpg",
    "paymentId": "uuid",
    "filename": "original-name.jpg",
    "size": 123456,
    "mimeType": "image/jpeg"
  },
  "message": {
    "en": "Payment proof uploaded successfully",
    "ar": "تم رفع إثبات الدفع بنجاح"
  }
}
```

## 🔧 Configuration

### For Local Development
```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_LOCAL_BASE_URL=http://localhost:3000/uploads
```

### For Railway Production (Recommended: S3)
```env
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### For Railway Production (Alternative: Cloudinary)
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## ⚠️ Important Notes

1. **Railway Storage:** Railway doesn't provide persistent local storage. Files will be deleted on container restart. **Use S3 or Cloudinary for production!**

2. **Default Settings Work:** The Flutter app can use the default path without any `dart-define` configuration.

3. **Authentication Required:** The endpoint requires JWT authentication.

4. **File Validation:**
   - Only images allowed (JPEG, PNG, WebP)
   - Max size: 5MB
   - Files saved in: `uploads/payment-proof/{paymentId}-{timestamp}.ext`

## 📝 Files Modified/Created

### New Files:
- `src/modules/storage/storage.controller.ts`
- `RAILWAY_STORAGE_SETUP.md` (detailed documentation)
- `UPLOAD_ENDPOINT_SUMMARY.md` (this file)

### Modified Files:
- `src/modules/storage/storage.module.ts`
- `src/modules/storage/providers/local-storage.provider.ts`
- `src/modules/payments/dto/upload-screenshot.dto.ts`
- `src/modules/payments/controllers/payment.controller.ts`
- `.env.railway`

## 🧪 Testing

### Local Test
```bash
curl -X POST http://localhost:3000/api/v1/uploads/payment-proof \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@screenshot.jpg" \
  -F "paymentId=uuid-here"
```

### Railway Test
```bash
curl -X POST https://your-app.railway.app/api/v1/uploads/payment-proof \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@screenshot.jpg" \
  -F "paymentId=uuid-here"
```

## 📚 Documentation

Full API documentation available at:
```
http://localhost:3000/api/docs
```

Look for: **Uploads** → `POST /uploads/payment-proof`

## ✅ Ready to Deploy!

The backend is ready. Just configure your storage provider (S3 or Cloudinary recommended) and deploy to Railway.
