import { Ticket, TicketState } from './types';
import { slaQueue } from './queue';

// Abstracted out Database - Mock Repository layer
class MockRepository {
  private tickets = new Map<string, Ticket>();

  async save(ticket: Ticket): Promise<void> {
    this.tickets.set(ticket.id, ticket);
  }

  async get(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) || null;
  }
}

export const repository = new MockRepository();

export class NotificationGateway {
  static async sendCitizenAlert(ticketId: string, nextState: TicketState, localizedMessage: string): Promise<void> {
    // Isolated Mock Notification Gateway Utility
    console.log(`[NotificationGateway] Alert for Ticket ${ticketId}: ${localizedMessage} (New State: ${nextState})`);
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
    await NotificationGateway.sendCitizenAlert(ticket.id, newState, localizedMessage);

    // Asynchronous SLA Engine (BullMQ) Timer Management
    if (newState === 'ASSIGNED_TO_OFFICER') {
      // Schedule a delayed BullMQ job representing an SLA countdown timer (2 hours default)
      const jobId = `sla-timer-${ticket.id}`;
      // In a real app we might read the SLA duration from env/config, hardcoded here as requested
      const delayMs = 2 * 60 * 60 * 1000; 
      
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

  static async initializeTicket(clusterId: string, clusterSize: number, timestamp: string): Promise<Ticket> {
    const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newTicket: Ticket = {
      id: ticketId,
      clusterId,
      clusterSize,
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
