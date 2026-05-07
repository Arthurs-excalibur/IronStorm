export class PlayerHealth {
  constructor(maxHealth = 100) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.isDead = false;
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 0.5; // seconds
    this.invulnerabilityTimer = 0;
    
    this.onDamage = null;
    this.onHeal = null;
    this.onDeath = null;
    this.onHealthChange = null; // General callback for any health change
  }

  takeDamage(amount) {
    if (this.isDead || this.isInvulnerable) return;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    
    // Start invulnerability window
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;

    if (this.onDamage) this.onDamage(amount);
    if (this.onHealthChange) this.onHealthChange(this.currentHealth, this.maxHealth);

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  heal(amount) {
    if (this.isDead) return;

    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    
    if (this.onHeal) this.onHeal(amount);
    if (this.onHealthChange) this.onHealthChange(this.currentHealth, this.maxHealth);
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.onDeath) this.onDeath();
  }

  update(delta) {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }

  getHealthRatio() {
    return this.currentHealth / this.maxHealth;
  }
}
