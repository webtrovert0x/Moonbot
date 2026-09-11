import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenAddress = searchParams.get('tokenAddress')?.toLowerCase();
    const user = searchParams.get('user')?.toLowerCase();

    const client = await clientPromise;
    const db = client.db();
    const tradesCollection = db.collection('trades');

    const query: any = {};
    if (tokenAddress) query.tokenAddress = tokenAddress;
    if (user) query.userAddress = user;

    const trades = await tradesCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(150)
      .toArray();

    return NextResponse.json({
      success: true,
      trades: trades.map((t) => ({
        id: t._id.toString(),
        tokenAddress: t.tokenAddress,
        type: t.type,
        user: t.user,
        userAddress: t.userAddress || '',
        botAmount: t.botAmount,
        tokenAmount: t.tokenAmount,
        txHash: t.txHash,
        timestamp: t.timestamp ? new Date(t.timestamp).getTime() : Date.now(),
      })),
    });
  } catch (error: any) {
    console.error('Trades GET error:', error);
    return NextResponse.json({ success: false, trades: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenAddress, type, user, userAddress, botAmount, tokenAmount, txHash, timestamp } = body;

    if (!tokenAddress || !type || !txHash) {
      return NextResponse.json(
        { error: 'tokenAddress, type, and txHash are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const tradesCollection = db.collection('trades');

    const tradeDoc = {
      tokenAddress: tokenAddress.toLowerCase(),
      type: type.toUpperCase(),
      user: user || (userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : '0xUser...'),
      userAddress: userAddress ? userAddress.toLowerCase() : '',
      botAmount: Number(botAmount) || 0,
      tokenAmount: Number(tokenAmount) || 0,
      txHash: txHash.toLowerCase(),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      createdAt: new Date(),
    };

    // Upsert by txHash to prevent duplicate entries
    await tradesCollection.updateOne(
      { txHash: tradeDoc.txHash },
      { $set: tradeDoc },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      trade: {
        ...tradeDoc,
        timestamp: tradeDoc.timestamp.getTime(),
      },
    });
  } catch (error: any) {
    console.error('Trades POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save trade to MongoDB' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHashes } = body;

    if (!Array.isArray(txHashes) || txHashes.length === 0) {
      return NextResponse.json({ error: 'txHashes array required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const tradesCollection = db.collection('trades');

    const result = await tradesCollection.deleteMany({
      txHash: { $in: txHashes.map((h: string) => h.toLowerCase()) },
    });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    console.error('Trades DELETE error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete trades' }, { status: 500 });
  }
}

