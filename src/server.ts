import app from './app';
import prisma from './utils/prisma';
import config from './config/config';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();
