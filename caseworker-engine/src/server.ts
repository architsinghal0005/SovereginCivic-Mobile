import express, { Request, Response } from 'express';
import { StateMachineEngine } from './stateMachine';

const app = express();
app.use(express.json());

// Webhook Endpoint
app.post('/api/workflow/trigger-caseworker', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clusterId, clusterSize, timestamp } = req.body;

    if (!clusterId || typeof clusterSize !== 'number' || !timestamp) {
      res.status(400).json({ 
        error: 'Missing or invalid required payload fields: clusterId, clusterSize, timestamp.' 
      });
      return;
    }

    // 1. Initialize the state machine to CLUSTER_DETECTED and store it via repository layer
    const ticket = await StateMachineEngine.initializeTicket(
      clusterId,
      clusterSize,
      timestamp
    );

    // 2. Trigger the state transition engine to advance to ASSIGNED_TO_OFFICER
    const updatedTicket = await StateMachineEngine.transition(
      ticket.id,
      'ASSIGNED_TO_OFFICER'
    );

    res.status(201).json({
      message: 'Caseworker workflow triggered successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error triggering caseworker workflow:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 3000;

export function startServer() {
  return app.listen(PORT, () => {
    console.log(`Web Service Server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}
