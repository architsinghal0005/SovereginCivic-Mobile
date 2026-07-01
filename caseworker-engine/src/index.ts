import { startServer } from './server';
import { slaWorker } from './queue';

async function bootstrap() {
  console.log('Starting combined Web Service and Worker process...');
  
  // Initialize the Express app
  startServer();

  // The BullMQ worker starts automatically upon instantiation, 
  // but we can log its readiness here
  slaWorker.on('ready', () => {
    console.log('BullMQ Worker is ready and listening for jobs.');
  });
  
  console.log('Combined process started successfully.');
}

bootstrap().catch((err) => {
  console.error('Failed to start combined process:', err);
  process.exit(1);
});
