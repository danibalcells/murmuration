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

  const text = line.words.map(w => w.text).join(' ');
  addToStream('crystal', text);
};

grid.onDissolve = async ({ texts, centerX, centerY, categories }) => {
  renderer.emitParticles(
    (centerX + 0.5) * renderer.cellW,
    (centerY + 0.5) * renderer.cellH,
    40, 20
  );

  try {
    const res = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        words: texts,
        context: verseHistory,
        verseCount: totalVerseCount,
        categories
      })
    });

    if (!res.ok) return;
    const { verse, word: newWord } = await res.json();

    if (verse) {
      totalVerseCount++;
      verseHistory.push(verse);
      if (verseHistory.length > 20) verseHistory.shift();

      versesSinceBreak++;
      if (versesSinceBreak >= nextBreakAt) {
        addToStream('break');
        versesSinceBreak = 0;
        nextBreakAt = 5 + Math.floor(Math.random() * 3);
      }

      addToStream('verse', verse);
    }

    if (newWord && !grid.hasWordText(newWord)) {
      for (let r = 0; r <= 3; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const x = centerX + dx;
            const y = centerY + dy;
            if (grid.inBounds(x, y) && !grid.getWordAt(x, y)) {
              const wordData = {
                text: newWord,
                category: 'emergent',
                warmth: 0.2 + Math.random() * 0.4,
                weight: 0.2 + Math.random() * 0.3,
                syllables: Math.max(1, Math.ceil(newWord.length / 3)),
                sourceVerse: verse || texts.join(' \u00b7 '),
                fixed: true
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
    }
  } catch {
    // synthesis unavailable
  }
};

let paused = false;
let lastTickTime = performance.now();
const TICK_INTERVAL = 1500;
const pauseIndicator = document.getElementById('pause-indicator');
const poemsPanel = document.getElementById('poems-panel');
const poemsList = document.getElementById('poems-list');
const streamIndicator = document.getElementById('stream-indicator');
let poemsVisible = true;
let hasEverOpened = true;
const verseHistory = [];
let totalVerseCount = 0;
let versesSinceBreak = 0;
let nextBreakAt = 5 + Math.floor(Math.random() * 3);

function addToStream(type, text) {
  if (type === 'break') {
    const el = document.createElement('div');
    el.className = 'stream-break';
    poemsList.appendChild(el);
    return;
  }

  const el = document.createElement('div');
  el.className = type === 'verse' ? 'stream-verse' : 'stream-crystal';
  el.textContent = text;
  poemsList.appendChild(el);

  if (type === 'verse' && !poemsVisible) {
    streamIndicator.classList.add('pulse');
    setTimeout(() => streamIndicator.classList.remove('pulse'), 2000);
  }

  if (poemsVisible) {
    requestAnimationFrame(() => {
      poemsList.scrollTop = poemsList.scrollHeight;
    });
  }
}

function showPanel() {
  poemsVisible = true;
  hasEverOpened = true;
  poemsPanel.classList.add('visible');
  requestAnimationFrame(() => {
    poemsList.scrollTop = poemsList.scrollHeight;
  });
}

function hidePanel() {
  poemsVisible = false;
  poemsPanel.classList.remove('visible');
}

let typingWord = '';

setInterval(() => {
  if (!paused) {
    grid.tick();
    lastTickTime = performance.now();
  }
}, TICK_INTERVAL);

document.addEventListener('visibilitychange', () => {
  if (document.hidden || paused) return;
  const now = performance.now();
  const missed = Math.floor((now - lastTickTime) / TICK_INTERVAL);
  if (missed > 1) {
    const catchUp = Math.min(missed, 10);
    for (let i = 0; i < catchUp; i++) {
      grid.tick();
    }
    lastTickTime = now;
  }
});

function loop(timestamp) {
  if (!paused) {
    const t = Math.min((performance.now() - lastTickTime) / TICK_INTERVAL, 1);
    renderer.render(t, timestamp);
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener('resize', () => renderer.resize());

streamIndicator.addEventListener('click', () => {
  if (poemsVisible) hidePanel();
  else showPanel();
});

document.getElementById('poems-edge').addEventListener('click', () => {
  hidePanel();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'P' && e.shiftKey && !typingWord) {
    if (poemsVisible) hidePanel();
    else showPanel();
    return;
  }

  if (e.code === 'Space' && !typingWord) {
    e.preventDefault();
    paused = !paused;
    if (!paused) lastTickTime = performance.now();
    pauseIndicator.style.opacity = paused ? '1' : '0';
    return;
  }

  if (e.code === 'Escape') {
    if (poemsVisible) {
      hidePanel();
    }
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

canvas.addEventListener('mousemove', (e) => {
  renderer.mouseX = e.clientX;
  renderer.mouseY = e.clientY;
});
