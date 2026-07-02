import axios from 'axios';
import { logger } from '../utils/logger';

export interface ParsedGrievance {
  category: string;
  description: string;
}

const ALLOWED_CATEGORIES = [
  'Road Infrastructure',
  'Water Supply',
  'Sewage Management',
  'Garbage',
  'Street Lighting',
  'Electricity',
  'Public Safety',
  'Other'
];

export class LLMService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly MAX_RETRIES = 1;

  constructor() {
    this.apiKey = process.env.LLM_API_KEY || '';
    // Assumes an OpenAI-compatible /chat/completions REST endpoint by default
    this.apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';

    if (!this.apiKey) {
      logger.warn('LLM_API_KEY is not defined in environment variables.');
    }
  }

  /**
   * Parses natural language grievance text, classifies it, and rewrites a formal summary.
   */
  public async parseGrievance(text: string): Promise<ParsedGrievance> {
    const systemPrompt = `You are a semantic parsing assistant.
Your task is to classify a citizen's grievance into exactly one of the allowed categories, and rewrite the grievance into a clean, formal English summary.

Allowed categories:
- Road Infrastructure
- Water Supply
- Sewage Management
- Garbage
- Street Lighting
- Electricity
- Public Safety
- Other

Output STRICT JSON ONLY. Do not use markdown blocks like \`\`\`json.
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

        // Validate JSON and schema
        return this.parseAndValidateJSON(content, text);

      } catch (error) {
        attempt++;
        
        if (attempt >= this.MAX_RETRIES) {
          logger.error('LLM parsing failed after max retries, applying fallback', { error: (error as Error).message });
          // Fallback strategy: return Other and the original text
          return {
            category: 'Other',
            description: text
          };
        }

        logger.warn(`LLM API attempt ${attempt} failed. Retrying in ${delayMs}ms...`, { error: (error as Error).message });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }

    // Safety fallback
    return { category: 'Other', description: text };
  }

  /**
   * Defensively parses JSON from LLM string output and validates category constraints
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

      // 2. Parse the strict JSON
      const parsed = JSON.parse(cleaned);
      
      let category = parsed.category;
      let description = parsed.description;

      // 3. Fallback invalid categories or missing fields cleanly instead of throwing
      if (!category || typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
        category = 'Other';
      }

      if (!description || typeof description !== 'string') {
        description = originalText;
      }

      return { category, description };

    } catch (e) {
      // Throw so the retry block catches it and tries again
      throw new Error(`Invalid JSON syntax from LLM: ${(e as Error).message}`);
    }
  }
}

export const llmService = new LLMService();
