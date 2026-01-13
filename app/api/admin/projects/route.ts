import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectsCollection } from '@/lib/db';
import { geocodeZipCode } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getProjectsCollection();
    const projects = await collection.find({}).toArray();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getProjectsCollection();
    
    // Geocode the ZIP code to get coordinates
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    if (body.zipCode) {
      const geocodeResult = await geocodeZipCode(body.zipCode);
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }
    }
    
    const project = {
      name: body.name,
      zipCode: body.zipCode,
      latitude,
      longitude,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(project);
    return NextResponse.json({ _id: result.insertedId, ...project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}





