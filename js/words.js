export const CATEGORY_HUES = {
  nature: 130,
  light: 55,
  water: 210,
  abstract: 270,
  body: 8,
  time: 35,
  movement: 175,
  sound: 315
};

const COMPLEMENTS = [
  ['light', 'shadow'], ['silence', 'echo'], ['rise', 'fall'],
  ['dawn', 'dusk'], ['gather', 'scatter'], ['still', 'drift'],
  ['bloom', 'fade'], ['breath', 'stone'], ['flame', 'rain'],
  ['beyond', 'within'], ['always', 'never'], ['vast', 'hollow'],
  ['hush', 'call'], ['deep', 'spark'], ['root', 'dust'],
  ['seed', 'ash'], ['tender', 'thorn'], ['pulse', 'dim']
];

const complementMap = new Map();
for (const [a, b] of COMPLEMENTS) {
  complementMap.set(a, b);
  complementMap.set(b, a);
}

export const CORPUS = [
  { text: 'root', category: 'nature', warmth: 0.2, weight: 0.8, syllables: 1 },
  { text: 'bloom', category: 'nature', warmth: 0.7, weight: 0.2, syllables: 1 },
  { text: 'thorn', category: 'nature', warmth: -0.3, weight: 0.5, syllables: 1 },
  { text: 'moss', category: 'nature', warmth: 0.3, weight: 0.4, syllables: 1 },
  { text: 'seed', category: 'nature', warmth: 0.5, weight: 0.2, syllables: 1 },
  { text: 'petal', category: 'nature', warmth: 0.6, weight: 0.1, syllables: 2 },
  { text: 'vine', category: 'nature', warmth: 0.4, weight: 0.3, syllables: 1 },
  { text: 'fern', category: 'nature', warmth: 0.3, weight: 0.3, syllables: 1 },
  { text: 'stone', category: 'nature', warmth: -0.4, weight: 1.0, syllables: 1 },
  { text: 'dust', category: 'nature', warmth: -0.1, weight: 0.1, syllables: 1 },
  { text: 'ash', category: 'nature', warmth: -0.2, weight: 0.2, syllables: 1 },
  { text: 'soil', category: 'nature', warmth: 0.3, weight: 0.7, syllables: 1 },

  { text: 'light', category: 'light', warmth: 0.6, weight: 0.1, syllables: 1 },
  { text: 'shadow', category: 'light', warmth: -0.5, weight: 0.4, syllables: 2 },
  { text: 'glow', category: 'light', warmth: 0.7, weight: 0.1, syllables: 1 },
  { text: 'ember', category: 'light', warmth: 0.8, weight: 0.3, syllables: 2 },
  { text: 'flame', category: 'light', warmth: 0.9, weight: 0.2, syllables: 1 },
  { text: 'spark', category: 'light', warmth: 0.8, weight: 0.1, syllables: 1 },
  { text: 'dim', category: 'light', warmth: -0.3, weight: 0.2, syllables: 1 },
  { text: 'gleam', category: 'light', warmth: 0.5, weight: 0.1, syllables: 1 },
  { text: 'flicker', category: 'light', warmth: 0.4, weight: 0.1, syllables: 2 },

  { text: 'river', category: 'water', warmth: 0.1, weight: 0.5, syllables: 2 },
  { text: 'tide', category: 'water', warmth: 0.0, weight: 0.6, syllables: 1 },
  { text: 'rain', category: 'water', warmth: 0.2, weight: 0.3, syllables: 1 },
  { text: 'mist', category: 'water', warmth: -0.1, weight: 0.1, syllables: 1 },
  { text: 'shore', category: 'water', warmth: 0.2, weight: 0.6, syllables: 1 },
  { text: 'wave', category: 'water', warmth: 0.1, weight: 0.4, syllables: 1 },
  { text: 'deep', category: 'water', warmth: -0.3, weight: 0.8, syllables: 1 },
  { text: 'pool', category: 'water', warmth: 0.1, weight: 0.5, syllables: 1 },
  { text: 'foam', category: 'water', warmth: 0.2, weight: 0.1, syllables: 1 },

  { text: 'silence', category: 'abstract', warmth: -0.2, weight: 0.3, syllables: 2 },
  { text: 'echo', category: 'abstract', warmth: 0.0, weight: 0.2, syllables: 2 },
  { text: 'memory', category: 'abstract', warmth: 0.3, weight: 0.4, syllables: 3 },
  { text: 'distance', category: 'abstract', warmth: -0.3, weight: 0.3, syllables: 2 },
  { text: 'threshold', category: 'abstract', warmth: 0.0, weight: 0.5, syllables: 2 },
  { text: 'between', category: 'abstract', warmth: 0.0, weight: 0.2, syllables: 2 },
  { text: 'through', category: 'abstract', warmth: 0.1, weight: 0.2, syllables: 1 },
  { text: 'beyond', category: 'abstract', warmth: 0.2, weight: 0.2, syllables: 2 },
  { text: 'within', category: 'abstract', warmth: 0.2, weight: 0.3, syllables: 2 },
  { text: 'absence', category: 'abstract', warmth: -0.4, weight: 0.3, syllables: 2 },
  { text: 'hollow', category: 'abstract', warmth: -0.3, weight: 0.3, syllables: 2 },
  { text: 'vast', category: 'abstract', warmth: -0.1, weight: 0.4, syllables: 1 },
  { text: 'tender', category: 'abstract', warmth: 0.6, weight: 0.2, syllables: 2 },

  { text: 'breath', category: 'body', warmth: 0.5, weight: 0.1, syllables: 1 },
  { text: 'pulse', category: 'body', warmth: 0.4, weight: 0.3, syllables: 1 },
  { text: 'bone', category: 'body', warmth: -0.2, weight: 0.9, syllables: 1 },
  { text: 'skin', category: 'body', warmth: 0.4, weight: 0.2, syllables: 1 },
  { text: 'eye', category: 'body', warmth: 0.3, weight: 0.2, syllables: 1 },
  { text: 'hand', category: 'body', warmth: 0.5, weight: 0.4, syllables: 1 },
  { text: 'voice', category: 'body', warmth: 0.4, weight: 0.2, syllables: 1 },
  { text: 'mouth', category: 'body', warmth: 0.3, weight: 0.3, syllables: 1 },
  { text: 'vein', category: 'body', warmth: 0.2, weight: 0.3, syllables: 1 },

  { text: 'dawn', category: 'time', warmth: 0.6, weight: 0.2, syllables: 1 },
  { text: 'dusk', category: 'time', warmth: -0.2, weight: 0.3, syllables: 1 },
  { text: 'moment', category: 'time', warmth: 0.3, weight: 0.2, syllables: 2 },
  { text: 'still', category: 'time', warmth: -0.1, weight: 0.3, syllables: 1 },
  { text: 'now', category: 'time', warmth: 0.3, weight: 0.1, syllables: 1 },
  { text: 'once', category: 'time', warmth: 0.2, weight: 0.3, syllables: 1 },
  { text: 'always', category: 'time', warmth: 0.3, weight: 0.4, syllables: 2 },
  { text: 'never', category: 'time', warmth: -0.4, weight: 0.4, syllables: 2 },
  { text: 'fade', category: 'time', warmth: -0.2, weight: 0.1, syllables: 1 },
  { text: 'remain', category: 'time', warmth: 0.1, weight: 0.5, syllables: 2 },
  { text: 'linger', category: 'time', warmth: 0.2, weight: 0.3, syllables: 2 },

  { text: 'fall', category: 'movement', warmth: -0.1, weight: 0.4, syllables: 1 },
  { text: 'rise', category: 'movement', warmth: 0.4, weight: 0.2, syllables: 1 },
  { text: 'drift', category: 'movement', warmth: 0.0, weight: 0.1, syllables: 1 },
  { text: 'scatter', category: 'movement', warmth: -0.1, weight: 0.2, syllables: 2 },
  { text: 'gather', category: 'movement', warmth: 0.3, weight: 0.4, syllables: 2 },
  { text: 'turn', category: 'movement', warmth: 0.0, weight: 0.3, syllables: 1 },
  { text: 'reach', category: 'movement', warmth: 0.3, weight: 0.2, syllables: 1 },
  { text: 'break', category: 'movement', warmth: -0.2, weight: 0.4, syllables: 1 },
  { text: 'unfold', category: 'movement', warmth: 0.3, weight: 0.2, syllables: 2 },
  { text: 'sway', category: 'movement', warmth: 0.2, weight: 0.2, syllables: 1 },
  { text: 'trace', category: 'movement', warmth: 0.1, weight: 0.2, syllables: 1 },

  { text: 'hum', category: 'sound', warmth: 0.3, weight: 0.2, syllables: 1 },
  { text: 'whisper', category: 'sound', warmth: 0.2, weight: 0.1, syllables: 2 },
  { text: 'ring', category: 'sound', warmth: 0.1, weight: 0.2, syllables: 1 },
  { text: 'murmur', category: 'sound', warmth: 0.3, weight: 0.2, syllables: 2 },
  { text: 'hush', category: 'sound', warmth: -0.1, weight: 0.1, syllables: 1 },
  { text: 'song', category: 'sound', warmth: 0.5, weight: 0.2, syllables: 1 },
  { text: 'call', category: 'sound', warmth: 0.2, weight: 0.3, syllables: 1 }
];

export function getRandomWord() {
  return CORPUS[Math.floor(Math.random() * CORPUS.length)];
}

export function getAffinity(w1, w2) {
  let affinity = 0;
  if (w1.category === w2.category) affinity += 0.3;
  if (w1.text[0] === w2.text[0]) affinity += 0.15;
  if (complementMap.get(w1.text) === w2.text) affinity += 0.7;
  if (Math.abs(w1.warmth - w2.warmth) < 0.3) affinity += 0.1;
  return affinity;
}
