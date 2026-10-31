/**
 * routes/vision.js
 * Express router for document OCR processing via Gemini Vision API.
 * Accepts image uploads, sends them to Gemini, and returns structured JSON.
 */

import express from 'express';
import multer from 'multer';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

/**
 * Rate limiter for document OCR: 10 uploads/scans per minute per user/IP.
 * Placed before file upload buffering to mitigate memory/DoS attacks.
 */
const visionProcessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message: 'Too many document scan requests. Please wait a moment and try again.',
  },
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req.ip || '127.0.0.1');
  },
});

// Multer configuration: memory storage, 10 MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted.'), false);
    }
  },
});

/**
 * The extraction prompt sent to Gemini Vision.
 */
const EXTRACTION_PROMPT =
  'You are a document extraction assistant. Analyze this business document image and extract structured information. ' +
  'Return ONLY valid JSON with these fields based on what you detect:\n' +
  '{\n' +
  '  "documentType": "invoice|receipt|business_card|order|contract|other",\n' +
  '  "confidence": 0.0-1.0,\n' +
  '  "extractedData": {\n' +
  '    "vendor": "",\n' +
  '    "customer": "",\n' +
  '    "documentNumber": "",\n' +
  '    "date": "YYYY-MM-DD or null",\n' +
  '    "dueDate": "YYYY-MM-DD or null",\n' +
  '    "amount": null,\n' +
  '    "currency": "INR",\n' +
  '    "taxAmount": null,\n' +
  '    "items": [],\n' +
  '    "notes": "",\n' +
  '    "contactName": "",\n' +
  '    "contactEmail": "",\n' +
  '    "contactPhone": ""\n' +
  '  },\n' +
  '  "warnings": []\n' +
  '}\n' +
  'Only include fields that are actually present in the document. ' +
  'Use null for missing numeric fields and empty string for missing text fields.';

/**
 * POST /api/vision/process
 * Accepts a single image upload and extracts structured business document data.
 * Protected by rate limiting and authentication.
 */
router.post(
  '/process',
  visionProcessLimiter,
  requireAuth,
  upload.single('document'),
  async (req, res) => {
    try {
      // Validate file presence
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'No document file provided. Please upload an image.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // If Gemini is not configured, prompt for manual entry
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          requiresConfig: true,
          message:
            'AI extraction not configured. Please enter document details manually.',
          captureAvailable: true,
        });
      }

      // Convert uploaded image buffer to base64
      const imageBase64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      // Initialize Gemini client and model
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Build the image part for the multimodal request
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      };

      // Call Gemini Vision
      const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
      const response = await result.response;
      let rawText = response.text();

      // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

      // Attempt to parse structured JSON
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (_parseErr) {
        // Fallback: return raw text as notes
        console.warn('[Vision] JSON parse failed, returning raw text as notes.');
        return res.status(200).json({
          success: true,
          documentType: 'other',
          confidence: 0.3,
          extractedData: { notes: rawText },
          warnings: ['Could not parse structured data'],
        });
      }

      // Validate minimum required fields
      if (!parsed.documentType || !parsed.extractedData) {
        console.warn('[Vision] Response missing required fields, falling back.');
        return res.status(200).json({
          success: true,
          documentType: 'other',
          confidence: 0.3,
          extractedData: { notes: rawText },
          warnings: ['Could not parse structured data'],
        });
      }

      return res.status(200).json({
        success: true,
        documentType: parsed.documentType,
        confidence: parsed.confidence ?? 0.5,
        extractedData: parsed.extractedData,
        warnings: parsed.warnings ?? [],
      });
    } catch (err) {
      console.error('[Vision] Processing error:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Vision processing failed',
        message: 'Unable to process the document image. Please verify the file and try again.',
      });
    }
  }
);

export default router;
