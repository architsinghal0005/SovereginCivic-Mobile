import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { StateMachineEngine, repository } from './stateMachine';

// Read from process.env.REDIS_URL defaulting to localhost
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const parsedUrl = new URL(redisUrl);

// Create the configuration object directly for BullMQ to handle types internally
const connection: ConnectionOptions = {
  host: parsedUrl.hostname,
  port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 6379,
  username: parsedUrl.username || undefined,
  password: parsedUrl.password || undefined,
  maxRetriesPerRequest: null // Required by BullMQ workers
};

// Handle Redis DB index if provided in URL path
if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
  connection.db = parseInt(parsedUrl.pathname.slice(1), 10);
}

// Dynamically handle Render Redis TLS connections
if (redisUrl.startsWith('rediss://')) {
  connection.tls = {
    rejectUnauthorized: false
  };
}

// Queue definition passing the connection config object directly
export const slaQueue = new Queue('sla-timers', { connection });

// Worker processing initialization
// Ensure clean separation so the worker loop can be deployed on Render as an isolated Background Worker service.
export const slaWorker = new Worker('sla-timers', async (job: Job) => {
  const { ticketId } = job.data;
  const ticket = await repository.get(ticketId);

  if (!ticket) {
    console.log(`[Worker] Ticket ${ticketId} not found, skipping SLA check.`);
    return;
  }

  // Check if ticket is still stuck in ASSIGNED_TO_OFFICER
  if (ticket.state === 'ASSIGNED_TO_OFFICER') {
    if (ticket.isEscalated) {
      console.log(`[Worker] Ticket ${ticketId} is already escalated. Skipping to prevent infinite loop.`);
      return;
    }

    console.warn(`[Worker] HIGH-PRIORITY ESCALATION BREACH: SLA Breach detected for Ticket ${ticketId}!`);
    
    // Execute escalation routing rules:
    // - Mark ticket as isEscalated: true
    // - Reassign assignedOfficerId to supervisorId
    // - Move state to ASSIGNED_TO_OFFICER (which updates timestamp and schedules new SLA timer or logs)
    await StateMachineEngine.transition(ticketId, 'ASSIGNED_TO_OFFICER', {
      customAssignedOfficerId: ticket.supervisorId,
      isEscalated: true
    });
    
    console.log(`[Worker] Ticket ${ticketId} successfully escalated to Supervisor ${ticket.supervisorId}.`);
  } else {
    console.log(`[Worker] SLA timer fired for Ticket ${ticketId}, but state is ${ticket.state}. No breach.`);
  }
}, { connection });

slaWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

console.log("[Queue] SLA Background Worker initialized and listening for jobs...");
