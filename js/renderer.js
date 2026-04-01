import { CATEGORY_HUES } from './words.js';

export class Renderer {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = grid;
    this.particles = [];
    this.startTime = -1;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cellW = window.innerWidth / this.grid.cols;
    this.cellH = window.innerHeight / this.grid.rows;
  }

  emitParticles(x, y, hue, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02,
        size: 1 + Math.random() * 2
      });
    }
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  render(tickProgress, timestamp) {
    if (this.startTime < 0) this.startTime = timestamp;

    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    gradient.addColorStop(0, '#0d0d1f');
    gradient.addColorStop(1, '#06060f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const t = this.easeInOutCubic(Math.min(tickProgress, 1));
    const fontSize = Math.max(14, Math.min(22, this.cellW * 0.2));
    const globalAlpha = Math.min(1, (timestamp - this.startTime) / 3000);

    for (const word of this.grid.words.values()) {
      const gx = word.prevGridX + (word.gridX - word.prevGridX) * t;
      const gy = word.prevGridY + (word.gridY - word.prevGridY) * t;

      let px = (gx + 0.5) * this.cellW;
      let py = (gy + 0.5) * this.cellH;

      px += Math.sin(timestamp * 0.0008 + word.id * 2.3) * 3;
      py += Math.cos(timestamp * 0.001 + word.id * 1.9) * 2;

      const hue = CATEGORY_HUES[word.category] || 0;
      const breathe = 0.85 + 0.15 * Math.sin(timestamp * 0.002 + word.id * 1.7);

      if (word.createdAt < 0) word.createdAt = timestamp;
      const fadeIn = Math.min(1, (timestamp - word.createdAt) / 1500);

      const alpha = (0.4 + word.energy * 0.6) * breathe * fadeIn * globalAlpha;
      const saturation = 50 + word.energy * 40;
      const lightness = 55 + word.energy * 20;

      ctx.font = `${word.locked ? 'italic ' : ''}300 ${fontSize}px 'Cormorant Garamond', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowBlur = word.locked ? 25 : 12 * word.energy;
      ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.5})`;

      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fillText(word.text, px, py);

      ctx.shadowBlur = 0;
    }

    for (const line of this.grid.lines.values()) {
      if (line.words.length < 2) continue;

      const first = line.words[0];
      const last = line.words[line.words.length - 1];
      const startX = (first.gridX + 0.15) * this.cellW;
      const endX = (last.gridX + 0.85) * this.cellW;
      const y = (first.gridY + 0.5) * this.cellH + fontSize * 0.7;

      const grow = Math.min(1, line.age / 5);
      const decay = line.age > line.lifetime - 5 ? (line.lifetime - line.age) / 5 : 1;
      const lineAlpha = 0.12 * grow * Math.max(0, decay) * globalAlpha;

      const hue = CATEGORY_HUES[first.category] || 0;
      ctx.strokeStyle = `hsla(${hue}, 50%, 60%, ${lineAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.life * 0.6 * globalAlpha})`;
      ctx.fill();
    }
  }
}
