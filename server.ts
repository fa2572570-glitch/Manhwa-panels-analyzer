import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  COMPOSITION_SYSTEM_INSTRUCTION,
  COMPOSITION_ANALYSIS_PROMPT,
} from './src/features/analysis/prompts/composition.prompt';
import {
  SUBJECT_DETECTION_SYSTEM_INSTRUCTION,
  SUBJECT_DETECTION_ANALYSIS_PROMPT,
} from './src/features/analysis/prompts/subject-detection.prompt';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser for base64 analysis proxy images
  app.use(express.json({ limit: '30mb' }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/analysis/composition', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', panelId, context } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          code: 'MISSING_IMAGE_DATA',
          message: 'Image data (base64) is required for visual composition analysis',
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(401).json({
          code: 'PROVIDER_AUTH_MISSING',
          message: 'GEMINI_API_KEY is not configured in the workspace environment.',
        });
      }

      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          COMPOSITION_ANALYSIS_PROMPT +
            (context?.readingDirection ? `\nReading direction context: ${context.readingDirection}` : ''),
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
        config: {
          systemInstruction: COMPOSITION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (err: any) {
        return res.status(502).json({
          code: 'MALFORMED_AI_RESPONSE',
          message: 'AI response could not be parsed as JSON',
          rawText: responseText.slice(0, 1000),
        });
      }

      return res.json({
        success: true,
        panelId,
        composition: parsedJson,
        model: 'gemini-3.7-flash',
        model_version: '2026-03',
      });
    } catch (err: any) {
      console.error('Composition analysis error:', err);
      const isAuthError = err.message?.includes('API key') || err.status === 401 || err.status === 403;
      return res.status(isAuthError ? 401 : 500).json({
        code: isAuthError ? 'PROVIDER_AUTH_MISSING' : 'API_ERROR',
        message: err.message || 'Internal server error during composition analysis',
      });
    }
  });

  app.post('/api/analysis/subjects', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', panelId, context } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          code: 'MISSING_IMAGE_DATA',
          message: 'Image data (base64) is required for subject & character detection',
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(401).json({
          code: 'PROVIDER_AUTH_MISSING',
          message: 'GEMINI_API_KEY is not configured in the workspace environment.',
        });
      }

      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          SUBJECT_DETECTION_ANALYSIS_PROMPT +
            (context?.readingDirection ? `\nReading direction context: ${context.readingDirection}` : ''),
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
        config: {
          systemInstruction: SUBJECT_DETECTION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '';
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (err: any) {
        return res.status(502).json({
          code: 'MALFORMED_AI_RESPONSE',
          message: 'AI response could not be parsed as JSON',
          rawText: responseText.slice(0, 1000),
        });
      }

      return res.json({
        success: true,
        panelId,
        detections: parsedJson,
        model: 'gemini-3.7-flash',
        model_version: '2026-03',
      });
    } catch (err: any) {
      console.error('Subject detection analysis error:', err);
      const isAuthError = err.message?.includes('API key') || err.status === 401 || err.status === 403;
      return res.status(isAuthError ? 401 : 500).json({
        code: isAuthError ? 'PROVIDER_AUTH_MISSING' : 'API_ERROR',
        message: err.message || 'Internal server error during subject detection analysis',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Manhwa Panel Analyzer Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
