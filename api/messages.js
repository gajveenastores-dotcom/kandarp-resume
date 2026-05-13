/**
 * Vercel serverless: forwards /api/messages → Anthropic (keeps API key on the server).
 * Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, anthropic-version');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.REACT_APP_ANTHROPIC_API_KEY ||
    process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: {
        message:
          'No API key on the server. In Vercel → Settings → Environment Variables, set ANTHROPIC_API_KEY (or REACT_APP_ANTHROPIC_API_KEY).',
      },
    });
  }

  try {
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': anthropicVersion,
      },
      body: bodyString,
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.status(upstream.status).setHeader('Content-Type', contentType);
    return res.send(text);
  } catch (err) {
    console.error('api/messages proxy error:', err);
    return res.status(502).json({ error: { message: 'Upstream request failed' } });
  }
}
