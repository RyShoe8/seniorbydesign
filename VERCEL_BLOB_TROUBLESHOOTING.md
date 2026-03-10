# Vercel Blob Troubleshooting

## 403 Forbidden on Portfolio Images

If portfolio images fail to load with 403 errors, follow these verification steps.

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
