import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { GrievanceReportRequest } from '../types/grievance.types';
import { sarvamService } from '../services/sarvam.service';
import { llmService } from '../services/llm.service';
import { graphService, GraphForwardPayload } from '../services/graph.service';

export const reportGrievance = async (req: Request, res: Response) => {
  try {
    // 1. Extract validated fields (Middleware already handled validation & parsing)
    const body = req.body as GrievanceReportRequest['body'];
    const files = req.files as unknown as GrievanceReportRequest['files'];

    const { citizenId, latitude, longitude, imageUrl } = body;
    const audioFile = files.audio[0];
    const imageFile = files.image?.[0]; // Optional, could be undefined if imageUrl is present

    // 2. Call Sarvam AI to transcribe Audio
    let transcription = '';
    try {
      transcription = await sarvamService.transcribeAudio(audioFile.path);
    } catch (error) {
      logger.error('Failed to transcribe audio via Sarvam', { error: (error as Error).message });
      return res.status(502).json({
        success: false,
        error: 'Failed to transcribe audio from upstream service (502 Bad Gateway)',
      });
    }

    // 3. Call LLM Service to parse semantics
    let parsedData: { category: string; description: string };
    try {
      parsedData = await llmService.parseGrievance(transcription);
    } catch (error) {
      logger.error('Failed to parse transcription via LLM', { error: (error as Error).message });
      return res.status(500).json({
        success: false,
        error: 'Failed to process the text semantics (500 Internal Server Error)',
      });
    }

    // 4. Resolve the final Image URL
    // (If a physical file was uploaded, we'd normally upload to S3 here. 
    // For now, we mock the local relative path or use the provided imageUrl)
    const finalImageUrl = imageUrl || (imageFile ? `/uploads/${imageFile.filename}` : undefined);

    // 5. Build Graph Payload
    const graphPayload: GraphForwardPayload = {
      citizenId,
      grievanceId: `grv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: parsedData.category,
      description: parsedData.description,
      timestamp: new Date().toISOString(),
      lat: latitude,
      lng: longitude,
      imageUrl: finalImageUrl
    };

    // 6. Forward to Graph Service
    const forwarded = await graphService.forward(graphPayload);
    
    if (!forwarded) {
      // Graph failure -> 503 Service Unavailable
      return res.status(503).json({
        success: false,
        error: 'Failed to forward payload to graph-service (503 Service Unavailable)'
      });
    }

    // 7. Return success JSON response
    return res.status(200).json({
      success: true,
      transcription,
      category: parsedData.category,
      forwarded: true
    });

  } catch (error) {
    // Catch-all to never crash the Node process
    logger.error('Unhandled exception in reportGrievance controller', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Unexpected Internal Server Error'
    });
  }
};

export const getGrievanceHistory = async (req: Request, res: Response) => {
  const { citizenId } = req.params;
  if (!citizenId) {
    return res.status(400).json({ success: false, error: 'citizenId is required' });
  }

  try {
    const axios = (await import('axios')).default;
    const graphUrl = `${(process.env.GRAPH_SERVICE_URL || 'http://localhost:4000').replace(/\/$/, '')}/api/graph/citizen/${citizenId}/grievances`;
    const response = await axios.get(graphUrl, { timeout: 10000 });
    return res.status(200).json({ success: true, grievances: response.data.grievances });
  } catch (error: any) {
    const status = error.response?.status || 500;
    logger.error('Failed to fetch grievance history', { citizenId, error: error.message });
    return res.status(status).json({ success: false, error: 'Failed to fetch history from graph-service' });
  }
};
