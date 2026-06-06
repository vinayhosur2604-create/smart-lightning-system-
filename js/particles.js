/**
 * Smart Lighting System - Particle Background Engine
 */

const Particles = {
  canvas: null,
  ctx: null,
  particles: [],
  animFrame: null,
  count: 80,

  init() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createParticles();
    this.animate();

    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this.newParticle());
    }
  },

  newParticle() {
    const colors = [
      'rgba(0, 212, 255,',   // cyan
      'rgba(124, 58, 237,',  // purple
      'rgba(168, 85, 247,',  // violet
      'rgba(236, 72, 153,',  // pink
      'rgba(16, 185, 129,',  // green
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      color,
      opacity: Math.random() * 0.5 + 0.1,
      opacityDelta: (Math.random() * 0.01 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
      connections: [],
    };
  },

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Move particles
    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.opacity += p.opacityDelta;

      if (p.opacity <= 0.05 || p.opacity >= 0.6) p.opacityDelta *= -1;
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
    });

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (dist < 120) {
          const opacity = (1 - dist / 120) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${p.opacity})`;
      this.ctx.fill();

      // Glow effect on larger particles
      if (p.size > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `${p.color}${p.opacity * 0.1})`;
        this.ctx.fill();
      }
    });

    this.animFrame = requestAnimationFrame(() => this.animate());
  },

  setPartyMode(active) {
    if (active) {
      // More colorful, faster particles for party
      this.particles.forEach(p => {
        p.speedX *= 3;
        p.speedY *= 3;
      });
    } else {
      this.particles.forEach(p => {
        p.speedX /= 3;
        p.speedY /= 3;
      });
    }
  }
};
