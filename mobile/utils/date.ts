export const parseRawDate = (input: any): Date | null => {
  if (!input) return null;
  
  if (input instanceof Date) return input;
  
  // Handle Neo4j raw date objects (e.g. { year: { low: 2026 }, month: { low: 7 }... })
  if (typeof input === 'object') {
    const year = input.year?.low ?? input.year;
    const month = input.month?.low ?? input.month;
    const day = input.day?.low ?? input.day;
    const hour = input.hour?.low ?? input.hour ?? 0;
    const minute = input.minute?.low ?? input.minute ?? 0;
    const second = input.second?.low ?? input.second ?? 0;
    
    if (year !== undefined && month !== undefined && day !== undefined) {
       // Neo4j months are 1-12, JS Date months are 0-11. Assuming Neo4j returns UTC values.
       return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
    
    // If it's another object, we can't reliably parse it
    return null;
  }
  
  if (typeof input === 'number') {
    // If timestamp is in seconds, it's usually < 10000000000
    if (input < 10000000000) return new Date(input * 1000);
    return new Date(input);
  }
  
  if (typeof input === 'string') {
    // Clean string from Neo4j [UTC] tag if present
    const cleanStr = input.split('[')[0];
    const parsed = new Date(cleanStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return null;
};

export const formatRelativeDate = (dateInput: any): string => {
  const date = parseRawDate(dateInput);
  
  if (!date || isNaN(date.getTime())) {
    return 'Unknown date';
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} min ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return formatDateIST(date);
};

export const formatDateIST = (dateInput: any): string => {
  const date = parseRawDate(dateInput);
  
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Format to IST
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
