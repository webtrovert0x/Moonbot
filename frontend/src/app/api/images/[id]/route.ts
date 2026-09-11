import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return new NextResponse('Invalid image ID', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const imageDoc = await db.collection('images').findOne({ _id: new ObjectId(id) });

    if (!imageDoc || !imageDoc.data) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const buffer = imageDoc.data.buffer
      ? Buffer.from(imageDoc.data.buffer)
      : Buffer.from(imageDoc.data);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': imageDoc.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Image serve error:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
