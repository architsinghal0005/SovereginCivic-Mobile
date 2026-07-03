import { CONFIG } from '../constants/config';

export interface GrievanceReportPayload {
  audioUri: string;
  imageUri: string | null;
  latitude: number;
  longitude: number;
  citizenId?: string;
}

export interface GrievanceReportResponse {
  success: boolean;
  message: string;
  reportId?: string;
}

export interface Grievance {
  id: string;
  category: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | string;
  createdAt: string | null;
  imageUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const TIMEOUT_MS = 60000;

export const submitGrievanceReport = async (
  payload: GrievanceReportPayload
): Promise<GrievanceReportResponse> => {
 const url = `${CONFIG.BACKEND_URL}/api/grievance/report`;
// Open mobile/api.ts and change this line:

// To this (to match your gateway route):
// const url = "https://rope-bleep-obstinate.ngrok-free.dev/api/grievance/report";
  const formData = new FormData();
  
  formData.append('citizenId', payload.citizenId || 'dummy-citizen-123');
formData.append('grievanceId', 'unique-id-123'); 
formData.append('category', 'General');         
formData.append('description', 'Voice report'); 
const latitudeValue = typeof payload.latitude === 'number' && !isNaN(payload.latitude) ? payload.latitude : 0;
  const longitudeValue = typeof payload.longitude === 'number' && !isNaN(payload.longitude) ? payload.longitude : 0;
  formData.append('lat', latitudeValue.toString());
  formData.append('lng', longitudeValue.toString());
  formData.append('latitude', latitudeValue.toString());
  formData.append('longitude', longitudeValue.toString());
formData.append('imageUrl', payload.imageUri || '');
  
  const audioFilename = payload.audioUri.split('/').pop() || 'recording.m4a';
  formData.append('audio', {
    uri: payload.audioUri,
    name: audioFilename,
    type: 'audio/m4a',
  } as any);
  
  if (payload.imageUri) {
    const imageFilename = payload.imageUri.split('/').pop() || 'photo.jpg';
    formData.append('image', {
      uri: payload.imageUri,
      name: imageFilename,
      type: 'image/jpeg',
    } as any);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
    }

    const data: GrievanceReportResponse = await response.json();
    return data;
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection and try again.');
    }
    
    if (error.message === 'Network request failed') {
      throw new Error('Network failure. Please ensure you have internet access.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred during submission.');
  }
};

export const fetchMyReports = async (citizenId: string): Promise<Grievance[]> => {
  const url = `${CONFIG.BACKEND_URL}/api/grievance/history/${citizenId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return data.grievances as Grievance[];
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    throw new Error(error.message || 'Failed to fetch reports.');
  }
};
