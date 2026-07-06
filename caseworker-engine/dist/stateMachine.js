"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineEngine = exports.NotificationGateway = exports.repository = void 0;
exports.getOfficerAndSupervisor = getOfficerAndSupervisor;
const queue_1 = require("./queue");
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new ioredis_1.default(redisUrl);
class RedisRepository {
    async save(ticket) {
        await redis.set(`ticket:${ticket.id}`, JSON.stringify(ticket));
    }
    async get(id) {
        const data = await redis.get(`ticket:${id}`);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    async getAll() {
        const keys = await redis.keys('ticket:*');
        if (keys.length === 0)
            return [];
        const values = await redis.mget(keys);
        return values.filter((v) => v !== null).map((v) => JSON.parse(v));
    }
}
exports.repository = new RedisRepository();
function getOfficerAndSupervisor(category, ward) {
    switch (category) {
        case 'Road':
            return { assignedOfficerId: `Road_Officer_${ward}`, supervisorId: `SUPERVISOR_ROAD_${ward}` };
        case 'Water':
            return { assignedOfficerId: `Water_Officer_${ward}`, supervisorId: `SUPERVISOR_WATER_${ward}` };
        case 'Garbage':
            return { assignedOfficerId: `Sanitation_Officer_${ward}`, supervisorId: `SUPERVISOR_SANITATION_${ward}` };
        case 'Electricity':
            return { assignedOfficerId: `Electrical_Officer_${ward}`, supervisorId: `SUPERVISOR_ELEC_${ward}` };
        default:
            return { assignedOfficerId: `General_Officer_${ward}`, supervisorId: `SUPERVISOR_GENERAL_${ward}` };
    }
}
class NotificationGateway {
    static async sendCitizenAlert(ticket, nextState, localizedMessage) {
        console.log(`[NotificationGateway] Alert for Ticket ${ticket.id}: ${localizedMessage} (New State: ${nextState})`);
        try {
            const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
            await fetch(`${gatewayUrl}/api/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: ticket.id,
                    citizenId: ticket.citizenId,
                    grievanceIds: ticket.grievanceIds,
                    state: nextState,
                    message: localizedMessage,
                    timestamp: new Date().toISOString()
                })
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Gateway offline, moving forward without notification:", errorMessage);
        }
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
        await NotificationGateway.sendCitizenAlert(ticket, newState, localizedMessage);
        // Asynchronous SLA Engine (BullMQ) Timer Management
        if (newState === 'ASSIGNED_TO_OFFICER') {
            // Schedule a delayed BullMQ job representing an SLA countdown timer (2 hours default)
            const jobId = `sla-timer-${ticket.id}`;
            // In a real app we might read the SLA duration from env/config, hardcoded here as requested
            const delayMs = 10000;
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
    static async initializeTicket(clusterId, clusterSize, timestamp, category, ward, citizenId, grievanceIds) {
        const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { assignedOfficerId, supervisorId } = getOfficerAndSupervisor(category, ward);
        const newTicket = {
            id: ticketId,
            clusterId,
            clusterSize,
            category,
            ward,
            citizenId,
            grievanceIds,
            initialOfficerId: assignedOfficerId,
            supervisorId: supervisorId,
            assignedOfficerId: assignedOfficerId, // Initial assignment
            state: 'ASSIGNED_TO_OFFICER',
            isEscalated: false,
            createdAt: new Date(timestamp),
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
