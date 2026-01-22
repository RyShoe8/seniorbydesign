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
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Geocoding API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&region=us`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding request failed' },
        { status: 500 }
      );
    }

    const data = await response.json();

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
      return NextResponse.json(
        { error: 'Location not found', status: data.status },
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
