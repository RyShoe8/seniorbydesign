# Google Maps Integration Setup

This document explains how to set up Google Maps integration for the project map management feature.

## Overview

The Google Maps integration allows you to:
- Add projects with ZIP codes
- Automatically geocode ZIP codes to get latitude/longitude coordinates
- Display all projects on an interactive map in the admin panel
- Show project locations on the public portfolio page

## Prerequisites

- Google Cloud Platform account
- Google Maps API key with the following APIs enabled:
  - **Geocoding API** (required for converting ZIP codes to coordinates)
  - **Maps JavaScript API** (required for displaying the map)

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name and ID

### 2. Enable Required APIs

1. Navigate to **APIs & Services** → **Library**
2. Search for and enable:
   - **Geocoding API**
   - **Maps JavaScript API**

### 3. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key
4. **Important**: Restrict your API key for security:
   - Click on the API key to edit it
   - Under **API restrictions**, select **Restrict key**
   - Choose only:
     - Geocoding API
     - Maps JavaScript API
   - Under **Application restrictions**, you can restrict by:
     - HTTP referrers (for web apps)
     - IP addresses (for server-side usage)

### 4. Set Environment Variables

Add the following environment variables to your deployment platform (Vercel, etc.):

#### Required Variables

- **`GOOGLE_MAPS_API_KEY`** - Your Google Maps API key (server-side)
  - Used for geocoding ZIP codes to coordinates
  - Example: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

- **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** - Your Google Maps API key (client-side)
  - Used for displaying the map in the browser
  - Can be the same key as above, but should be restricted to HTTP referrers
  - Example: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Note**: For better security, you can use two different API keys:
- One restricted to server-side usage (IP restrictions) for geocoding
- One restricted to HTTP referrers (your domain) for client-side map display

### 5. Configure API Key Restrictions (Recommended)

#### For Server-Side Key (`GOOGLE_MAPS_API_KEY`):
- **Application restrictions**: IP addresses (add your server IPs)
- **API restrictions**: Geocoding API only

#### For Client-Side Key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
- **Application restrictions**: HTTP referrers
  - Add your domain: `https://yourdomain.com/*`
  - Add localhost for development: `http://localhost:3000/*`
- **API restrictions**: Maps JavaScript API only

## How It Works

### Adding a Project

1. Go to `/admin/projects`
2. Click **Add Project**
3. Enter:
   - **Project Name**: The name of your project
   - **ZIP Code**: 5-digit US ZIP code
4. Click **Save**
5. The system automatically:
   - Geocodes the ZIP code using Google Geocoding API
   - Stores the latitude and longitude coordinates
   - Updates the project in the database

### Viewing Projects on Map

- **Admin Panel**: The map preview shows all projects at the top of the projects list
- **Public Portfolio Page**: Projects are displayed on the map at `/portfolio`

### Geocoding

When you save a project with a ZIP code:
- The backend calls Google Geocoding API
- Converts the ZIP code to coordinates
- Stores `latitude` and `longitude` in the database
- If geocoding fails, the project is still saved but won't appear on the map

## Troubleshooting

### Map Not Loading

- **Check API Key**: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- **Check API Restrictions**: Make sure Maps JavaScript API is enabled
- **Check HTTP Referrers**: If using referrer restrictions, ensure your domain is added
- **Check Browser Console**: Look for error messages

### Projects Not Appearing on Map

- **Check Coordinates**: Look at the "Coordinates" column in the admin table
- **Geocoding Failed**: If you see "Not geocoded", the ZIP code couldn't be geocoded
- **Check API Key**: Ensure `GOOGLE_MAPS_API_KEY` is set for server-side geocoding
- **Check Geocoding API**: Make sure Geocoding API is enabled in Google Cloud Console

### Geocoding Errors

- **Invalid ZIP Code**: Ensure ZIP code is a valid 5-digit US ZIP code
- **API Quota**: Check if you've exceeded Google Maps API quota
- **API Key Restrictions**: Ensure your server-side API key allows Geocoding API

## API Costs

Google Maps Platform uses a pay-as-you-go pricing model:

- **Geocoding API**: 
  - First 40,000 requests per month: Free
  - After that: $5.00 per 1,000 requests

- **Maps JavaScript API**:
  - First 28,000 map loads per month: Free
  - After that: $7.00 per 1,000 map loads

**Note**: Monitor your usage in Google Cloud Console to avoid unexpected charges.

## Security Best Practices

1. **Never commit API keys to git** - Always use environment variables
2. **Restrict API keys** - Use application and API restrictions
3. **Use separate keys** - Different keys for server-side and client-side
4. **Monitor usage** - Set up billing alerts in Google Cloud Console
5. **Rotate keys** - Regularly rotate API keys for security

## Testing

After setting up your environment variables:

1. **Test Adding a Project**:
   - Go to `/admin/projects`
   - Add a project with a valid ZIP code (e.g., `90210`)
   - Check that coordinates appear in the table

2. **Test Map Display**:
   - Verify the map appears in the admin panel
   - Check that project markers appear on the map
   - Visit `/portfolio` to see the public map

3. **Test Geocoding**:
   - Add a project with an invalid ZIP code
   - Verify it still saves but shows "Not geocoded"
   - Edit it with a valid ZIP code
   - Verify coordinates are updated
