import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
});

const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
];

app.get('/api/models', (_req, res) => {
  res.json({ models: AVAILABLE_MODELS });
});

app.post('/api/run', async (req, res) => {
  const {
    systemPrompt = '',
    userPrompt = '',
    model = 'claude-sonnet-4-6',
    temperature = 0.7,
    maxTokens = 1024,
  } = req.body;

  if (!userPrompt.trim()) {
    return res.status(400).json({ error: 'userPrompt is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  try {
    const params = {
      model,
      max_tokens: Number(maxTokens),
      temperature: Number(temperature),
      messages: [{ role: 'user', content: userPrompt }],
    };

    if (systemPrompt.trim()) {
      params.system = systemPrompt;
    }

    const stream = anthropic.messages.stream(params);

    stream.on('text', (text) => {
      send({ type: 'text', text });
    });

    stream.on('error', (err) => {
      send({ type: 'error', error: err.message });
      res.end();
    });

    const finalMessage = await stream.finalMessage();

    send({
      type: 'usage',
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
      },
    });

    send({ type: 'done' });
    res.end();
  } catch (err) {
    send({ type: 'error', error: err.message });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Canva Prompt Studio server running on http://localhost:${PORT}`);
});
