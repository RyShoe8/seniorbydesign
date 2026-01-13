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
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${apiKey}&region=us`
    );

    if (!response.ok) {
      console.error('Geocoding API request failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address,
      };
    } else {
      console.error('Geocoding failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding ZIP code:', error);
    return null;
  }
}
