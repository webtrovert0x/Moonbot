import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const GRADUATED_FEATURED_TOKEN = {
  address: '0x9050ffa3269a268bee3604ccb7b2020a9ce7cabb',
  launchpadAddress: (process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS || '0xd95368b45cca7c275b101da4c54e67f0f5248063').toLowerCase(),
  name: 'MoonBot Genesis',
  symbol: 'MBOT',
  description: 'The flagship community coin native to BOT Chain Mainnet. Successfully graduated from the bonding curve to DEX with 100% locked liquidity.',
  imageUri: '/logo.png',
  twitter: 'https://x.com/BotChainAI',
  telegram: 'https://t.me/botchain',
  website: 'https://www.botchain.ai/en/',
  creator: '0x55da37abbf8c9141ada4dd1c2ef7211c0483ec16',
  marketCapBot: 117912,
  priceBot: 0.0001179,
  progressPercent: 100,
  tokensSold: 800000000,
  tokensForSale: 800000000,
  realBotReserve: 87.91,
  graduated: true,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address')?.toLowerCase();
    const launchpadAddress = (
      searchParams.get('launchpadAddress') ||
      process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS ||
      ''
    ).toLowerCase();

    if (address === GRADUATED_FEATURED_TOKEN.address.toLowerCase()) {
      return NextResponse.json({ success: true, token: GRADUATED_FEATURED_TOKEN });
    }

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

    const query: any = {};
    if (launchpadAddress) {
      query.launchpadAddress = launchpadAddress;
    }

    const tokens = await tokensCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    // Ensure featured graduated token is included in list
    const tokenList: any[] = tokens.map((t: any) => ({
      ...t,
      _id: t._id.toString(),
    }));

    const hasGraduated = tokenList.some((t: any) => t.address && t.address.toLowerCase() === GRADUATED_FEATURED_TOKEN.address.toLowerCase());
    if (!hasGraduated) {
      tokenList.unshift(GRADUATED_FEATURED_TOKEN);
    }

    return NextResponse.json({
      success: true,
      tokens: tokenList,
    });
  } catch (error: any) {
    console.error('Tokens GET error:', error);
    return NextResponse.json({ success: true, tokens: [GRADUATED_FEATURED_TOKEN] });
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

    const launchpadAddress = (
      body.launchpadAddress ||
      process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS ||
      ''
    ).toLowerCase();

    const tokenDoc = {
      address: address.toLowerCase(),
      launchpadAddress,
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
