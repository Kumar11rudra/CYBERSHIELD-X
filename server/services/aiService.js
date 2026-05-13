/**
 * Neural Intelligence Service
 * Powers AI Pentest Automator using Mistral AI (Free Tier Alternative).
 */

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

const generateSecurityGuidance = async (tool, target, context) => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return { error: 'Mistral AI Key missing. Using local heuristic fallback.', source: 'Nexus-AI' };
  }

  try {
    const response = await axios.post(MISTRAL_URL, {
      model: 'mistral-small-latest', // High-performance free-tier model
      messages: [
        {
          role: 'system',
          content: 'You are CyberShield X Nexus-AI. Provide concise, professional, and technical security guidance.'
        },
        {
          role: 'user',
          content: `Analyze and provide pentest guidance for:\nTool: ${tool}\nTarget: ${target}\nContext: ${context}`
        }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });

    return {
      source: 'Nexus-AI (Mistral)',
      guidance: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  } catch (error) {
    console.error('[MISTRAL ERROR]', error.response?.data || error.message);
    return { error: 'Failed to generate security intelligence.', source: 'Nexus-AI' };
  }
};

module.exports = { generateSecurityGuidance };
