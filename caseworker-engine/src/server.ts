import express, { Request, Response } from 'express';
import { StateMachineEngine, repository } from './stateMachine';
import { TicketCategory } from './types';

const app = express();
app.use(express.json());

// Webhook Endpoint
app.post('/api/workflow/trigger-caseworker', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clusterId, clusterSize, timestamp, category, ward, citizenId, grievanceIds } = req.body;

    if (!clusterId || typeof clusterSize !== 'number' || !timestamp || !category || !ward || !citizenId || !grievanceIds) {
      res.status(400).json({ 
        error: 'Missing or invalid required payload fields: clusterId, clusterSize, timestamp, category, ward, citizenId, grievanceIds.' 
      });
      return;
    }

    // 1. Initialize the state machine to ASSIGNED_TO_OFFICER and store it via repository layer
    const ticket = await StateMachineEngine.initializeTicket(
      clusterId,
      clusterSize,
      timestamp,
      category as TicketCategory,
      ward,
      citizenId,
      grievanceIds
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

// Start Ticket
app.patch('/api/ticket/:id/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await StateMachineEngine.transition(id, 'IN_PROGRESS');
    res.json({ message: 'Ticket started', ticket });
  } catch (error) {
    console.error(`Error starting ticket ${req.params.id}:`, error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Resolve Ticket
app.patch('/api/ticket/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await StateMachineEngine.transition(id, 'RESOLVED');
    res.json({ message: 'Ticket resolved', ticket });
  } catch (error) {
    console.error(`Error resolving ticket ${req.params.id}:`, error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get Single Ticket
app.get('/api/ticket/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await repository.get(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (error) {
    console.error(`Error fetching ticket ${req.params.id}:`, error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get All Tickets
app.get('/api/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    let tickets = await repository.getAll();
    
    if (status) {
      tickets = tickets.filter(t => t.state === status);
    }
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
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
