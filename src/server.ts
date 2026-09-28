import app from './app';
import prisma from './utils/prisma';
import config from './config/config';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('[OK] Database connected');
    app.listen(config.port, () => {
      console.log(`[OK] Server running on http://localhost:${config.port}`);
      console.log(`[OK] Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('[ERROR] Failed to start server:', err);
    process.exit(1);
  }
};

start();
