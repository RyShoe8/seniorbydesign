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
          }
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error geocoding project ${project.name}:`, error);
          failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      geocoded,
      failed,
      total: projects.length,
    });
  } catch (error) {
    console.error('Error batch geocoding projects:', error);
    return NextResponse.json(
      { error: 'Failed to geocode projects' },
      { status: 500 }
    );
  }
}
