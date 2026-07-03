import axios from 'axios';
import { logger } from '../utils/logger';

export interface GraphForwardPayload {
  citizenId: string;
  grievanceId: string;
  category: string;
  description: string;
  timestamp: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

export class GraphService {
  private readonly baseUrl: string;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.baseUrl = process.env.GRAPH_SERVICE_URL || 'http://localhost:4000';
    if (!process.env.GRAPH_SERVICE_URL) {
      logger.warn('GRAPH_SERVICE_URL is not defined in environment variables, falling back to http://localhost:4000');
    }
  }

  /**
   * Forwards the processed grievance payload to the dedicated graph-service.
   * Implements robust exponential backoff, timeouts, and graceful failure.
   * 
   * @returns boolean indicating success or failure to avoid crashing the ingestion pipeline.
   */
  public async forward(payload: GraphForwardPayload): Promise<boolean> {
    // Ensure we construct the URL cleanly, removing any trailing slashes from env config
    const targetUrl = `${this.baseUrl.replace(/\/$/, '')}/api/graph/ingest`;
    let attempt = 0;
    let delayMs = 1000;

    logger.info('Initiating forward to graph-service', { 
      citizenId: payload.citizenId, 
      targetUrl 
    });

    while (attempt <= this.MAX_RETRIES) {
      try {
        await axios.post(targetUrl, payload, {
          timeout: 10000, // 10-second timeout for fast internal microservice communication
          headers: {
            'Content-Type': 'application/json'
          }
        });

        logger.info('Successfully forwarded payload to graph-service', { 
          citizenId: payload.citizenId 
        });
        
        return true;

      } catch (error: any) {
        attempt++;
        const errorMessage = error.response?.data || error.message;

        if (attempt > this.MAX_RETRIES) {
          logger.error('Failed to forward payload to graph-service after max retries. Failing gracefully.', {
            citizenId: payload.citizenId,
            error: errorMessage,
            targetUrl
          });
          // Graceful failure - do not throw an unhandled exception
          return false;
        }

        logger.warn(`Graph forward attempt ${attempt} failed. Retrying in ${delayMs}ms...`, {
          citizenId: payload.citizenId,
          error: errorMessage
        });
        
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff (1s, 2s, 4s)
      }
    }

    return false;
  }
}

export const graphService = new GraphService();
