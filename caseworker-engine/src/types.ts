export type TicketState = 'CLUSTER_DETECTED' | 'ASSIGNED_TO_OFFICER' | 'IN_PROGRESS' | 'RESOLVED';

export interface Ticket {
  id: string;
  clusterId: string;
  clusterSize: number;
  description?: string;
  initialOfficerId?: string;
  supervisorId?: string;
  assignedOfficerId?: string;
  state: TicketState;
  isEscalated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
