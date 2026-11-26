const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_notice_board',
  jwtSecret: process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  enableMemoryDbFallback: process.env.ENABLE_MEMORY_DB_FALLBACK !== 'false',
  autoSeedOnEmpty: process.env.AUTO_SEED_ON_EMPTY !== 'false',
};

module.exports = env;
