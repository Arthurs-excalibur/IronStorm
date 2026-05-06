import * as THREE from 'three';

export class PlayerAnimation {
  constructor(mixer, clips) {
    this.mixer = mixer;
    this.actions = new Map();
    this.currentAction = null;
    this.lockedAction = null;
    this.resumeActionName = 'idle';

    for (const clip of clips) {
      this.actions.set(clip.name.toLowerCase(), mixer.clipAction(clip));
    }
  }

  play(name, fadeDuration = 0.18) {
    if (this.lockedAction) {
      this.resumeActionName = name.toLowerCase();
      return;
    }

    const nextAction = this.actions.get(name.toLowerCase());
    if (!nextAction || nextAction === this.currentAction) {
      return;
    }

    nextAction.reset().fadeIn(fadeDuration).play();

    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration);
    }

    this.currentAction = nextAction;
  }

  playOnce(name, onComplete) {
    const action = this.actions.get(name.toLowerCase());
    if (!action) return;

    const previousActionName = this.currentAction ? this.getClipName(this.currentAction.getClip()) : 'idle';
    this.resumeActionName = previousActionName || 'idle';
    this.lockedAction = action;

    const onFinished = (e) => {
      if (e.action === action) {
        this.mixer.removeEventListener('finished', onFinished);
        this.lockedAction = null;
        if (onComplete) onComplete();
        this.play(this.resumeActionName, 0.2);
      }
    };

    this.mixer.addEventListener('finished', onFinished);

    action.reset();
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;

    if (this.currentAction && this.currentAction !== action) {
      action.crossFadeFrom(this.currentAction, 0.1, true);
    }

    action.play();
    this.currentAction = action;
  }

  getClipName(clip) {
    for (const [name, action] of this.actions) {
      if (action.getClip() === clip) return name;
    }
    return '';
  }

  update(delta) {
    this.mixer.update(delta);
  }

  has(name) {
    return this.actions.has(name.toLowerCase());
  }

  getCurrentActionDuration() {
    return this.currentAction?.getClip().duration ?? 0;
  }

  getNormalizedTime() {
    if (!this.currentAction) return 0;
    return this.currentAction.time / this.currentAction.getClip().duration;
  }
}
