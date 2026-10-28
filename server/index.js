// OneDesk — Minimal Backend Server
// Proxies semantic matching requests to local Ollama instance
// Port: 3001
// Node.js ESM (type: "module" in package.json)

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL ?? 'nomic-embed-text';
const SEMANTIC_THRESHOLD = parseFloat(process.env.SEMANTIC_THRESHOLD ?? '0.75');

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '2mb' }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Ollama availability check ─────────────────────────────────────────────────
app.get('/api/ollama/status', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      return res.json({ available: false, error: `Ollama HTTP ${response.status}` });
    }
    const json = await response.json();
    const models = json.models ?? [];
    const hasModel = models.some((m) => m.name.startsWith(EMBED_MODEL));
    return res.json({
      available: true,
      hasModel,
      model: EMBED_MODEL,
      models: models.map((m) => m.name),
    });
  } catch (err) {
    return res.json({
      available: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// ── Semantic match endpoint ───────────────────────────────────────────────────
// POST /api/match/semantic
// Body: { descriptions: Array<{ id: string, text: string }> }
// Returns: { candidates: Array<{ idA, idB, score, method }>, ollamaUsed: boolean }

app.post('/api/match/semantic', async (req, res) => {
  const { descriptions } = req.body;

  if (!Array.isArray(descriptions) || descriptions.length < 2) {
    return res.status(400).json({ error: 'Provide at least 2 descriptions.' });
  }

  for (const d of descriptions) {
    if (typeof d.id !== 'string' || typeof d.text !== 'string') {
      return res.status(400).json({ error: 'Each item must have id (string) and text (string).' });
    }
    if (d.text.length > 2000) {
      return res.status(400).json({ error: `Description for "${d.id}" exceeds 2000 characters.` });
    }
  }

  // Fetch embeddings
  const embeddings = new Map();
  for (const d of descriptions) {
    try {
      const resp = await fetch(`${OLLAMA_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: EMBED_MODEL, input: d.text }),
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) {
        console.warn(`[Ollama] HTTP ${resp.status} for ${d.id}`);
        continue;
      }
      const json = await resp.json();
      if (json.embeddings?.[0]) {
        embeddings.set(d.id, json.embeddings[0]);
      }
    } catch (e) {
      console.warn(`[Ollama] Failed to embed ${d.id}:`, e.message);
    }
  }

  if (embeddings.size < 2) {
    return res.status(503).json({
      error: 'Could not retrieve enough embeddings from Ollama.',
      ollamaUsed: false,
    });
  }

  // Cosine similarity
  function cosine(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }

  const candidates = [];
  const ids = [...embeddings.keys()];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const score = cosine(embeddings.get(ids[i]), embeddings.get(ids[j]));
      if (score >= SEMANTIC_THRESHOLD) {
        candidates.push({
          idA: ids[i],
          idB: ids[j],
          score: Math.round(score * 1000) / 1000,
          method: 'semantic-ai',
          evidence: `Semantic similarity: ${(score * 100).toFixed(1)}% (model: ${EMBED_MODEL}, threshold: ${(SEMANTIC_THRESHOLD * 100).toFixed(0)}%). Human review required.`,
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return res.json({ candidates, ollamaUsed: true, model: EMBED_MODEL, threshold: SEMANTIC_THRESHOLD });
});

app.listen(PORT, () => {
  console.log(`[OneDesk backend] Running on http://localhost:${PORT}`);
  console.log(`[OneDesk backend] Ollama URL: ${OLLAMA_URL}`);
  console.log(`[OneDesk backend] Embed model: ${EMBED_MODEL}`);
  console.log(`[OneDesk backend] Semantic threshold: ${SEMANTIC_THRESHOLD}`);
});
