import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

if (!client) {
  console.log('  (no ANTHROPIC_API_KEY — word synthesis disabled)');
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json'
};

const KNOWN_WORDS = new Set([
  'root','bloom','thorn','moss','seed','petal','vine','fern','stone','dust','ash','soil','grow',
  'light','shadow','glow','ember','flame','spark','dim','gleam','flicker','burn',
  'river','tide','rain','mist','shore','wave','deep','pool','foam','pour','drown',
  'silence','echo','memory','distance','threshold','between','through','beyond','within','absence','hollow','vast','tender','know','yearn',
  'breath','pulse','bone','skin','eye','hand','voice','mouth','vein','hold','ache','bind',
  'dawn','dusk','moment','still','now','once','always','never','fade','remain','linger','keep','wake','sleep',
  'fall','rise','drift','scatter','gather','turn','reach','break','unfold','sway','trace','bend','weave',
  'hum','whisper','ring','murmur','hush','song','call','sing',
  'the','a','an','in','of','and','to','is','was','that','this','it','its','for','on','at','by','with','from','or','but','not','no','as','are','were','be','been','has','have','had','do','does','did','will','would','could','should','may','might','can','shall'
]);

function extractNewWord(verse) {
  const words = verse.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const novel = words.filter(w => !KNOWN_WORDS.has(w));
  if (novel.length === 0) return null;
  const scored = novel.map(w => {
    let score = 0;
    if (w.length >= 4 && w.length <= 8) score += 2;
    if (/[aeiouy]/.test(w)) score += 1;
    if (novel.indexOf(w) < novel.length / 2) score += 1;
    return { word: w, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.word || null;
}

async function handleSynthesize(req, res) {
  if (!client) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No API key configured' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  try {
    const { words, context } = JSON.parse(body);

    const contextPart = context && context.length > 0
      ? `\n\nThe poem growing so far:\n${context.join('\n')}`
      : '';

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 40,
      messages: [{
        role: 'user',
        content: `These words dissolved from a drifting pattern: ${words.join(', ')}.${contextPart}\n\nWrite the next line of the poem. One line, 3-8 words. Quiet, precise, luminous. Lowercase, no ending punctuation. Just the line.`
      }]
    });

    const verse = message.content[0].text.trim().replace(/[.!?]+$/, '').toLowerCase();
    const newWord = extractNewWord(verse);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ verse, word: newWord }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/synthesize') {
    return handleSynthesize(req, res);
  }

  const filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`murmuration → http://localhost:${PORT}`);
});
