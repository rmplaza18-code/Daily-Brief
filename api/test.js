const handler = async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({ status: 'ERROR', message: 'No API key found in environment' });
  }

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
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say hello in one word.' }]
      })
    });

    const text = await response.text();
    return res.status(200).json({
      status: response.ok ? 'SUCCESS' : 'ERROR',
      httpStatus: response.status,
      keyPrefix: apiKey.substring(0, 20),
      response: text.substring(0, 500)
    });
  } catch (err) {
    return res.status(200).json({ status: 'EXCEPTION', error: err.message });
  }
};

module.exports = handler;
