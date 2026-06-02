const handler = async (req, res) => {
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: max_tokens || 1500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: messages
        })
      });

      const raw = await response.text();
      if (!response.ok) return res.status(response.status).json({ error: raw });

      const parsed = JSON.parse(raw);

      // Extract ALL text from ALL content blocks (including tool results)
      let allText = '';
      if (parsed.content && Array.isArray(parsed.content)) {
        parsed.content.forEach(block => {
          if (block.type === 'text' && block.text) {
            allText += block.text + '\n';
          }
          // Also check tool_result blocks
          if (block.type === 'tool_result' && block.content) {
            if (typeof block.content === 'string') allText += block.content + '\n';
            if (Array.isArray(block.content)) {
              block.content.forEach(c => { if (c.text) allText += c.text + '\n'; });
            }
          }
        });
      }

      // Return the full response so frontend can parse it
      return res.status(200).json({ ...parsed, _extractedText: allText });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid type' });
};

module.exports = handler;
