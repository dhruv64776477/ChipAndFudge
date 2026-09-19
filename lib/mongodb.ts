import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chip_and_fudge';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    }).catch((err) => {
      cached!.promise = null;
      console.error('Failed to connect to MongoDB at', MONGODB_URI, err.message);
      throw new Error(
        `MongoDB connection failed. Please ensure MONGODB_URI is correctly configured in your .env.local file. Details: ${err.message}`
      );
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
