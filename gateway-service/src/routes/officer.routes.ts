import { Router } from 'express';
import { getTickets, startTicket, resolveTicket } from '../controllers/officer.controller';

const officerRouter = Router();

// GET /api/officer/tickets
officerRouter.get('/tickets', getTickets);

// PATCH /api/officer/:ticketId/start
officerRouter.patch('/:ticketId/start', startTicket);

// PATCH /api/officer/:ticketId/resolve
officerRouter.patch('/:ticketId/resolve', resolveTicket);

export { officerRouter };
