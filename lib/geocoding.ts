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
            return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress,
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}
