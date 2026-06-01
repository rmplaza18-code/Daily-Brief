export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, symbol, messages, max_tokens } = req.body;

  if (type === 'market') {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (type === 'news') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    try {
      // First try: with web search tool
      const body = {
        model: 'claude-opus-4-5',
        max_tokens: max_tokens || 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: messages
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'interop-20250514'
        },
        body: JSON.stringify(body)
      });

      const text = await response.text();

      if (!response.ok) {
        // Fallback: try without beta header and without tools
        console.log('First attempt failed:', response.status, text.substring(0, 200));
        
        const body2 = {
          model: 'claude-opus-4-5',
          max_tokens: max_tokens || 1000,
          messages: messages
        };

        const response2 = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(body2)
        });

        const text2 = await response2.text();
        console.log('Fallback attempt:', response2.status, text2.substring(0, 200));

        if (!response2.ok) return res.status(response2.status).json({ error: text2 });
        return res.status(200).json(JSON.parse(text2));
      }

      return res.status(200).json(JSON.parse(text));
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid type' });
}
