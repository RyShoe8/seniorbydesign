import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectsCollection } from '@/lib/db';
import { geocodeZipCode } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getProjectsCollection();
    const projects = await collection.find({}).toArray();
    
    let geocoded = 0;
    let failed = 0;

    // Geocode projects that don't have coordinates
    const failedProjects: Array<{ name: string; zipCode: string }> = [];
    
    for (const project of projects) {
      if (project.zipCode && (!project.latitude || !project.longitude)) {
        try {
          const geocodeResult = await geocodeZipCode(project.zipCode);
          if (geocodeResult) {
            await collection.updateOne(
              { _id: project._id },
              {
                $set: {
                  latitude: geocodeResult.latitude,
                  longitude: geocodeResult.longitude,
                  updatedAt: new Date(),
                },
              }
            );
            geocoded++;
          } else {
            failed++;
            failedProjects.push({ name: project.name || 'Unknown', zipCode: project.zipCode });
          }
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failed++;
          failedProjects.push({ name: project.name || 'Unknown', zipCode: project.zipCode || 'N/A' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      geocoded,
      failed,
      total: projects.length,
      failedProjects: failedProjects.length > 0 ? failedProjects : undefined,
      message: failed > 0 
        ? `${failed} projects failed to geocode. Check server logs for details. If you see "REQUEST_DENIED" errors, ensure your GOOGLE_MAPS_API_KEY has Application restrictions set to "None" (not HTTP referrers) in Google Cloud Console.`
        : 'All projects geocoded successfully!',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to geocode projects' },
      { status: 500 }
    );
  }
}
