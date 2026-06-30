import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/logger';

export class SarvamServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'SarvamServiceError';
  }
}

export class SarvamService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY || '';
    // Assuming a default Speech-to-Text translation endpoint if not provided in env
    this.apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/speech-to-text-translate';

    if (!this.apiKey) {
      logger.warn('SARVAM_API_KEY is not defined in environment variables.');
    }
  }

  /**
   * Transcribes an audio file into English text using Sarvam AI.
   * Handles Indic + Hinglish speech natively.
   */
  public async transcribeAudio(audioPath: string): Promise<string> {
    if (!fs.existsSync(audioPath)) {
      throw new SarvamServiceError(`Audio file not found at path: ${audioPath}`);
    }

    let attempt = 0;
    let delayMs = 1000;

    while (attempt <= this.MAX_RETRIES) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioPath));
        // Optional payload if Sarvam needs explicitly asking for English translation
        // formData.append('model', 'saaras:v1'); 

        const response = await axios.post(this.apiUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'api-subscription-key': this.apiKey, // standard for Sarvam AI
            'Authorization': `Bearer ${this.apiKey}` // generic fallback
          },
          timeout: 30000, // 30 seconds timeout limit
        });

        return this.parseTranscriptionResponse(response.data);

      } catch (error) {
        attempt++;
        if (attempt > this.MAX_RETRIES) {
          logger.error('Sarvam API failed after max retries', { error });
          throw new SarvamServiceError(
            `Failed to transcribe audio after ${this.MAX_RETRIES} attempts.`,
            error
          );
        }

        // Exponential backoff
        logger.warn(`Sarvam API attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // backoff: 1s, 2s, 4s
      }
    }
    
    throw new SarvamServiceError('Unknown error during transcription.');
  }

  /**
   * Robust response parser since API shapes may vary.
   * Handles response.text, response.transcript, response.data.text
   */
  private parseTranscriptionResponse(data: any): string {
    if (!data) {
      throw new SarvamServiceError('Empty response received from Sarvam API');
    }

    // Try multiple possible fields from different payload shapes
    const text = 
      data.text || 
      data.transcript || 
      data?.data?.text || 
      data?.data?.transcript || 
      data.translation;
    
    if (typeof text === 'string' && text.trim().length > 0) {
      return text.trim();
    }

    // Fallback: convert entirely to JSON string if shape is weird but truthy
    logger.warn('Unexpected Sarvam API response shape, falling back to JSON.stringify', { data });
    return JSON.stringify(data);
  }
}

export const sarvamService = new SarvamService();
