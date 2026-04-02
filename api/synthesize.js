import Anthropic from '@anthropic-ai/sdk';

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

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

const CATEGORY_TONES = {
  nature: 'earth, growth, decay',
  light: 'luminance, shadow, warmth',
  water: 'depth, flow, surface',
  abstract: 'interiority, space, what cannot be held',
  body: 'sensation, presence, the physical',
  time: 'duration, stillness, change',
  movement: 'gesture, direction, the body in motion',
  sound: 'resonance, quiet, vibration',
  emergent: 'what has already emerged from this poem'
};

const SYSTEM_PROMPT = `You are a voice inside a living poem. Words drift on a dark canvas, drawn together by hidden affinities. When they align, they crystallize into phrases. When phrases dissolve, you write the next line.

You are not explaining the process. You are the poem. Each line joins what came before into a single growing work.

Constraints:
- One line, 3–8 words
- Lowercase, no ending punctuation
- Prefer the concrete and the felt over the conceptual
- No filler words. Every word must earn its place
- Never begin a line with "and", "the", or "a"
- Vary your syntax — not every line should be a noun phrase or a declarative`;

function getArcGuidance(verseCount) {
  if (verseCount <= 3) {
    return 'This poem is just beginning. Write something that could be a first image — singular, precise, unexplained. A seed, not a statement.';
  }
  if (verseCount <= 8) {
    return 'The poem is finding its shape. Let this line reach toward what came before — not by repeating, but by rhyming in feeling. Something is accumulating.';
  }
  if (verseCount <= 14) {
    return 'The poem has weight now. You can afford a turn — a paradox, a tension, a question embedded in an image. Surprise yourself.';
  }
  return 'The poem has said enough to be generous. Write with more space. Let silence into the line. Something opening, not closing.';
}

function extractRecentMotifs(context) {
  if (!context || context.length === 0) return [];
  const recent = context.slice(-3);
  const words = recent.join(' ').toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  return words.filter(w =>
    w.length > 3 && !STOP_WORDS.has(w) && !['into', 'from', 'what', 'where', 'when'].includes(w)
  );
}

const MICRO_CONSTRAINTS = [
  'Try an unusual verb — one that surprises even you.',
  'No linking words (where, when, while, how, that). Pure image.',
  'End the line with its most important word.',
  'Make it a fragment, not a sentence.',
  'Use only monosyllabic words.',
  'Start with a verb.',
  'Include a color without naming it directly.',
  'Let the line contain a contradiction.',
  'Write something tender.',
  'Use a word from the body.',
  'Make the line feel like a question without using a question mark.',
  'Write the shortest line you can. Three or four words.',
];

function buildPrompt(words, context, verseCount, categories) {
  const tones = [...new Set(categories.map(c => CATEGORY_TONES[c]).filter(Boolean))];
  const toneLine = tones.length > 0
    ? `The dissolved words carry the feeling of: ${tones.join('; ')}.`
    : '';

  const recentMotifs = extractRecentMotifs(context);
  const allAvoid = [...new Set([...recentMotifs, ...words.map(w => w.toLowerCase())])].slice(0, 12);
  const avoidLine = allAvoid.length > 0
    ? `\nDo not use any of these words or their close synonyms: ${allAvoid.join(', ')}. Depart from them — let them inspire direction, not vocabulary.`
    : '';

  const contextPart = context && context.length > 0
    ? `\nThe poem so far:\n${context.join('\n')}`
    : '';

  const arcGuidance = getArcGuidance(verseCount);
  const micro = MICRO_CONSTRAINTS[Math.floor(Math.random() * MICRO_CONSTRAINTS.length)];

  return `Dissolved words: ${words.join(', ')}
${toneLine}${contextPart}

${arcGuidance}${avoidLine}

Constraint for this line: ${micro}

Write the next line.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!client) {
    res.status(503).json({ error: 'No API key configured' });
    return;
  }

  try {
    const { words, context, verseCount = 0, categories = [] } = req.body;
    const prompt = buildPrompt(words, context, verseCount, categories);

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const verse = message.content[0].text.trim().replace(/[.!?]+$/, '').toLowerCase();
    const word = extractNewWord(verse);

    res.status(200).json({ verse, word });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
