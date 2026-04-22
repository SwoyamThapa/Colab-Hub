import mongoose from 'mongoose';

const DB_NAME = 'colab-hub';

function databaseNameInUri(uri) {
  try {
    const u = new URL(uri);
    const segment = (u.pathname || '')
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean)[0];
    return segment != null && segment !== '' ? decodeURIComponent(segment) : null;
  } catch {
    return null;
  }
}

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const pathDb = databaseNameInUri(uri);
    if (pathDb && pathDb !== DB_NAME) {
      throw new Error(
        `MONGODB_URI must use database "${DB_NAME}": end the string with /${DB_NAME} (before any ?), or use a host-only URI. Found path segment: "${pathDb}"`
      );
    }

    await mongoose.connect(uri, { dbName: DB_NAME });
    console.log(`MongoDB connected successfully (database: ${DB_NAME})`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
