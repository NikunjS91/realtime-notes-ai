const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/authMiddleware');

const client = new OpenAI({
  apiKey: process.env.NIM_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

const SUMMARY_STYLES = {
  bullets: {
    system: 'You are a concise note summariser. Always respond with exactly 3 bullet points using • as the bullet character. Each bullet should be one clear sentence capturing a key idea. Never add preamble.',
    user: (content) => `Summarise this note in exactly 3 bullet points:\n\n${content}`
  },
  paragraph: {
    system: 'You are a skilled writer. Summarise the given note in one smooth, flowing paragraph of 3-4 sentences. No bullet points. No headers. Just clean prose.',
    user: (content) => `Write a paragraph summary of this note:\n\n${content}`
  },
  poetic: {
    system: 'You are a creative poet. Capture the essence of the given note in a short poem of 4-6 lines. Be expressive and metaphorical. No explanations — just the poem.',
    user: (content) => `Write a short poem capturing the essence of this note:\n\n${content}`
  },
  oneliner: {
    system: 'You are an expert at distilling ideas. Summarise the given note in exactly one sharp, memorable sentence. Maximum 25 words. No punctuation beyond the sentence itself.',
    user: (content) => `Summarise this note in one sentence (max 25 words):\n\n${content}`
  },
  takeaways: {
    system: 'You are an analyst. Extract the most important takeaways from the note. Use this exact format: start each takeaway with "→" followed by a bold label in caps, then a colon, then one sentence. Give 3-4 takeaways.',
    user: (content) => `Extract key takeaways from this note:\n\n${content}`
  },
  eli5: {
    system: 'You are explaining something to a 10-year-old. Use very simple words, short sentences, and maybe a fun analogy. 2-3 sentences maximum. No jargon.',
    user: (content) => `Explain this note simply as if to a child:\n\n${content}`
  }
};

// Health check endpoint
router.get('/status', authMiddleware, async (req, res) => {
  try {
    await client.chat.completions.create({
      model: 'meta/llama-4-maverick-17b-128e-instruct',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1
    });
    res.json({ status: 'available' });
  } catch (error) {
    res.json({ status: 'unavailable', error: error.message });
  }
});

router.post('/:noteId', authMiddleware, async (req, res) => {
  try {
    const { style = 'bullets' } = req.body;
    const note = await Note.findById(req.params.noteId);

    if (!note) return res.status(404).json({ message: 'Note not found' });

    const isOwner = note.owner.toString() === req.user._id.toString();
    const isCollaborator = note.collaborators.some(
      c => c.toString() === req.user._id.toString()
    );
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!note.content || note.content.length < 50) {
      return res.status(400).json({ message: 'Note is too short to summarise (minimum 50 characters)' });
    }

    const selectedStyle = SUMMARY_STYLES[style] || SUMMARY_STYLES.bullets;

    const completion = await client.chat.completions.create({
      model: 'meta/llama-4-maverick-17b-128e-instruct',
      messages: [
        { role: 'system', content: selectedStyle.system },
        { role: 'user', content: selectedStyle.user(note.content) }
      ],
      max_tokens: 400,
      temperature: style === 'poetic' ? 0.9 : 0.5
    });

    const summary = completion.choices[0].message.content;
    note.summary = summary;
    if (!note.title) note.title = 'Untitled';
    await note.save();

    res.json({ summary, style });
  } catch (error) {
    console.error('Summary error:', error.message);
    if (error.status === 429) return res.status(503).json({ message: 'Rate limit hit. Wait a moment.' });
    res.status(500).json({ message: 'AI service unavailable. Please try again.' });
  }
});

module.exports = router;