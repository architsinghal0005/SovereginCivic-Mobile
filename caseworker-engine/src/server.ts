import express, { Request, Response } from 'express';
import { StateMachineEngine } from './stateMachine';

const app = express();
app.use(express.json());

// Webhook Endpoint
app.post('/api/workflow/trigger-caseworker', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clusterId, description, initialOfficerId, supervisorId } = req.body;

    if (!clusterId || !description || !initialOfficerId || !supervisorId) {
      res.status(400).json({ 
        error: 'Missing required payload fields: clusterId, description, initialOfficerId, supervisorId.' 
      });
      return;
    }

    // 1. Initialize the state machine to CLUSTER_DETECTED and store it via repository layer
    const ticket = await StateMachineEngine.initializeTicket(
      clusterId,
      description,
      initialOfficerId,
      supervisorId
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
app.listen(PORT, () => {
  console.log(`Web Service Server listening on port ${PORT}`);
});
