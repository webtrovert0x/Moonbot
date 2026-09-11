import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address')?.toLowerCase();

    const client = await clientPromise;
    const db = client.db();
    const tokensCollection = db.collection('tokens');

    if (address) {
      const token = await tokensCollection.findOne({ address });
      if (!token) {
        return NextResponse.json({ success: false, token: null }, { status: 404 });
      }
      return NextResponse.json({ success: true, token });
    }

    const tokens = await tokensCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      success: true,
      tokens: tokens.map((t) => ({
        ...t,
        _id: t._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error('Tokens GET error:', error);
    return NextResponse.json({ success: false, tokens: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      address,
      name,
      symbol,
      description,
      imageUri,
      twitter,
      telegram,
      website,
      creator,
      marketCapBot,
      priceBot,
      progressPercent,
      tokensSold,
      tokensForSale,
      realBotReserve,
      graduated,
      createdAt,
    } = body;

    if (!address || !name || !symbol) {
      return NextResponse.json(
        { error: 'address, name, and symbol are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const tokensCollection = db.collection('tokens');

    const tokenDoc = {
      address: address.toLowerCase(),
      name,
      symbol: symbol.toUpperCase(),
      description: description || '',
      imageUri: imageUri || '',
      twitter: twitter || '',
      telegram: telegram || '',
      website: website || '',
      creator: creator ? creator.toLowerCase() : '',
      marketCapBot: Number(marketCapBot) || 0,
      priceBot: Number(priceBot) || 0,
      progressPercent: Number(progressPercent) || 0,
      tokensSold: Number(tokensSold) || 0,
      tokensForSale: Number(tokensForSale) || 800000000,
      realBotReserve: Number(realBotReserve) || 0,
      graduated: Boolean(graduated),
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: new Date(),
    };

    const res = await tokensCollection.updateOne(
      { address: tokenDoc.address },
      { $set: tokenDoc },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      token: tokenDoc,
    });
  } catch (error: any) {
    console.error('Tokens POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save token to MongoDB' },
      { status: 500 }
    );
  }
}
