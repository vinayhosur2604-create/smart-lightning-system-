/**
 * Smart Lighting System - Chart.js Energy Analytics
 */

const Charts = {
  instances: {},

  initAll() {
    this.initDailyChart();
    this.initWeeklyChart();
    this.initMonthlyChart();
    this.initBrightnessChart();
  },

  generateDailyData() {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
    const data = hours.map((_, i) => {
      // Simulate real usage pattern
      if (i >= 7 && i < 9) return +(Math.random() * 5 + 8).toFixed(2);      // morning
      if (i >= 9 && i < 17) return +(Math.random() * 2 + 1).toFixed(2);      // daytime low
      if (i >= 17 && i < 22) return +(Math.random() * 8 + 10).toFixed(2);    // evening peak
      if (i >= 22 || i < 6) return +(Math.random() * 3 + 2).toFixed(2);      // night
      return +(Math.random() * 2).toFixed(2);
    });
    return { labels: hours, data };
  },

  generateWeeklyData() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [48, 52, 45, 61, 55, 38, 42];
    return { labels: days, data };
  },

  generateMonthlyData() {
    const days = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
    const data = days.map(() => +(Math.random() * 30 + 30).toFixed(1));
    return { labels: days, data };
  },

  generateBrightnessData() {
    const hours = ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm','12am'];
    const data = [45, 30, 15, 10, 12, 25, 72, 85, 65, 30];
    return { labels: hours, data };
  },

  destroyIfExists(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  chartDefaults() {
    return {
      animation: { duration: 800, easing: 'easeOutQuart' },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a0aec0',
            font: { family: 'Outfit', size: 12 },
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10,15,46,0.95)',
          borderColor: 'rgba(0,212,255,0.3)',
          borderWidth: 1,
          titleColor: '#00d4ff',
          bodyColor: '#f0f4ff',
          padding: 12,
          cornerRadius: 10,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#4a5568', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#4a5568', font: { family: 'JetBrains Mono', size: 10 } }
        }
      }
    };
  },

  initDailyChart() {
    const canvas = document.getElementById('chart-daily');
    if (!canvas) return;
    this.destroyIfExists('daily');

    const { labels, data } = this.generateDailyData();
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

    this.instances['daily'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Power (W)',
          data,
          borderColor: '#00d4ff',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00d4ff',
          pointRadius: 3,
          pointHoverRadius: 6,
        }]
      },
      options: {
        ...this.chartDefaults(),
        plugins: {
          ...this.chartDefaults().plugins,
          title: { display: true, text: 'Today\'s Power Consumption (W)', color: '#a0aec0', font: { family: 'Outfit', size: 13 } }
        }
      }
    });
  },

  initWeeklyChart() {
    const canvas = document.getElementById('chart-weekly');
    if (!canvas) return;
    this.destroyIfExists('weekly');

    const { labels, data } = this.generateWeeklyData();
    const ctx = canvas.getContext('2d');

    const gradients = data.map((_, i) => {
      const g = ctx.createLinearGradient(0, 0, 0, 300);
      g.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
      g.addColorStop(1, 'rgba(0, 212, 255, 0.4)');
      return g;
    });

    this.instances['weekly'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Energy (Wh)',
          data,
          backgroundColor: gradients,
          borderColor: 'rgba(124, 58, 237, 0.8)',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        ...this.chartDefaults(),
        plugins: {
          ...this.chartDefaults().plugins,
          title: { display: true, text: 'Weekly Energy Usage (Wh)', color: '#a0aec0', font: { family: 'Outfit', size: 13 } }
        }
      }
    });
  },

  initMonthlyChart() {
    const canvas = document.getElementById('chart-monthly');
    if (!canvas) return;
    this.destroyIfExists('monthly');

    const { labels, data } = this.generateMonthlyData();
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
    gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

    this.instances['monthly'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Energy (Wh)',
          data,
          borderColor: '#a855f7',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#a855f7',
          pointRadius: 2,
          pointHoverRadius: 5,
        }]
      },
      options: {
        ...this.chartDefaults(),
        plugins: {
          ...this.chartDefaults().plugins,
          title: { display: true, text: 'Monthly Power Trend (Wh)', color: '#a0aec0', font: { family: 'Outfit', size: 13 } }
        }
      }
    });
  },

  initBrightnessChart() {
    const canvas = document.getElementById('chart-brightness');
    if (!canvas) return;
    this.destroyIfExists('brightness');

    const { labels, data } = this.generateBrightnessData();
    const ctx = canvas.getContext('2d');

    this.instances['brightness'] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Avg Brightness (%)',
          data,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 4,
        }]
      },
      options: {
        animation: { duration: 1000 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#a0aec0', font: { family: 'Outfit', size: 12 } } },
          tooltip: this.chartDefaults().plugins.tooltip,
          title: { display: true, text: 'Average Brightness by Time', color: '#a0aec0', font: { family: 'Outfit', size: 13 } }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#4a5568', backdropColor: 'transparent', font: { family: 'JetBrains Mono', size: 9 } },
            pointLabels: { color: '#a0aec0', font: { family: 'Outfit', size: 11 } },
            angleLines: { color: 'rgba(255,255,255,0.05)' },
          }
        }
      }
    });
  },

  refreshAll() {
    this.destroyIfExists('daily');
    this.destroyIfExists('weekly');
    this.destroyIfExists('monthly');
    this.destroyIfExists('brightness');
    setTimeout(() => this.initAll(), 100);
  }
};
