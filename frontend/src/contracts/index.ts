export const MOONBOT_LAUNCHPAD_ADDRESS =
  (process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS as `0x${string}`) ||
  '0xD95368B45cca7C275B101DA4c54e67f0f5248063';

export const LAUNCHPAD_ABI = [
  {
    type: 'function',
    name: 'createToken',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'imageUri', type: 'string' },
      { name: 'twitter', type: 'string' },
      { name: 'telegram', type: 'string' },
      { name: 'website', type: 'string' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'buy',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'minTokensOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'sell',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'minBotOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'calculateOutput',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'botIn', type: 'uint256' },
    ],
    outputs: [
      { name: 'tokensOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'calculateRefund',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
    ],
    outputs: [
      { name: 'botOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getCurrentPrice',
    stateMutability: 'view',
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getProgress',
    stateMutability: 'view',
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getToken',
    stateMutability: 'view',
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    outputs: [
      {
        components: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'imageUri', type: 'string' },
          { name: 'twitter', type: 'string' },
          { name: 'telegram', type: 'string' },
          { name: 'website', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'virtualBotReserve', type: 'uint256' },
          { name: 'virtualTokenReserve', type: 'uint256' },
          { name: 'realBotReserve', type: 'uint256' },
          { name: 'tokensSold', type: 'uint256' },
          { name: 'graduated', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
  },
  {
    type: 'function',
    name: 'getAllTokens',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'event',
    name: 'TokenCreated',
    inputs: [
      { indexed: true, name: 'tokenAddress', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'symbol', type: 'string' },
      { indexed: false, name: 'description', type: 'string' },
      { indexed: false, name: 'imageUri', type: 'string' },
      { indexed: false, name: 'twitter', type: 'string' },
      { indexed: false, name: 'telegram', type: 'string' },
      { indexed: false, name: 'website', type: 'string' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'createdAt', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'TokenPurchased',
    inputs: [
      { indexed: true, name: 'tokenAddress', type: 'address' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: false, name: 'botIn', type: 'uint256' },
      { indexed: false, name: 'tokensOut', type: 'uint256' },
      { indexed: false, name: 'newVirtualBotReserve', type: 'uint256' },
      { indexed: false, name: 'newVirtualTokenReserve', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'TokenSold',
    inputs: [
      { indexed: true, name: 'tokenAddress', type: 'address' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: false, name: 'tokensIn', type: 'uint256' },
      { indexed: false, name: 'botOut', type: 'uint256' },
      { indexed: false, name: 'newVirtualBotReserve', type: 'uint256' },
      { indexed: false, name: 'newVirtualTokenReserve', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'TokenGraduated',
    inputs: [
      { indexed: true, name: 'tokenAddress', type: 'address' },
      { indexed: false, name: 'botLiquidity', type: 'uint256' },
      { indexed: false, name: 'tokenLiquidity', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
