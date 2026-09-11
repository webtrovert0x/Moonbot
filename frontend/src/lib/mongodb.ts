import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not found in environment variables. Local fallback enabled.');
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise && uri) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise || (uri ? new MongoClient(uri, options).connect() : Promise.reject('No MONGODB_URI'));
} else {
  client = uri ? new MongoClient(uri, options) : (null as any);
  clientPromise = uri ? client.connect() : Promise.reject('No MONGODB_URI');
}

export default clientPromise;
