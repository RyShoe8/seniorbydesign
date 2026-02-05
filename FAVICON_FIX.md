# Favicon Fix Instructions

## Problem
The favicon is currently using `/images/SBD Logo.webp`, which is a rectangular logo. Browsers display favicons as squares (1:1 aspect ratio), so rectangular images get stretched vertically.

## Solution
Create a square version of your logo for use as a favicon. You have two options:

### Option 1: Use Next.js File-Based Icon System (Recommended)
1. Create a square version of your logo (512x512px or 1024x1024px recommended)
2. Save it as `icon.png` or `icon.ico` in the `app` directory
3. Next.js will automatically detect and use it
4. Remove the icons configuration from `app/layout.tsx` metadata (or keep it as fallback)

### Option 2: Create Square Favicon Files Manually
1. Create square versions of your logo in these sizes:
   - 16x16px (favicon-16x16.png)
   - 32x32px (favicon-32x32.png)
   - 180x180px (apple-touch-icon.png)
   - 512x512px (icon-512x512.png)
2. Place them in the `public` directory
3. Update the icons configuration in `app/layout.tsx` to reference these square files

## Quick Fix
To quickly create a square version:
1. Open your logo in an image editor
2. Crop it to a square (use the shorter dimension)
3. Or add padding to make it square while maintaining aspect ratio
4. Export as PNG or ICO format
5. Place in `app/icon.png` for automatic Next.js handling

## Current Configuration
The favicon is currently configured in `app/layout.tsx` using the metadata API. Once you create a square favicon file, update the configuration to use the new square image.
