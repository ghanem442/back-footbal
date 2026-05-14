# Payment System Fixes Summary

## Issues Fixed

### 1. Missing Endpoint: GET /api/v1/admin/payments/pending-verification (404)

**Problem:** The Flutter app was calling this endpoint but it didn't exist in the backend.

**Solution:** 
- Created new DTO: `PendingVerificationQueryDto` with pagination and payment method filtering
- Added service method: `getPendingVerificationPayments()` in `admin.service.ts`
- Added controller endpoint: `GET /admin/payments/pending-verification` in `admin.controller.ts`

**Features:**
- Pagination support (page, limit)
- Filter by payment method (VODAFONE_CASH, INSTAPAY, etc.)
- Returns payments with PENDING status that have screenshot uploaded
- Includes booking details, player info, and field info

**Usage:**
```bash
GET /api/v1/admin/payments/pending-verification?page=1&limit=20
GET /api/v1/admin/payments/pending-verification?page=1&limit=20&paymentMethod=INSTAPAY
```

---

### 2. Missing Endpoint: GET /api/v1/payments/:id/verification-status (404)

**Problem:** The Flutter app was calling this endpoint to check payment verification status.

**Solution:**
- Added new endpoint: `GET /payments/:id/verification-status` in `payment.controller.ts`

**Features:**
- Returns payment verification status
- Indicates if screenshot is required
- Shows if screenshot has been uploaded
- Returns verification state (verified, pending, failed)

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "PENDING",
    "gateway": "INSTAPAY",
    "requiresScreenshot": true,
    "hasScreenshot": true,
    "screenshotUrl": "https://...",
    "screenshotUploadedAt": "2024-01-01T00:00:00Z",
    "isVerified": false,
    "isPending": true,
    "isFailed": false
  }
}
```

---

### 3. InstaPay Gateway ENOTFOUND Error (500)

**Problem:** InstaPay gateway was trying to make real HTTP calls to `api.instapay.com.eg` which doesn't resolve or isn't accessible.

**Solution:**
- Updated `instapay.gateway.ts` to use mock mode when credentials are not configured
- Returns PENDING status with mock response
- Indicates that screenshot upload is required for manual verification
- Follows the same pattern as Vodafone Cash gateway

**Behavior:**
- If InstaPay credentials are not configured → Returns mock PENDING response
- If credentials are configured → Makes real API call
- Mock response includes `requiresScreenshot: true` flag

---

### 4. Screenshot Upload Validation (400 Error)

**Problem:** The endpoint was returning "screenshotUrl is required" because the Flutter app was sending an empty body.

**Status:** This is a **client-side issue** in the Flutter app.

**What the endpoint expects:**
```json
POST /api/v1/payments/:id/upload-screenshot
{
  "screenshotUrl": "https://storage.example.com/screenshot.jpg"
}
```

**Flutter Fix Needed:**
The Flutter app needs to:
1. Upload the screenshot image to storage first
2. Get the URL of the uploaded image
3. Send that URL in the request body with the key `screenshotUrl`

---

### 5. Global Commission Rate Warning

**Problem:** Logs showed "Global commission rate not found, returning default: 10%"

**Solution:**
- Created utility script: `set-commission-rate.js` to verify and set commission rate
- The seed script already handles this, but the utility can be run manually if needed

**Usage:**
```bash
node set-commission-rate.js
```

Or run the full seed:
```bash
npm run seed
```

---

## Files Modified

### New Files Created:
1. `src/modules/admin/dto/pending-verification-query.dto.ts` - DTO for pending verification query
2. `set-commission-rate.js` - Utility script to set commission rate
3. `PAYMENT_FIXES_SUMMARY.md` - This file

### Files Modified:
1. `src/modules/admin/admin.controller.ts` - Added pending-verification endpoint
2. `src/modules/admin/admin.service.ts` - Added getPendingVerificationPayments method
3. `src/modules/admin/dto/index.ts` - Exported new DTO
4. `src/modules/payments/controllers/payment.controller.ts` - Added verification-status endpoint
5. `src/modules/payments/gateways/instapay.gateway.ts` - Added mock mode support

---

## Testing

### Test Pending Verification Endpoint:
```bash
# Get all pending verification payments
curl -X GET "http://localhost:3000/api/v1/admin/payments/pending-verification?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by payment method
curl -X GET "http://localhost:3000/api/v1/admin/payments/pending-verification?page=1&limit=20&paymentMethod=INSTAPAY" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Verification Status Endpoint:
```bash
curl -X GET "http://localhost:3000/api/v1/payments/PAYMENT_ID/verification-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Screenshot Upload:
```bash
curl -X POST "http://localhost:3000/api/v1/payments/PAYMENT_ID/upload-screenshot" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"screenshotUrl": "https://example.com/screenshot.jpg"}'
```

---

## Next Steps

1. **Deploy the backend changes** - All endpoints are now available
2. **Fix Flutter app** - Update the screenshot upload to send the `screenshotUrl` in the request body
3. **Configure InstaPay** - If you want to use real InstaPay API, add credentials to `.env`:
   ```
   INSTAPAY_MERCHANT_ID=your_merchant_id
   INSTAPAY_API_KEY=your_api_key
   INSTAPAY_SECRET_KEY=your_secret_key
   INSTAPAY_BASE_URL=https://api.instapay.com.eg
   ```
4. **Run commission rate script** - Ensure the global commission rate is set:
   ```bash
   node set-commission-rate.js
   ```

---

## API Documentation

All endpoints are documented with Swagger/OpenAPI annotations. After starting the server, visit:
```
http://localhost:3000/api/docs
```

Look for:
- **Admin → Payments Management** section for pending-verification endpoint
- **Payments** section for verification-status and upload-screenshot endpoints
