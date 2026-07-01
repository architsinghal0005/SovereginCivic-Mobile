"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const queue_1 = require("./queue");
async function bootstrap() {
    console.log('Starting combined Web Service and Worker process...');
    // Initialize the Express app
    (0, server_1.startServer)();
    // The BullMQ worker starts automatically upon instantiation, 
    // but we can log its readiness here
    queue_1.slaWorker.on('ready', () => {
        console.log('BullMQ Worker is ready and listening for jobs.');
    });
    console.log('Combined process started successfully.');
}
bootstrap().catch((err) => {
    console.error('Failed to start combined process:', err);
    process.exit(1);
});
