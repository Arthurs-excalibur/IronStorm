export class GameLoop {
  constructor(clock, update) {
    this.clock = clock;
    this.update = update;
    this.frameId = null;
    this.tick = this.tick.bind(this);
  }

  start() {
    this.clock.start();
    this.frameId = requestAnimationFrame(this.tick);
  }

  tick() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.frameId = requestAnimationFrame(this.tick);
  }
}
