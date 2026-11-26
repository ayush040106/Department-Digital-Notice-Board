const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;
let connectionMode = 'mongodb';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return { mode: connectionMode, uri: mongoose.connection.host };
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    connectionMode = 'mongodb';
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return { mode: connectionMode, host: conn.connection.host };
  } catch (primaryErr) {
    if (!env.enableMemoryDbFallback) {
      console.error('MongoDB connection failed:', primaryErr.message);
      throw primaryErr;
    }

    console.warn(
      `Primary MongoDB not reachable (${primaryErr.message}). Starting embedded MongoDB instance...`
    );

    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dataDir = path.resolve(__dirname, '../.data/mongodb');
    fs.mkdirSync(dataDir, { recursive: true });

    try {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'college_notice_board',
          dbPath: dataDir,
          storageEngine: 'wiredTiger',
        },
      });
    } catch (persistentErr) {
      console.warn(
        `Persistent embedded storage unavailable (${persistentErr.message}). Falling back to ephemeral in-memory MongoDB.`
      );
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'college_notice_board',
        },
      });
    }

    const memUri = memoryServer.getUri();
    const conn = await mongoose.connect(memUri);
    connectionMode = 'embedded-mongodb';
    console.log(`Embedded MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return { mode: connectionMode, host: conn.connection.host };
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

const getConnectionMode = () => connectionMode;

module.exports = { connectDB, disconnectDB, getConnectionMode };
