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

const TIMEOUT_MS = 15000;

export const submitGrievanceReport = async (
  payload: GrievanceReportPayload
): Promise<GrievanceReportResponse> => {
  const url = `${CONFIG.BACKEND_URL}/api/grievance/report`;
  
  const formData = new FormData();
  
  // Attach dummy citizenId
  formData.append('citizenId', payload.citizenId || 'dummy-citizen-123');
  
  // Attach coordinates
  formData.append('latitude', payload.latitude.toString());
  formData.append('longitude', payload.longitude.toString());
  
  // Attach audio file
  const audioFilename = payload.audioUri.split('/').pop() || 'recording.m4a';
  formData.append('audio', {
    uri: payload.audioUri,
    name: audioFilename,
    type: 'audio/m4a',
  } as any);
  
  // Attach image file if present
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
        'Content-Type': 'multipart/form-data',
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
