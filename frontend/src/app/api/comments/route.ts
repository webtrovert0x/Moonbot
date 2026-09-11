import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenAddress = searchParams.get('tokenAddress')?.toLowerCase();

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection('chats');

    const query = tokenAddress ? { tokenAddress } : {};
    const chats = await commentsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      comments: chats.map((c) => ({
        id: c._id.toString(),
        tokenAddress: c.tokenAddress,
        user: c.user,
        text: c.text,
        imageUri: c.imageUri || null,
        likes: c.likes || 0,
        timestamp: c.timestamp ? new Date(c.timestamp).getTime() : Date.now(),
      })),
    });
  } catch (error: any) {
    console.error('Chats fetch error:', error);
    return NextResponse.json({ success: false, comments: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenAddress, user, text, imageUri } = body;

    if (!tokenAddress || !text) {
      return NextResponse.json(
        { error: 'tokenAddress and text are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection('chats');

    const newChat = {
      tokenAddress: tokenAddress.toLowerCase(),
      user: user || '0xAnon...User',
      text: text.trim(),
      imageUri: imageUri || null,
      likes: 0,
      timestamp: new Date(),
    };

    const res = await commentsCollection.insertOne(newChat);

    return NextResponse.json({
      success: true,
      comment: {
        id: res.insertedId.toString(),
        ...newChat,
        timestamp: newChat.timestamp.getTime(),
      },
    });
  } catch (error: any) {
    console.error('Chat create error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save chat to MongoDB' },
      { status: 500 }
    );
  }
}
