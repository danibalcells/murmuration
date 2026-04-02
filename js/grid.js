import { CORPUS, CATEGORY_HUES, getAffinity, getRandomWord, scorePoetryRun } from './words.js';

let nextId = 1;

export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Array(cols * rows).fill(null);
    this.words = new Map();
    this.lines = new Map();
    this.nextLineId = 1;
    this.onCrystallize = null;
    this.onDissolve = null;
  }

  init(density = 0.2) {
    const totalCells = this.cols * this.rows;
    const targetCount = Math.floor(totalCells * density);
    const categories = Object.keys(CATEGORY_HUES).filter(c => c !== 'emergent');

    const clusterCount = 4 + Math.floor(Math.random() * 3);
    const clusters = [];
    for (let i = 0; i < clusterCount; i++) {
      clusters.push({
        x: 1 + Math.floor(Math.random() * (this.cols - 2)),
        y: 1 + Math.floor(Math.random() * (this.rows - 2)),
        category: categories[Math.floor(Math.random() * categories.length)]
      });
    }

    let placed = 0;
    for (const cluster of clusters) {
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count && placed < targetCount; i++) {
        const ox = Math.floor((Math.random() - 0.5) * 5);
        const oy = Math.floor((Math.random() - 0.5) * 5);
        const x = Math.max(0, Math.min(this.cols - 1, cluster.x + ox));
        const y = Math.max(0, Math.min(this.rows - 1, cluster.y + oy));
        if (!this.getWordAt(x, y)) {
          const candidates = CORPUS.filter(w => w.category === cluster.category);
          const wordData = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : getRandomWord();
          this.addWord(wordData, x, y);
          placed++;
        }
      }
    }

    while (placed < targetCount) {
      const x = Math.floor(Math.random() * this.cols);
      const y = Math.floor(Math.random() * this.rows);
      if (!this.getWordAt(x, y)) {
        this.addWord(getRandomWord(), x, y);
        placed++;
      }
    }
  }

  idx(x, y) {
    return y * this.cols + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  getWordAt(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.cells[this.idx(x, y)];
  }

  addWord(wordData, x, y) {
    const word = {
      id: nextId++,
      text: wordData.text,
      category: wordData.category,
      warmth: wordData.warmth,
      weight: wordData.weight,
      syllables: wordData.syllables,
      gridX: x,
      gridY: y,
      prevGridX: x,
      prevGridY: y,
      energy: 0.5 + Math.random() * 0.5,
      age: 0,
      locked: false,
      lineId: null,
      createdAt: -1,
      fixed: wordData.fixed || false,
      sourceVerse: wordData.sourceVerse || null
    };
    this.cells[this.idx(x, y)] = word;
    this.words.set(word.id, word);
    return word;
  }

  removeWord(word) {
    this.cells[this.idx(word.gridX, word.gridY)] = null;
    this.words.delete(word.id);
  }

  hasWordText(text) {
    for (const w of this.words.values()) {
      if (w.text === text) return true;
    }
    return false;
  }

  moveWord(word, newX, newY) {
    this.cells[this.idx(word.gridX, word.gridY)] = null;
    word.prevGridX = word.gridX;
    word.prevGridY = word.gridY;
    word.gridX = newX;
    word.gridY = newY;
    this.cells[this.idx(newX, newY)] = word;
  }

  getNeighborWords(x, y, radius) {
    const neighbors = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const w = this.getWordAt(x + dx, y + dy);
        if (w) neighbors.push(w);
      }
    }
    return neighbors;
  }

  tick() {
    const allWords = [...this.words.values()];

    for (const word of allWords) {
      word.prevGridX = word.gridX;
      word.prevGridY = word.gridY;
    }

    for (const word of allWords) {
      word.age++;
      const neighbors = this.getNeighborWords(word.gridX, word.gridY, 2);
      word.energy += neighbors.length * 0.008;
      if (!word.fixed) word.energy -= 0.015;
      word.energy = Math.max(word.fixed ? 0.6 : 0, Math.min(1, word.energy));
    }

    for (const word of allWords) {
      if (word.energy <= 0 && !word.locked && !word.fixed) {
        this.removeWord(word);
      }
    }

    const movable = [...this.words.values()].filter(w => !w.locked && !w.fixed);
    for (let i = movable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movable[i], movable[j]] = [movable[j], movable[i]];
    }

    for (const word of movable) {
      const neighbors = this.getNeighborWords(word.gridX, word.gridY, 3);
      let fx = 0, fy = 0;

      for (const other of neighbors) {
        const affinity = getAffinity(word, other);
        const dx = other.gridX - word.gridX;
        const dy = other.gridY - word.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1.5 && affinity < 0.5) {
          fx -= dx * 0.2;
          fy -= dy * 0.2;
        } else if (dist > 0) {
          fx += (dx / dist) * affinity / dist;
          fy += (dy / dist) * affinity / dist;
        }
      }

      fx += (Math.random() - 0.5) * 0.4;
      fy += (Math.random() - 0.5) * 0.4;
      fy += word.weight * 0.05;

      if (Math.sqrt(fx * fx + fy * fy) > 0.25) {
        const tx = Math.max(0, Math.min(this.cols - 1, word.gridX + Math.sign(fx)));
        const ty = Math.max(0, Math.min(this.rows - 1, word.gridY + Math.sign(fy)));

        if (!this.getWordAt(tx, ty)) {
          this.moveWord(word, tx, ty);
        } else if (tx !== word.gridX && this.inBounds(tx, word.gridY) && !this.getWordAt(tx, word.gridY)) {
          this.moveWord(word, tx, word.gridY);
        } else if (ty !== word.gridY && this.inBounds(word.gridX, ty) && !this.getWordAt(word.gridX, ty)) {
          this.moveWord(word, word.gridX, ty);
        }
      }
    }

    for (let y = 0; y < this.rows; y++) {
      let run = [];
      for (let x = 0; x < this.cols; x++) {
        const word = this.getWordAt(x, y);
        if (word && !word.locked) {
          run.push(word);
        } else {
          this.tryCrystallize(run);
          run = [];
        }
      }
      this.tryCrystallize(run);
    }

    for (const [lineId, line] of this.lines) {
      line.age++;
      if (line.age > line.lifetime) {
        const texts = line.words.map(w => w.text);
        const categories = [...new Set(line.words.map(w => w.category))];
        const centerX = Math.round(
          line.words.reduce((s, w) => s + w.gridX, 0) / line.words.length
        );
        const centerY = line.words[0].gridY;

        for (const word of line.words) {
          if (word.fixed) {
            word.locked = false;
            word.lineId = null;
          } else {
            this.removeWord(word);
          }
        }

        this.lines.delete(lineId);
        if (this.onDissolve) this.onDissolve({ texts, centerX, centerY, categories });
      }
    }

    const targetCount = Math.floor(this.cols * this.rows * 0.18);
    if (this.words.size < targetCount) {
      const attempts = Math.min(3, targetCount - this.words.size);
      for (let i = 0; i < attempts; i++) {
        const x = Math.floor(Math.random() * this.cols);
        const y = Math.floor(Math.random() * this.rows);
        if (!this.getWordAt(x, y)) {
          const neighbors = this.getNeighborWords(x, y, 2);
          const nearbyTexts = new Set(neighbors.map(n => n.text));
          let wordData;
          if (neighbors.length > 0 && Math.random() < 0.6) {
            const cat = neighbors[Math.floor(Math.random() * neighbors.length)].category;
            const candidates = CORPUS.filter(w => w.category === cat && !nearbyTexts.has(w.text));
            wordData = candidates[Math.floor(Math.random() * candidates.length)] || getRandomWord();
          } else {
            const candidates = CORPUS.filter(w => !nearbyTexts.has(w.text));
            wordData = candidates[Math.floor(Math.random() * candidates.length)] || getRandomWord();
          }
          this.addWord(wordData, x, y);
        }
      }
    }
  }

  tryCrystallize(run) {
    if (run.length < 3 || run.length > 7) return;
    const categories = new Set(run.map(w => w.category));
    if (categories.size < 2) return;
    const uniqueTexts = new Set(run.map(w => w.text));
    if (uniqueTexts.size < run.length) return;

    const quality = scorePoetryRun(run);
    const probability = 0.03 + quality * 0.27;
    if (Math.random() > probability) return;

    const lineId = this.nextLineId++;
    const line = {
      id: lineId,
      words: [...run],
      quality,
      age: 0,
      lifetime: 20 + Math.floor(Math.random() * 20)
    };

    for (const word of run) {
      word.locked = true;
      word.lineId = lineId;
      word.energy = 1.0;
    }

    this.lines.set(lineId, line);
    if (this.onCrystallize) this.onCrystallize(line);
  }
}
