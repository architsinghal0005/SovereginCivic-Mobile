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
        const { clusterId, clusterSize, timestamp } = req.body;
        if (!clusterId || typeof clusterSize !== 'number' || !timestamp) {
            res.status(400).json({
                error: 'Missing or invalid required payload fields: clusterId, clusterSize, timestamp.'
            });
            return;
        }
        // 1. Initialize the state machine to CLUSTER_DETECTED and store it via repository layer
        const ticket = await stateMachine_1.StateMachineEngine.initializeTicket(clusterId, clusterSize, timestamp);
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
const PORT = process.env.PORT || 3000;
function startServer() {
    return app.listen(PORT, () => {
        console.log(`Web Service Server listening on port ${PORT}`);
    });
}
if (require.main === module) {
    startServer();
}
