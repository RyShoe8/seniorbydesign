import { NextResponse } from 'next/server';
import { geocodeZipCode } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Geocode the query (can be zip code or state name)
    // Use server-side API key - this route runs on the server
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not set');
      return NextResponse.json(
        { error: 'Geocoding API key not configured' },
        { status: 500 }
      );
    }

    // Format query - if it's a state name, add ", USA" for better results
    let formattedQuery = query.trim();
    // Check if it looks like a state name (not a zip code - zip codes are numeric)
    if (isNaN(Number(formattedQuery)) && !formattedQuery.match(/^\d{5}(-\d{4})?$/)) {
      // It's likely a state name, add ", USA" if not already present
      if (!formattedQuery.toLowerCase().includes('usa') && !formattedQuery.toLowerCase().includes('united states')) {
        formattedQuery = `${formattedQuery}, USA`;
      }
    } else {
      // For ZIP codes, add ", USA" to ensure US results
      formattedQuery = `${formattedQuery}, USA`;
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedQuery)}&key=${apiKey}&region=us&components=country:US`;
    console.log('Geocoding URL:', geocodeUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(geocodeUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding request failed' },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('Google Geocoding API response:', {
      status: data.status,
      resultsCount: data.results?.length || 0,
      query,
    });

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const result = data.results[0];
      
      // Extract state and zip code from address components
      let state = '';
      let zipCode = '';
      
      result.address_components.forEach((component: any) => {
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      });

      return NextResponse.json({
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        state,
        zipCode,
      });
    } else {
      console.error('Geocoding failed:', {
        status: data.status,
        error_message: data.error_message,
        query,
      });
      
      // Provide more helpful error messages
      let errorMessage = data.error_message || `Location not found (${data.status})`;
      if (data.status === 'REQUEST_DENIED') {
        if (data.error_message?.includes('referer restrictions')) {
          errorMessage = 'API key configuration error: Server-side API key cannot use HTTP referrer restrictions. Please set Application restrictions to "None" in Google Cloud Console.';
        } else if (data.error_message?.includes('IP')) {
          errorMessage = 'API key configuration error: Server IP address not authorized. Please add Vercel server IPs to API key restrictions or set Application restrictions to "None" in Google Cloud Console.';
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          status: data.status,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error geocoding:', error);
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
}
