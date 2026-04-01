import { Grid } from './grid.js';
import { Renderer } from './renderer.js';
import { CATEGORY_HUES, CORPUS, getRandomWord } from './words.js';

const canvas = document.getElementById('canvas');

const CELL_TARGET = 100;
const cols = Math.max(8, Math.floor(window.innerWidth / CELL_TARGET));
const rows = Math.max(5, Math.floor(window.innerHeight / (CELL_TARGET * 0.75)));

const grid = new Grid(cols, rows);
const renderer = new Renderer(canvas, grid);

grid.init(0.2);

grid.onCrystallize = (line) => {
  for (const word of line.words) {
    const px = (word.gridX + 0.5) * renderer.cellW;
    const py = (word.gridY + 0.5) * renderer.cellH;
    renderer.emitParticles(px, py, CATEGORY_HUES[word.category] || 40, 8);
  }
};

grid.onDissolve = async ({ texts, centerX, centerY }) => {
  renderer.emitParticles(
    (centerX + 0.5) * renderer.cellW,
    (centerY + 0.5) * renderer.cellH,
    40, 20
  );

  try {
    const res = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: texts })
    });

    if (!res.ok) return;
    const { word: synthesized } = await res.json();
    if (!synthesized) return;

    for (let r = 0; r <= 3; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (grid.inBounds(x, y) && !grid.getWordAt(x, y)) {
            const wordData = {
              text: synthesized,
              category: 'emergent',
              warmth: 0.4,
              weight: 0.3,
              syllables: Math.max(1, Math.ceil(synthesized.length / 3))
            };
            const w = grid.addWord(wordData, x, y);
            w.energy = 1.0;
            renderer.emitParticles(
              (x + 0.5) * renderer.cellW,
              (y + 0.5) * renderer.cellH,
              CATEGORY_HUES.emergent, 15
            );
            return;
          }
        }
      }
    }
  } catch {
    // synthesis unavailable
  }
};

let paused = false;
let lastTick = 0;
const TICK_INTERVAL = 1500;
const pauseIndicator = document.getElementById('pause-indicator');

let typingWord = '';

function loop(timestamp) {
  if (!lastTick) lastTick = timestamp;

  if (!paused) {
    if (timestamp - lastTick >= TICK_INTERVAL) {
      grid.tick();
      lastTick = timestamp;
    }
    renderer.render((timestamp - lastTick) / TICK_INTERVAL, timestamp);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener('resize', () => renderer.resize());

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !typingWord) {
    e.preventDefault();
    paused = !paused;
    if (!paused) lastTick = performance.now();
    pauseIndicator.style.opacity = paused ? '1' : '0';
    return;
  }

  if (e.code === 'Escape') {
    typingWord = '';
    renderer.typingText = '';
    return;
  }

  if (e.code === 'Enter' && typingWord) {
    e.preventDefault();
    placeTypedWord(typingWord);
    typingWord = '';
    renderer.typingText = '';
    return;
  }

  if (e.code === 'Backspace') {
    e.preventDefault();
    typingWord = typingWord.slice(0, -1);
    renderer.typingText = typingWord;
    return;
  }

  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    typingWord += e.key.toLowerCase();
    renderer.typingText = typingWord;
  }
});

function placeTypedWord(text) {
  const existing = CORPUS.find(w => w.text === text);
  const wordData = existing || {
    text,
    category: 'emergent',
    warmth: 0.3,
    weight: 0.3,
    syllables: Math.max(1, Math.ceil(text.length / 3))
  };

  for (let attempt = 0; attempt < 50; attempt++) {
    const x = Math.floor(Math.random() * grid.cols);
    const y = Math.floor(Math.random() * grid.rows);
    if (!grid.getWordAt(x, y)) {
      const word = grid.addWord(wordData, x, y);
      word.energy = 1.0;
      renderer.emitParticles(
        (x + 0.5) * renderer.cellW,
        (y + 0.5) * renderer.cellH,
        CATEGORY_HUES[wordData.category] || 40,
        12
      );
      return;
    }
  }
}

canvas.addEventListener('click', (e) => {
  const gx = Math.floor(e.clientX / renderer.cellW);
  const gy = Math.floor(e.clientY / renderer.cellH);
  if (!grid.inBounds(gx, gy)) return;

  const existing = grid.getWordAt(gx, gy);
  if (existing) {
    existing.energy = 1.0;
    renderer.emitParticles(
      (gx + 0.5) * renderer.cellW,
      (gy + 0.5) * renderer.cellH,
      CATEGORY_HUES[existing.category] || 40,
      10
    );
  } else {
    const wordData = getRandomWord();
    const word = grid.addWord(wordData, gx, gy);
    word.energy = 1.0;
    renderer.emitParticles(
      (gx + 0.5) * renderer.cellW,
      (gy + 0.5) * renderer.cellH,
      CATEGORY_HUES[word.category] || 40,
      10
    );
  }
});
