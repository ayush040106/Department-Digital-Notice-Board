const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDatabase } = require('./seed/seedData');

let server;

const startServer = async () => {
  try {
    await connectDB();

    if (env.autoSeedOnEmpty) {
      await seedDatabase({ force: false });
    }

    server = app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
