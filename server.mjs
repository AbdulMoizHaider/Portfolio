import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import OpenAI, { toFile } from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 8000);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }
});

app.disable('x-powered-by');
app.use(express.static(__dirname, { extensions: ['html'] }));

app.post('/api/transcribe', upload.single('audio'), async (request, response) => {
  if (!process.env.OPENAI_API_KEY) {
    response.status(503).json({ error: 'Transcription server is not configured.' });
    return;
  }

  if (!request.file?.buffer?.length) {
    response.status(400).json({ error: 'No audio file was received.' });
    return;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audioFile = await toFile(
      request.file.buffer,
      request.file.originalname || 'ai-scribe-recording.webm',
      { type: request.file.mimetype || 'audio/webm' }
    );

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe',
      language: request.body?.language || 'en',
      prompt: [
        'Transcribe only clearly audible speech. Do not add words for silence or background noise.',
        'This is a healthcare consultation demo.',
        'Correct proper nouns may include Abdul Moiz Haider, Moiz, AI Scribe, Sequel Technologies, CareCloud, and Askari Bank.'
      ].join(' '),
      response_format: 'json'
    });

    const text = String(transcription.text || '').trim();
    response.json({
      text,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe'
    });
  } catch (error) {
    console.error('Transcription failed:', error?.message || error);
    response.status(502).json({ error: 'The transcription service could not process this recording.' });
  }
});

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError) {
    response.status(400).json({ error: error.message });
    return;
  }
  next(error);
});

app.listen(port, () => {
  console.log(`Portfolio running at http://localhost:${port}`);
});
