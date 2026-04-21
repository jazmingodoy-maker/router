import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
});

// ── Chat streaming ────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const {
    messages,
    system,
    model = 'claude-sonnet-4-5-20250514',
    max_tokens = 1500,
  } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  try {
    const stream = anthropic.messages.stream({ model, max_tokens, system, messages });

    stream.on('text', (text) => send({ type: 'text', text }));

    stream.on('error', (err) => {
      send({ type: 'error', error: err.message });
      res.end();
    });

    await stream.finalMessage();
    send({ type: 'done' });
    res.end();
  } catch (err) {
    send({ type: 'error', error: err.message });
    res.end();
  }
});

// ── Canva MCP helpers ─────────────────────────────────────────────────────────

async function getCanvaClient() {
  const token = process.env.CANVA_MCP_TOKEN;
  if (!token) throw new Error('CANVA_MCP_TOKEN not configured. Set it in your .env file.');

  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.canva.com/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const client = new Client({ name: 'design-generation-pipeline', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

function extractContent(mcpResult) {
  if (!mcpResult?.content) return { text: String(mcpResult), images: [], raw: mcpResult };

  let text = '';
  const images = [];

  for (const item of mcpResult.content) {
    if (item.type === 'text') text += item.text;
    if (item.type === 'image') images.push({ mimeType: item.mimeType, data: item.data });
  }

  // Try to parse structured JSON if present inside a code block
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  let structured = null;
  if (jsonMatch) {
    try { structured = JSON.parse(jsonMatch[1]); } catch (_) {}
  }

  return { text, images, structured, raw: mcpResult };
}

// ── Canva: generate designs ───────────────────────────────────────────────────

app.post('/api/canva/generate', async (req, res) => {
  const { query, design_type = 'instagram_post', brand_kit_id } = req.body;

  if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

  let client;
  try {
    client = await getCanvaClient();

    const args = {
      query,
      design_type,
      user_intent: 'Generate design candidates from pipeline prompt for quality evaluation',
    };
    if (brand_kit_id) args.brand_kit_id = brand_kit_id;

    const result = await client.callTool({ name: 'generate-design', arguments: args });
    const parsed = extractContent(result);

    res.json({ success: true, ...parsed });
  } catch (err) {
    res.status(500).json({ error: err.message, canvaConfigured: !!process.env.CANVA_MCP_TOKEN });
  } finally {
    if (client) await client.close().catch(() => {});
  }
});

// ── Canva: create design from candidate ──────────────────────────────────────

app.post('/api/canva/create-from-candidate', async (req, res) => {
  const { job_id, candidate_id } = req.body;

  if (!job_id || !candidate_id) {
    return res.status(400).json({ error: 'job_id and candidate_id are required' });
  }

  let client;
  try {
    client = await getCanvaClient();

    const result = await client.callTool({
      name: 'create-design-from-candidate',
      arguments: { job_id, candidate_id, user_intent: 'Save generated design for pipeline evaluation' },
    });
    const parsed = extractContent(result);

    res.json({ success: true, ...parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.close().catch(() => {});
  }
});

// ── Canva: get design details ─────────────────────────────────────────────────

app.post('/api/canva/get-design', async (req, res) => {
  const { design_id } = req.body;
  if (!design_id) return res.status(400).json({ error: 'design_id is required' });

  let client;
  try {
    client = await getCanvaClient();
    const result = await client.callTool({
      name: 'get-design',
      arguments: { design_id, user_intent: 'Get design details for evaluation display' },
    });
    res.json({ success: true, ...extractContent(result) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.close().catch(() => {});
  }
});

// ── Canva: export design ──────────────────────────────────────────────────────

app.post('/api/canva/export', async (req, res) => {
  const { design_id, format = { type: 'png', width: 800 } } = req.body;
  if (!design_id) return res.status(400).json({ error: 'design_id is required' });

  let client;
  try {
    client = await getCanvaClient();
    const result = await client.callTool({
      name: 'export-design',
      arguments: { design_id, format, user_intent: 'Export design thumbnail for pipeline evaluation' },
    });
    res.json({ success: true, ...extractContent(result) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.close().catch(() => {});
  }
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    canva: !!process.env.CANVA_MCP_TOKEN,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\nDesign Pipeline server → http://localhost:${PORT}`);
  console.log(`  Anthropic API : ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ Missing ANTHROPIC_API_KEY'}`);
  console.log(`  Canva MCP     : ${process.env.CANVA_MCP_TOKEN ? '✓ Configured' : '✗ Missing CANVA_MCP_TOKEN (set to enable Canva generation)'}\n`);
});
