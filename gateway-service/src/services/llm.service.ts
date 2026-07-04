import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { logger } from '../utils/logger';

export const ParsedGrievanceSchema = z.object({
  category: z.enum([
    'Road Infrastructure',
    'Water Supply',
    'Sewage Management',
    'Garbage',
    'Street Lighting',
    'Electricity',
    'Public Safety',
    'Other'
  ]),
  description: z.string().min(1)
});

export type ParsedGrievance = z.infer<typeof ParsedGrievanceSchema>;

export class LLMService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.apiKey = process.env.LLM_API_KEY || '';
    this.apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';

    if (!this.apiKey) {
      logger.warn('LLM_API_KEY is not defined in environment variables.');
    }
  }

  /**
   * Parses natural language grievance text, classifies it, and rewrites a formal summary.
   */
  public async parseGrievance(text: string): Promise<ParsedGrievance> {
    const systemPrompt = `You are a semantic parsing assistant for a civic grievance system.
Your task is to classify a citizen's grievance into exactly one of the allowed categories, and rewrite the grievance into a clear, professional, and formal English summary.

Allowed categories:
- Road Infrastructure
- Water Supply
- Sewage Management
- Garbage
- Street Lighting
- Electricity
- Public Safety
- Other

Rules:
1. You MUST output ONLY valid JSON.
2. Do not use markdown blocks like \`\`\`json.
3. If the user's grievance is vague or incomprehensible, default the category to "Other" and provide a sensible description.

Format strictly as:
{
  "category": "String (one of the allowed categories)",
  "description": "String (the formal summary)"
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser grievance: ${text}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    let attempt = 0;
    let delayMs = 1000;

    while (attempt < this.MAX_RETRIES) {
      try {
        const response = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          payload,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );

        // Parse Gemini native response shape
        const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
          throw new Error('Empty or malformed response from LLM');
        }

        return this.parseAndValidateJSON(content, text);

      } catch (error: any) {
        attempt++;
        const axiosError = error as AxiosError;
        
        const isRateLimit = axiosError.response?.status === 429;
        
        if (attempt >= this.MAX_RETRIES) {
          logger.error('LLM parsing failed after max retries, applying fallback', { error: error.message });
          return {
            category: 'Other',
            description: text
          };
        }

        // If 429, wait longer
        const waitTime = isRateLimit ? delayMs * 2 : delayMs;
        logger.warn(`LLM API attempt ${attempt} failed (Status: ${axiosError.response?.status || 'Unknown'}). Retrying in ${waitTime}ms...`, { error: error.message });
        
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        delayMs *= 2; // Exponential backoff
      }
    }

    // Safety fallback
    return { category: 'Other', description: text };
  }

  /**
   * Defensively parses JSON from LLM string output and validates using Zod
   */
  private parseAndValidateJSON(content: string, originalText: string): ParsedGrievance {
    try {
      // 1. Defensively clean markdown code block hallucination if any
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      // 2. Parse the JSON
      const parsed = JSON.parse(cleaned);
      
      // 3. Validate with Zod
      const result = ParsedGrievanceSchema.safeParse(parsed);
      
      if (result.success) {
        return result.data;
      }
      
      logger.warn('LLM JSON output failed Zod validation, falling back to safe parsing', { errors: result.error.errors });

      // 4. Fallback invalid categories or missing fields cleanly instead of throwing
      let category = parsed.category;
      let description = parsed.description;

      const allowed = ['Road Infrastructure', 'Water Supply', 'Sewage Management', 'Garbage', 'Street Lighting', 'Electricity', 'Public Safety', 'Other'];
      if (!category || typeof category !== 'string' || !allowed.includes(category)) {
        category = 'Other';
      }

      if (!description || typeof description !== 'string') {
        description = originalText;
      }

      return { category: category as ParsedGrievance['category'], description };

    } catch (e) {
      // Throw so the retry block catches it and tries again
      throw new Error(`Invalid JSON syntax from LLM: ${(e as Error).message}`);
    }
  }
}

export const llmService = new LLMService();
