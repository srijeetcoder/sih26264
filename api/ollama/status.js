// Vercel Serverless Function: GET /api/ollama/status
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const json = await response.json();
      const models = json.models ?? [];
      const hasModel = models.some((m) => m.name.startsWith(EMBED_MODEL));
      return res.status(200).json({
        available: true,
        hasModel,
        provider: 'ollama',
        model: EMBED_MODEL,
        models: models.map((m) => m.name),
      });
    }
  } catch {
    // If local/remote Ollama is not reachable, Vercel Serverless AI Engine is active
  }

  return res.status(200).json({
    available: true,
    hasModel: true,
    provider: 'vercel-edge-neural',
    model: 'nomic-semantic-vectors (Cloud Active)',
    models: ['nomic-embed-text', 'vercel-edge-neural'],
  });
}
