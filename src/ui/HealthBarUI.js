export class HealthBarUI {
  constructor() {
    this.container = null;
    this.fill = null;
    this.delayedFill = null;
    this.text = null;
    this.init();
  }

  init() {
    // Create UI container if it doesn't exist
    let uiLayer = document.getElementById('ui-layer');
    if (!uiLayer) {
      uiLayer = document.createElement('div');
      uiLayer.id = 'ui-layer';
      document.body.appendChild(uiLayer);
    }

    // Health Bar Container
    this.container = document.createElement('div');
    this.container.id = 'player-health-bar';
    this.container.className = 'health-bar-container';
    
    // Background
    const bg = document.createElement('div');
    bg.className = 'health-bar-bg';
    
    // Delayed Fill (for that "catch-up" effect)
    this.delayedFill = document.createElement('div');
    this.delayedFill.className = 'health-bar-delayed-fill';
    
    // Actual Fill
    this.fill = document.createElement('div');
    this.fill.className = 'health-bar-fill';
    
    // Health Text
    this.text = document.createElement('div');
    this.text.className = 'health-bar-text';
    this.text.innerText = '100 / 100';

    this.container.appendChild(bg);
    this.container.appendChild(this.delayedFill);
    this.container.appendChild(this.fill);
    this.container.appendChild(this.text);
    uiLayer.appendChild(this.container);

    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('health-bar-styles')) return;

    const style = document.createElement('style');
    style.id = 'health-bar-styles';
    style.innerHTML = `
      .health-bar-container {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 450px;
        height: 28px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        overflow: visible;
        z-index: 1000;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease;
      }

      .health-bar-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #111;
        border-radius: 4px;
      }

      .health-bar-delayed-fill {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        opacity: 0.3;
        border-radius: 4px;
      }

      .health-bar-fill {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #2ecc71 0%, #27ae60 100%);
        box-shadow: 0 0 15px rgba(46, 204, 113, 0.4);
        transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s ease;
        border-radius: 4px;
      }

      .health-bar-container.low-health .health-bar-fill {
        background: linear-gradient(90deg, #e63946 0%, #ff4d6d 100%);
        box-shadow: 0 0 20px rgba(230, 57, 70, 0.6);
        animation: health-pulse 1s infinite cubic-bezier(0.4, 0, 0.6, 1);
      }

      @keyframes health-pulse {
        0%, 100% { filter: brightness(1); transform: scaleY(1); }
        50% { filter: brightness(1.3) saturate(1.2); transform: scaleY(1.1); }
      }

      .health-bar-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Inter', 'Roboto', sans-serif;
        font-size: 13px;
        font-weight: 800;
        color: white;
        text-shadow: 0 1px 3px rgba(0,0,0,1);
        letter-spacing: 2px;
        text-transform: uppercase;
        pointer-events: none;
        white-space: nowrap;
      }

      .health-bar-container.dead {
        transform: translate(-50%, 40px);
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  update(current, max) {
    const ratio = Math.max(0, Math.min(1, current / max));
    const percentage = ratio * 100;
    
    this.fill.style.width = `${percentage}%`;
    this.delayedFill.style.width = `${percentage}%`;
    this.text.innerText = `${Math.ceil(current)} / ${max}`;
    
    // Add a little punch effect on damage
    this.container.style.transform = 'translateX(-50%) scale(1.02)';
    setTimeout(() => {
      this.container.style.transform = 'translateX(-50%) scale(1)';
    }, 100);

    if (current <= 0) {
      this.container.classList.add('dead');
    } else {
      this.container.classList.remove('dead');
    }

    if (current > 0 && current <= 20) {
      this.container.classList.add('low-health');
    } else {
      this.container.classList.remove('low-health');
    }
  }

  setDead(isDead) {
    if (isDead) {
      this.container.classList.add('dead');
    } else {
      this.container.classList.remove('dead');
    }
  }
}
