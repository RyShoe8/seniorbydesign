# Vercel Blob Troubleshooting

## 403 Forbidden on Portfolio Images

If portfolio images fail to load with 403 errors, follow these verification steps.

### Domain/Project Switch (Common After Going Live)

When you switch to a live domain (e.g., seniorbydesign.com), the production deployment may use a **different Vercel project** than the one that created the blob store. The `BLOB_READ_WRITE_TOKEN` in the production project might be for a different store or missing entirely.

**Fix:**

1. **Find the project that owns the blob store** – Go to Vercel Dashboard > Storage > Blob. Find the store with ID matching your blob URLs (e.g., `ojowr6s1wfyjdusl`).
2. **Copy the token** – In that project: Settings > Environment Variables. Copy the value of `BLOB_READ_WRITE_TOKEN` (or get it from Storage > Blob store > Settings).
3. **Set it in the production project** – In the project that deploys your live domain: Settings > Environment Variables. Add or update `BLOB_READ_WRITE_TOKEN` with the copied value. Ensure it is set for Production (and Preview/Development if needed).
4. **Redeploy** – Trigger a new deployment so the env var is picked up.

The token for store `ojowr6s1wfyjdusl` should look like: `vercel_blob_rw_ojowr6s1wfyjdusl_<rest>`. The store ID in the token must match the store ID in your blob URLs.

### 1. Verify Token Store ID

The `BLOB_READ_WRITE_TOKEN` format is: `vercel_blob_rw_<storeId>_<rest>`

- Extract the store ID from your token (the segment after `vercel_blob_rw_` and before the next underscore).
- Blob URLs contain the store ID: `https://<storeId>.public.blob.vercel-storage.com/...`
- **The store ID in the token must match the store ID in your blob URLs.**

### 2. Check Vercel Dashboard

1. Go to **Vercel Dashboard** > **Storage** > **Blob**
2. Select your blob store
3. In **Settings**, confirm:
   - Store ID matches the one in your blob URLs
   - Access is set correctly (Public vs Private)
   - The `BLOB_READ_WRITE_TOKEN` environment variable is set for the correct project and environment (Production, Preview, Development)

### 3. If Store Was Recreated

If you deleted and recreated the blob store:

- **All existing blob URLs in the database are invalid.** They point to a store that no longer exists.
- **Fix:** Re-upload all portfolio images from the admin panel:
  1. Admin > Portfolio > [Category] > Images
  2. Remove old/broken image entries
  3. Upload new images
- New uploads will use the current store and work correctly.

### 4. Bypass Proxy for Testing

Set `NEXT_PUBLIC_USE_IMAGE_PROXY=false` in Vercel environment variables to load images directly from blob URLs. If the store is public and blobs exist, direct load may work. This helps isolate whether the issue is with the proxy or the blob store itself.

### 5. Contact Vercel Support

If the token and store ID match, the store was not recreated, and 403 persists, contact [Vercel Support](https://vercel.com/help) with your store ID for investigation.
