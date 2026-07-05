import { Ticket, TicketState, TicketCategory } from './types';
import { slaQueue } from './queue';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl);

class RedisRepository {
  async save(ticket: Ticket): Promise<void> {
    await redis.set(`ticket:${ticket.id}`, JSON.stringify(ticket));
  }

  async get(id: string): Promise<Ticket | null> {
    const data = await redis.get(`ticket:${id}`);
    if (!data) return null;
    return JSON.parse(data) as Ticket;
  }

  async getAll(): Promise<Ticket[]> {
    const keys = await redis.keys('ticket:*');
    if (keys.length === 0) return [];
    const values = await redis.mget(keys);
    return values.filter((v: string | null): v is string => v !== null).map((v: string) => JSON.parse(v) as Ticket);
  }
}

export const repository = new RedisRepository();

export function getOfficerAndSupervisor(category: TicketCategory, ward: string): { assignedOfficerId: string; supervisorId: string } {
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

export class NotificationGateway {
  static async sendCitizenAlert(ticket: Ticket, nextState: TicketState, localizedMessage: string): Promise<void> {
    console.log(`[NotificationGateway] Alert for Ticket ${ticket.id}: ${localizedMessage} (New State: ${nextState})`);
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
      await fetch(`${gatewayUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          citizenId: ticket.citizenId,
          state: nextState,
          message: localizedMessage,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error(`[NotificationGateway] Failed to send webhook for Ticket ${ticket.id}:`, error);
    }
  }
}

export class StateMachineEngine {
  // Enforce valid transitions
  private static validTransitions: Record<TicketState, TicketState[]> = {
    'CLUSTER_DETECTED': ['ASSIGNED_TO_OFFICER'],
    'ASSIGNED_TO_OFFICER': ['IN_PROGRESS', 'ASSIGNED_TO_OFFICER'], // Self transition for reassignment/escalation
    'IN_PROGRESS': ['RESOLVED'],
    'RESOLVED': []
  };

  static async transition(
    ticketId: string, 
    newState: TicketState, 
    options?: { customAssignedOfficerId?: string; isEscalated?: boolean }
  ): Promise<Ticket> {
    const ticket = await repository.get(ticketId);
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

    await repository.save(ticket);

    // Mock Notification Hook
    const localizedMessage = this.getDescriptiveMessage(newState, ticket.isEscalated);
    await NotificationGateway.sendCitizenAlert(ticket, newState, localizedMessage);

    // Asynchronous SLA Engine (BullMQ) Timer Management
    if (newState === 'ASSIGNED_TO_OFFICER') {
      // Schedule a delayed BullMQ job representing an SLA countdown timer (2 hours default)
      const jobId = `sla-timer-${ticket.id}`;
      // In a real app we might read the SLA duration from env/config, hardcoded here as requested
      const delayMs = 10000; 
      
      await slaQueue.add('check-sla', { ticketId: ticket.id }, { 
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
      const job = await slaQueue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`[StateMachineEngine] Cancelled pending SLA timer for ${ticket.id}`);
      }
    }

    return ticket;
  }

  static async initializeTicket(clusterId: string, clusterSize: number, timestamp: string, category: TicketCategory, ward: string, citizenId: string): Promise<Ticket> {
    const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const { assignedOfficerId, supervisorId } = getOfficerAndSupervisor(category, ward);
    const newTicket: Ticket = {
      id: ticketId,
      clusterId,
      clusterSize,
      category,
      ward,
      citizenId,
      initialOfficerId: assignedOfficerId,
      supervisorId: supervisorId,
      assignedOfficerId: assignedOfficerId, // Initial assignment
      state: 'CLUSTER_DETECTED',
      isEscalated: false,
      createdAt: new Date(timestamp),
      updatedAt: new Date()
    };

    await repository.save(newTicket);
    return newTicket;
  }
  
  private static getDescriptiveMessage(state: TicketState, isEscalated: boolean): string {
    switch(state) {
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
