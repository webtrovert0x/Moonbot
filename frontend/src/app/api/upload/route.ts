import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const contentTypeHeader = req.headers.get('content-type') || '';
    let imageBuffer: Buffer;
    let mimeType = 'image/png';
    let filename = 'coin_logo';

    if (contentTypeHeader.includes('application/json')) {
      const body = await req.json();
      const base64Data = body.data || body.imageUri;

      if (!base64Data) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      // Check if data URL
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
      filename = body.filename || 'coin_logo';
    } else {
      // Multipart form data
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      mimeType = file.type || 'image/png';
      filename = file.name || 'coin_logo';
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    // Save to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const imagesCollection = db.collection('images');

    const result = await imagesCollection.insertOne({
      filename,
      contentType: mimeType,
      data: imageBuffer,
      createdAt: new Date(),
    });

    const imageId = result.insertedId.toString();
    const imageUrl = `/api/images/${imageId}`;

    return NextResponse.json({
      success: true,
      id: imageId,
      url: imageUrl,
    });
  } catch (error: any) {
    console.error('MongoDB upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image to MongoDB' },
      { status: 500 }
    );
  }
}
