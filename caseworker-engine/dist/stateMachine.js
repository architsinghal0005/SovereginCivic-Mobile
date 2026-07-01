"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineEngine = exports.NotificationGateway = exports.repository = void 0;
const queue_1 = require("./queue");
// Abstracted out Database - Mock Repository layer
class MockRepository {
    tickets = new Map();
    async save(ticket) {
        this.tickets.set(ticket.id, ticket);
    }
    async get(id) {
        return this.tickets.get(id) || null;
    }
}
exports.repository = new MockRepository();
class NotificationGateway {
    static async sendCitizenAlert(ticketId, nextState, localizedMessage) {
        // Isolated Mock Notification Gateway Utility
        console.log(`[NotificationGateway] Alert for Ticket ${ticketId}: ${localizedMessage} (New State: ${nextState})`);
    }
}
exports.NotificationGateway = NotificationGateway;
class StateMachineEngine {
    // Enforce valid transitions
    static validTransitions = {
        'CLUSTER_DETECTED': ['ASSIGNED_TO_OFFICER'],
        'ASSIGNED_TO_OFFICER': ['IN_PROGRESS', 'ASSIGNED_TO_OFFICER'], // Self transition for reassignment/escalation
        'IN_PROGRESS': ['RESOLVED'],
        'RESOLVED': []
    };
    static async transition(ticketId, newState, options) {
        const ticket = await exports.repository.get(ticketId);
        if (!ticket) {
            throw new Error(`Ticket with ID ${ticketId} not found.`);
        }
        const allowed = this.validTransitions[ticket.state].includes(newState);
        if (!allowed) {
            throw new Error(`Invalid state transition attempted from ${ticket.state} to ${newState}`);
        }
        const previousState = ticket.state;
        // Update State
        ticket.state = newState;
        ticket.updatedAt = new Date();
        if (options?.customAssignedOfficerId) {
            ticket.assignedOfficerId = options.customAssignedOfficerId;
        }
        if (options?.isEscalated !== undefined) {
            ticket.isEscalated = options.isEscalated;
        }
        await exports.repository.save(ticket);
        // Mock Notification Hook
        const localizedMessage = this.getDescriptiveMessage(newState, ticket.isEscalated);
        await NotificationGateway.sendCitizenAlert(ticket.id, newState, localizedMessage);
        // Asynchronous SLA Engine (BullMQ) Timer Management
        if (newState === 'ASSIGNED_TO_OFFICER') {
            // Schedule a delayed BullMQ job representing an SLA countdown timer (2 hours default)
            const jobId = `sla-timer-${ticket.id}`;
            // In a real app we might read the SLA duration from env/config, hardcoded here as requested
            const delayMs = 2 * 60 * 60 * 1000;
            await queue_1.slaQueue.add('check-sla', { ticketId: ticket.id }, {
                jobId,
                delay: delayMs,
                removeOnComplete: true,
                removeOnFail: false
            });
            console.log(`[StateMachineEngine] Scheduled SLA timer for ${ticket.id}`);
        }
        if (previousState === 'ASSIGNED_TO_OFFICER' && newState === 'IN_PROGRESS') {
            // Safely remove/cancel the pending BullMQ job
            const jobId = `sla-timer-${ticket.id}`;
            const job = await queue_1.slaQueue.getJob(jobId);
            if (job) {
                await job.remove();
                console.log(`[StateMachineEngine] Cancelled pending SLA timer for ${ticket.id}`);
            }
        }
        return ticket;
    }
    static async initializeTicket(clusterId, description, initialOfficerId, supervisorId) {
        const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newTicket = {
            id: ticketId,
            clusterId,
            description,
            initialOfficerId,
            supervisorId,
            assignedOfficerId: initialOfficerId,
            state: 'CLUSTER_DETECTED',
            isEscalated: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await exports.repository.save(newTicket);
        return newTicket;
    }
    static getDescriptiveMessage(state, isEscalated) {
        switch (state) {
            case 'CLUSTER_DETECTED':
                return 'A new issue cluster has been detected in your area.';
            case 'ASSIGNED_TO_OFFICER':
                return isEscalated
                    ? 'Your ticket has been escalated to a supervisor due to processing delays.'
                    : 'An officer has been assigned to investigate your ticket.';
            case 'IN_PROGRESS':
                return 'Work on your ticket is now in progress.';
            case 'RESOLVED':
                return 'Your ticket has been successfully resolved.';
            default:
                return 'Your ticket status has been updated.';
        }
    }
}
exports.StateMachineEngine = StateMachineEngine;
