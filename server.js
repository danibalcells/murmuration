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

const CORPUS_WORDS = new Set([
  'root','bloom','thorn','moss','seed','petal','vine','fern','stone','dust','ash','soil','grow',
  'light','shadow','glow','ember','flame','spark','dim','gleam','flicker','burn',
  'river','tide','rain','mist','shore','wave','deep','pool','foam','pour','drown',
  'silence','echo','memory','distance','threshold','between','through','beyond','within','absence','hollow','vast','tender','know','yearn',
  'breath','pulse','bone','skin','eye','hand','voice','mouth','vein','hold','ache','bind',
  'dawn','dusk','moment','still','now','once','always','never','fade','remain','linger','keep','wake','sleep',
  'fall','rise','drift','scatter','gather','turn','reach','break','unfold','sway','trace','bend','weave',
  'hum','whisper','ring','murmur','hush','song','call','sing'
]);

const STOP_WORDS = new Set([
  'the','a','an','in','of','and','to','is','was','that','this','it','its','for','on','at','by','with','from',
  'or','but','not','no','as','are','were','be','been','has','have','had','do','does','did',
  'will','would','could','should','may','might','can','shall',
  'he','she','we','they','you','me','him','her','us','them','my','your','his','our','their',
  'who','what','when','where','how','why','which','whom','whose',
  'into','onto','upon','about','after','before','under','over','above','below','along','across','around',
  'also','just','only','very','too','more','most','less','much','many','some','any','all','each','every',
  'here','there','then','than','so','such','own','other','another','same','like','even',
  'back','down','away','off','out','up','again','ago','ever','far','long','near','next','yet','well',
  'already','almost','enough','quite','rather','really','perhaps','probably','certainly',
  'however','although','though','because','since','while','until','unless','whether','during','without',
  'toward','towards','against','among','beside','besides','instead','despite','except',
  'itself','himself','herself','themselves','ourselves','myself','yourself',
  'something','anything','nothing','everything','someone','anyone','everyone','nobody',
  'place','thing','time','way','day','year','part','world','life','kind'
]);

function isUninteresting(word) {
  if (word.endsWith('ing') && word.length > 4) return true;
  if (word.endsWith('ed') && word.length > 3) return true;
  if (word.endsWith('ly') && word.length > 3) return true;
  if (word.endsWith('tion') || word.endsWith('sion')) return true;
  if (word.endsWith('ness') || word.endsWith('ment')) return true;
  if (word.endsWith('ous') || word.endsWith('ive')) return true;
  if (word.endsWith('able') || word.endsWith('ible')) return true;
  if (word.endsWith('s') && CORPUS_WORDS.has(word.slice(0, -1))) return true;
  if (word.endsWith('es') && CORPUS_WORDS.has(word.slice(0, -2))) return true;
  if (word.endsWith('er') && CORPUS_WORDS.has(word.slice(0, -2))) return true;
  if (word.endsWith('est') && CORPUS_WORDS.has(word.slice(0, -3))) return true;
  return false;
}

function extractNewWord(verse) {
  const words = verse.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const novel = words.filter(w =>
    !CORPUS_WORDS.has(w) && !STOP_WORDS.has(w) && !isUninteresting(w)
  );
  if (novel.length === 0) return null;
  const scored = novel.map(w => {
    let score = 0;
    if (w.length >= 4 && w.length <= 8) score += 3;
    else if (w.length === 3) score += 1;
    if (/[aeiouy].*[aeiouy]/.test(w)) score += 1;
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
