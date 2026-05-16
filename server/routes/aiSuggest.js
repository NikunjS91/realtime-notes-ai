const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const authMiddleware = require('../middleware/authMiddleware');

const client = new OpenAI({
  apiKey: process.env.NIM_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, currentTitle } = req.body;

    if (!content || content.length < 50) {
      return res.status(400).json({ message: 'Content too short' });
    }

    const completion = await client.chat.completions.create({
      model: 'meta/llama-4-maverick-17b-128e-instruct',
      messages: [
        {
          role: 'system',
          content: `You are a note intelligence assistant. Analyze note content and respond with ONLY valid JSON, no markdown, no explanation:
{
  "title": "A concise title of 3-6 words",
  "tags": ["tag1", "tag2", "tag3"]
}
Rules:
- Title: capitalize first letter only, no punctuation, max 6 words
- Tags: max 3 tags, lowercase, single words or hyphenated, relevant to content
- Return ONLY the JSON object, nothing else`
        },
        {
          role: 'user',
          content: `Analyze this note and suggest a title and tags:\n\n${content.slice(0, 500)}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      title: parsed.title || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : []
    });
  } catch (err) {
    console.error('AI suggest error:', err.message);
    res.status(500).json({ message: 'AI suggestion failed' });
  }
});

module.exports = router;