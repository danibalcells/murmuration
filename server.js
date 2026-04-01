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

async function handleSynthesize(req, res) {
  if (!client) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No API key configured' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  try {
    const { words } = JSON.parse(body);
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `In a generative poetry simulation, these words drifted together and crystallized into a line: ${words.join(', ')}. They are now dissolving. From their union, a single new word emerges—real or invented, evocative and strange. What is the word? Reply with only the word, lowercase.`
      }]
    });

    const word = message.content[0].text.trim().toLowerCase().replace(/[^a-z]/g, '');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ word }));
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
