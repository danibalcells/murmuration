import { Grid } from './js/grid.js';
import { CORPUS, scorePoetryRun } from './js/words.js';

const TICKS = parseInt(process.argv[2]) || 200;
const COLS = 15;
const ROWS = 10;

const grid = new Grid(COLS, ROWS);
grid.init(0.2);

const stream = [];
const verseHistory = [];
let crystalCount = 0;
let dissolveCount = 0;
let verseCount = 0;
let versesSinceBreak = 0;
let nextBreakAt = 5 + Math.floor(Math.random() * 3);

grid.onCrystallize = (line) => {
  crystalCount++;
  const text = line.words.map(w => w.text).join(' ');
  const quality = line.quality || 0;
  stream.push({ type: 'crystal', text, quality });
  console.log(`  \x1b[2m⬡ crystallized (q=${quality.toFixed(2)}): ${text}\x1b[0m`);
};

grid.onDissolve = async ({ texts, centerX, centerY, categories }) => {
  dissolveCount++;
  const lineText = texts.join(' ');
  console.log(`  \x1b[2m⬡ dissolved: ${lineText}\x1b[0m`);

  try {
    const res = await fetch('http://localhost:3000/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        words: texts,
        context: verseHistory,
        verseCount,
        categories: categories || []
      })
    });

    if (!res.ok) return;
    const { verse, word: newWord } = await res.json();

    if (verse) {
      verseCount++;
      verseHistory.push(verse);
      if (verseHistory.length > 20) verseHistory.shift();

      versesSinceBreak++;
      if (versesSinceBreak >= nextBreakAt) {
        stream.push({ type: 'break' });
        console.log();
        versesSinceBreak = 0;
        nextBreakAt = 5 + Math.floor(Math.random() * 3);
      }

      stream.push({ type: 'verse', text: verse, from: lineText });
      console.log(`  \x1b[33m✦ verse: ${verse}\x1b[0m`);
      if (newWord) {
        console.log(`  \x1b[2m  → new word: ${newWord}\x1b[0m`);
        placeEmergentWord(newWord, verse, centerX, centerY);
      }
    }
  } catch {
    console.log(`  \x1b[31m  (synthesis unavailable)\x1b[0m`);
  }
};

function placeEmergentWord(text, verse, centerX, centerY) {
  if (grid.hasWordText(text)) return;
  const wordData = {
    text,
    category: 'emergent',
    warmth: 0.2 + Math.random() * 0.4,
    weight: 0.2 + Math.random() * 0.3,
    syllables: Math.max(1, Math.ceil(text.length / 3)),
    sourceVerse: verse,
    fixed: true
  };
  for (let r = 0; r <= 3; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (grid.inBounds(x, y) && !grid.getWordAt(x, y)) {
          const w = grid.addWord(wordData, x, y);
          w.energy = 1.0;
          return;
        }
      }
    }
  }
}

console.log(`\nmurmuration — simulating ${TICKS} ticks on ${COLS}×${ROWS} grid\n`);

for (let tick = 0; tick < TICKS; tick++) {
  grid.tick();

  if (dissolveCount > 0) {
    await new Promise(r => setTimeout(r, 100));
  }
}

await new Promise(r => setTimeout(r, 3000));

console.log(`\n${'─'.repeat(50)}`);
console.log(`\n  ${crystalCount} crystallizations, ${dissolveCount} dissolutions, ${verseCount} verses\n`);
console.log(`${'─'.repeat(50)}`);

const verses = stream.filter(s => s.type === 'verse' || s.type === 'break');
if (verses.length > 0) {
  console.log(`\n  THE POEM\n`);
  for (const entry of verses) {
    if (entry.type === 'break') console.log();
    else console.log(`  ${entry.text}`);
  }
  console.log();
}

const emergentWords = [...grid.words.values()].filter(w => w.category === 'emergent');
if (emergentWords.length > 0) {
  console.log(`  EMERGENT WORDS ON GRID: ${emergentWords.map(w => w.text).join(', ')}\n`);
}
