"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const stateMachine_1 = require("./stateMachine");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Webhook Endpoint
app.post('/api/workflow/trigger-caseworker', async (req, res) => {
    try {
        const { clusterId, clusterSize, timestamp, category, ward, citizenId } = req.body;
        if (!clusterId || typeof clusterSize !== 'number' || !timestamp || !category || !ward || !citizenId) {
            res.status(400).json({
                error: 'Missing or invalid required payload fields: clusterId, clusterSize, timestamp, category, ward, citizenId.'
            });
            return;
        }
        // 1. Initialize the state machine to CLUSTER_DETECTED and store it via repository layer
        const ticket = await stateMachine_1.StateMachineEngine.initializeTicket(clusterId, clusterSize, timestamp, category, ward, citizenId);
        // 2. Trigger the state transition engine to advance to ASSIGNED_TO_OFFICER
        const updatedTicket = await stateMachine_1.StateMachineEngine.transition(ticket.id, 'ASSIGNED_TO_OFFICER');
        res.status(201).json({
            message: 'Caseworker workflow triggered successfully',
            ticket: updatedTicket
        });
    }
    catch (error) {
        console.error('Error triggering caseworker workflow:', error);
        res.status(500).json({ error: error.message });
    }
});
// Start Ticket
app.patch('/api/ticket/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await stateMachine_1.StateMachineEngine.transition(id, 'IN_PROGRESS');
        res.json({ message: 'Ticket started', ticket });
    }
    catch (error) {
        console.error(`Error starting ticket ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});
// Resolve Ticket
app.patch('/api/ticket/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await stateMachine_1.StateMachineEngine.transition(id, 'RESOLVED');
        res.json({ message: 'Ticket resolved', ticket });
    }
    catch (error) {
        console.error(`Error resolving ticket ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});
// Get Single Ticket
app.get('/api/ticket/:id', async (req, res) => {
    try {
        const ticket = await stateMachine_1.repository.get(req.params.id);
        if (!ticket) {
            res.status(404).json({ error: 'Ticket not found' });
            return;
        }
        res.json(ticket);
    }
    catch (error) {
        console.error(`Error fetching ticket ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});
// Get All Tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const status = req.query.status;
        let tickets = await stateMachine_1.repository.getAll();
        if (status) {
            tickets = tickets.filter(t => t.state === status);
        }
        res.json(tickets);
    }
    catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: error.message });
    }
});
const PORT = process.env.PORT || 3000;
function startServer() {
    return app.listen(PORT, () => {
        console.log(`Web Service Server listening on port ${PORT}`);
    });
}
if (require.main === module) {
    startServer();
}
