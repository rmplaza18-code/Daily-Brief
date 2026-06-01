export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  try {
    const body = req.body;
    // Remove tools if present and use web search correctly
    const requestBody = {
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 1000,
      messages: body.messages,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }]
    };
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interop-20250514'
      },
      body: JSON.stringify(requestBody)
    });
 
    const text = await response.text();
    
    // Log error details for debugging
    if (!response.ok) {
      console.error('Anthropic API error:', response.status, text);
      return res.status(response.status).json({ error: text });
    }
 
    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
