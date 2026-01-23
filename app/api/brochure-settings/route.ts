import { NextResponse } from 'next/server';
import { getBrochureSettingsCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const collection = await getBrochureSettingsCollection();
    const settings = await collection.findOne({});
    
    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        allowMailRequests: true,
      });
    }
    
    return NextResponse.json({
      allowMailRequests: settings.allowMailRequests,
    });
  } catch (error) {
    console.error('Error fetching brochure settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brochure settings' },
      { status: 500 }
    );
  }
}
