// Google Maps Geocoding API utility

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

/**
 * Geocode a US ZIP code to get latitude and longitude coordinates
 * @param zipCode - 5-digit US ZIP code
 * @returns Promise with latitude and longitude, or null if geocoding fails
 */
export async function geocodeZipCode(zipCode: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY environment variable is not set');
    return null;
  }

  try {
    // Use Google Geocoding API to convert ZIP code to coordinates
    // Add ", USA" to ensure we get US results, not international matches
    const addressQuery = `${zipCode}, USA`;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${apiKey}&region=us&components=country:US`
    );

    if (!response.ok) {
      console.error(`Geocoding API request failed for ZIP ${zipCode}:`, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      // Log the result for debugging
      console.log(`Geocoded ZIP ${zipCode} to: ${formattedAddress} (${location.lat}, ${location.lng})`);
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress,
      };
    } else {
      // Enhanced error logging
      const errorMsg = data.error_message || 'Unknown error';
      if (data.status === 'REQUEST_DENIED') {
        if (errorMsg.includes('referer restrictions')) {
          console.error(`Geocoding failed for ZIP ${zipCode}: REQUEST_DENIED - API key has HTTP referrer restrictions. Server-side API keys cannot use referrer restrictions. Set Application restrictions to "None" in Google Cloud Console.`);
        } else if (errorMsg.includes('IP')) {
          console.error(`Geocoding failed for ZIP ${zipCode}: REQUEST_DENIED - IP address not authorized. Add Vercel server IPs to API key restrictions or set Application restrictions to "None".`);
        } else {
          console.error(`Geocoding failed for ZIP ${zipCode}: REQUEST_DENIED - ${errorMsg}`);
        }
      } else {
        console.error(`Geocoding failed for ZIP ${zipCode}: ${data.status} - ${errorMsg}`);
      }
      return null;
    }
  } catch (error) {
    console.error(`Error geocoding ZIP code ${zipCode}:`, error);
    return null;
  }
}
