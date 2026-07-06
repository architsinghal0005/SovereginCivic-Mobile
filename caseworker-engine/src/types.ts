export type TicketState = 'CLUSTER_DETECTED' | 'ASSIGNED_TO_OFFICER' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketCategory = 'Road' | 'Water' | 'Garbage' | 'Electricity';

export interface Ticket {
  id: string;
  clusterId: string;
  clusterSize: number;
  category: TicketCategory;
  ward: string;
  citizenId: string;
  grievanceIds: string[];
  description?: string;
  initialOfficerId?: string;
  supervisorId?: string;
  assignedOfficerId?: string;
  state: TicketState;
  isEscalated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
