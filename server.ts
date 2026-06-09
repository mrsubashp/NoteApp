/**
 * Gemini API proxy server.
 *
 * Keeps GEMINI_API_KEY server-side so it is never embedded in the browser bundle.
 * In development, Vite proxies /api/* to this process (port 3001).
 * In production, this process serves the built frontend from dist/ as well.
 */
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

// ---- AI client (lazy — validates key at request time, not startup) ----
function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server'), { status: 503 });
  return new GoogleGenAI({ apiKey: key });
}

// ---- Input guard ----
function requireText(value: unknown, maxLen = 20_000): string {
  if (typeof value !== 'string' || !value.trim())
    throw Object.assign(new Error('Field is required'), { status: 400 });
  if (value.length > maxLen)
    throw Object.assign(new Error(`Input exceeds ${maxLen} characters`), { status: 400 });
  return value;
}

// ---- Per-IP rate limiter: 20 Gemini requests per minute ----
const _rateLimits = new Map<string, { count: number; resetAt: number }>();

function geminiRateLimiter(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  let entry = _rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    _rateLimits.set(ip, entry);
  }
  if (entry.count >= 20) {
    res.status(429).json({ error: 'Too many requests — try again in a minute.' });
    return;
  }
  entry.count++;
  next();
}

// ---- App ----
const app = express();
app.use(express.json({ limit: '50kb' }));

// Security headers for every response
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",        // Vite injects inline module scripts
      "style-src 'self' 'unsafe-inline'",          // Tailwind + ReactQuill use inline styles
      "img-src 'self' data: https:",               // OAuth provider profile photos
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com",
      "frame-src https://accounts.google.com https://appleid.apple.com https://login.microsoftonline.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  );
  next();
});

app.use('/api/gemini', geminiRateLimiter);

// --- Gemini endpoints ---

app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const content = requireText(req.body.content);
    const ai = getAI();
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: `Summarize the following note content concisely. Maintain the tone but make it a short overview:\n\n${content}`,
    });
    res.json({ text: r.text });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/gemini/improve', async (req, res) => {
  try {
    const content = requireText(req.body.content);
    const ai = getAI();
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: `Improve the clarity, grammar, and flow of the following note content. Keep it professional yet natural. Return ONLY the improved content:\n\n${content}`,
    });
    res.json({ text: r.text });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/gemini/suggest-tags', async (req, res) => {
  try {
    const title = requireText(req.body.title, 500);
    const content = requireText(req.body.content);
    const ai = getAI();
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: `Based on the following note title and content, suggest 3-5 relevant tags as a comma-separated list. Return ONLY the tags:\n\nTitle: ${title}\nContent: ${content}`,
    });
    const tags = r.text?.split(',').map((t: string) => t.trim()).filter(Boolean) ?? [];
    res.json({ tags });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/gemini/suggest-title', async (req, res) => {
  try {
    const content = requireText(req.body.content);
    const ai = getAI();
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: `Suggest a concise, catchy title for the following note content. Return ONLY the title:\n\n${content}`,
    });
    res.json({ text: r.text?.trim() ?? '' });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/gemini/generate', async (req, res) => {
  try {
    const topic = requireText(req.body.topic, 1_000);
    const ai = getAI();
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate a detailed, well-structured note about the following topic or prompt: "${topic}".
    Use markdown formatting for structure (headings, bullet points).
    Include a clear title at the very beginning starting with '# ' followed by the title.
    The response should be the full note content including the title line.`,
    });
    const text = r.text ?? '';
    let title = 'Generated Note';
    let content = text;
    if (text.startsWith('# ')) {
      const lines = text.split('\n');
      title = lines[0].replace('# ', '').trim();
      content = lines.slice(1).join('\n').trim();
    }
    res.json({ title, content });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// --- Serve built frontend in production ---
const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API server → http://127.0.0.1:${PORT}`);
});
