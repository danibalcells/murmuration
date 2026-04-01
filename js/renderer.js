import { CATEGORY_HUES } from './words.js';

export class Renderer {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = grid;
    this.particles = [];
    this.startTime = -1;
    this.typingText = '';
    this.mouseX = -1;
    this.mouseY = -1;
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
    gradient.addColorStop(0, '#16130e');
    gradient.addColorStop(1, '#0b0a07');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const t = this.easeInOutCubic(Math.min(tickProgress, 1));
    const fontSize = Math.max(15, Math.min(26, this.cellW * 0.24));
    const globalAlpha = Math.min(1, (timestamp - this.startTime) / 3000);

    let hoveredWord = null;

    for (const word of this.grid.words.values()) {
      const gx = word.prevGridX + (word.gridX - word.prevGridX) * t;
      const gy = word.prevGridY + (word.gridY - word.prevGridY) * t;

      let px = (gx + 0.5) * this.cellW;
      let py = (gy + 0.5) * this.cellH;

      if (!word.fixed) {
        px += Math.sin(timestamp * 0.0008 + word.id * 2.3) * 3;
        py += Math.cos(timestamp * 0.001 + word.id * 1.9) * 2;
      }

      if (this.mouseX >= 0) {
        const dist = Math.hypot(this.mouseX - px, this.mouseY - py);
        if (dist < this.cellW * 0.4) {
          hoveredWord = word;
        }
      }

      const isEmergent = word.category === 'emergent';
      const hue = CATEGORY_HUES[word.category] || 40;
      const breathe = 0.85 + 0.15 * Math.sin(timestamp * 0.002 + word.id * 1.7);

      if (word.createdAt < 0) word.createdAt = timestamp;
      const fadeIn = Math.min(1, (timestamp - word.createdAt) / 1500);

      const baseAlpha = isEmergent ? 0.6 : 0.4;
      const alpha = (baseAlpha + word.energy * (1 - baseAlpha)) * breathe * fadeIn * globalAlpha;
      const saturation = isEmergent ? 45 + word.energy * 30 : 30 + word.energy * 25;
      const lightness = isEmergent ? 60 + word.energy * 15 : 50 + word.energy * 20;

      const wordFontSize = isEmergent ? fontSize * 1.15 : fontSize;
      const useItalic = word.locked || isEmergent;
      ctx.font = `${useItalic ? 'italic ' : ''}300 ${wordFontSize}px 'Cormorant Garamond', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isEmergent) {
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowBlur = word.locked ? 15 : 8 * word.energy;
      }
      ctx.shadowColor = `hsla(${hue}, ${Math.round(saturation * 0.7)}%, ${lightness}%, ${alpha * 0.3})`;

      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fillText(word.text, px, py);

      ctx.shadowBlur = 0;
    }

    if (hoveredWord && hoveredWord.sourceVerse) {
      const hpx = (hoveredWord.gridX + 0.5) * this.cellW;
      const hpy = (hoveredWord.gridY + 0.5) * this.cellH - fontSize * 1.3;
      ctx.font = `300 italic ${fontSize * 0.6}px 'Cormorant Garamond', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.22 * globalAlpha})`;
      ctx.fillText(hoveredWord.sourceVerse, hpx, hpy);
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

      const hue = CATEGORY_HUES[first.category] || 40;
      ctx.strokeStyle = `hsla(${hue}, 40%, 55%, ${lineAlpha})`;
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
      ctx.fillStyle = `hsla(${p.hue}, 50%, 60%, ${p.life * 0.4 * globalAlpha})`;
      ctx.fill();
    }

    if (this.typingText) {
      const cursorVisible = Math.sin(timestamp * 0.004) > 0;
      const display = this.typingText + (cursorVisible ? '\u2502' : ' ');
      ctx.font = `300 18px 'Cormorant Garamond', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillText(display, w / 2, h - 40);
    }
  }
}
