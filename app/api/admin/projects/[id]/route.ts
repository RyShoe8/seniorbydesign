import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectsCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { geocodeZipCode } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getProjectsCollection();
    
    // Use manual coordinates if provided, otherwise geocode the ZIP code
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    if (body.latitude != null && body.longitude != null) {
      // Manual coordinates provided - use them
      latitude = typeof body.latitude === 'number' ? body.latitude : parseFloat(body.latitude);
      longitude = typeof body.longitude === 'number' ? body.longitude : parseFloat(body.longitude);
    } else if (body.zipCode) {
      // Auto-geocode from ZIP code
      const geocodeResult = await geocodeZipCode(body.zipCode);
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }
    }
    
    const update = {
      name: body.name,
      zipCode: body.zipCode,
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getProjectsCollection();
    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getProjectsCollection();
    
    if (body.action === 'clearGeocode') {
      // Clear geocoding coordinates using $unset to remove the fields
      await collection.updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $unset: { 
            latitude: '', 
            longitude: '',
          },
          $set: {
            updatedAt: new Date(),
          }
        }
      );
      return NextResponse.json({ success: true, message: 'Geocoding cleared' });
    } else if (body.action === 'regeocode') {
      // Re-geocode the project
      const project = await collection.findOne({ _id: new ObjectId(params.id) });
      if (!project || !project.zipCode) {
        return NextResponse.json(
          { error: 'Project not found or missing ZIP code' },
          { status: 404 }
        );
      }
      
      const geocodeResult = await geocodeZipCode(project.zipCode);
      if (geocodeResult) {
        await collection.updateOne(
          { _id: new ObjectId(params.id) },
          {
            $set: {
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
              updatedAt: new Date(),
            },
          }
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Project re-geocoded successfully',
          coordinates: {
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
          }
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to geocode ZIP code' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing PATCH request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}





