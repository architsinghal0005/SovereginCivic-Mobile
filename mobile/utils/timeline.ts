export type TimelineStep = {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
};

export const getTimelineForStatus = (status: string): TimelineStep[] => {
  const sequence = [
    'Submitted',
    'Cluster Detected',
    'Officer Assigned',
    'In Progress',
    'Resolved'
  ];

  let currentIndex = 0;

  const normalizedStatus = status ? status.toUpperCase() : 'PENDING';

  switch (normalizedStatus) {
    case 'PENDING':
    case 'SUBMITTED':
      currentIndex = 0;
      break;
    case 'CLUSTERED':
    case 'CLUSTER_DETECTED':
      currentIndex = 1;
      break;
    case 'ASSIGNED':
    case 'OFFICER_ASSIGNED':
      currentIndex = 2;
      break;
    case 'IN_PROGRESS':
      currentIndex = 3;
      break;
    case 'RESOLVED':
    case 'COMPLETED':
      currentIndex = 4;
      break;
    default:
      // Fallback if an unknown status is provided
      currentIndex = 0;
  }

  return sequence.map((label, index) => ({
    id: label,
    label,
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));
};
