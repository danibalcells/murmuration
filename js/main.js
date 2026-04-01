import { Grid } from './grid.js';
import { Renderer } from './renderer.js';
import { CATEGORY_HUES, getRandomWord } from './words.js';

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
    renderer.emitParticles(px, py, CATEGORY_HUES[word.category] || 0, 8);
  }
};

grid.onDissolve = (line) => {
  for (const word of line.words) {
    const px = (word.gridX + 0.5) * renderer.cellW;
    const py = (word.gridY + 0.5) * renderer.cellH;
    renderer.emitParticles(px, py, CATEGORY_HUES[word.category] || 0, 5);
  }
};

let paused = false;
let lastTick = 0;
const TICK_INTERVAL = 1500;
const pauseIndicator = document.getElementById('pause-indicator');

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
  if (e.code === 'Space') {
    e.preventDefault();
    paused = !paused;
    if (!paused) lastTick = performance.now();
    pauseIndicator.style.opacity = paused ? '1' : '0';
  }
});

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
      CATEGORY_HUES[existing.category] || 0,
      10
    );
  } else {
    const wordData = getRandomWord();
    const word = grid.addWord(wordData, gx, gy);
    word.energy = 1.0;
    renderer.emitParticles(
      (gx + 0.5) * renderer.cellW,
      (gy + 0.5) * renderer.cellH,
      CATEGORY_HUES[word.category] || 0,
      10
    );
  }
});
