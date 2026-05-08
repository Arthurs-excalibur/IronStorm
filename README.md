# IronStorm ⚔️

IronStorm is a high-performance 3D Action RPG prototype built with **Three.js** and **Vite**. It features a dynamic character system, specialized combat animations, and a procedural weapon rigging engine.

# Updates!
<img width="50%" alt="image" src="https://github.com/user-attachments/assets/46254319-7e01-4092-9c36-df575c96bb30" />
# Update 1
<img width="50%" alt="image" src="https://github.com/user-attachments/assets/2f496e0e-8448-47c9-a6e6-20c9462df7a8" />
# Update 2
<img width="50%" alt="image" src="https://github.com/user-attachments/assets/bcb7a3d8-20d4-4763-89e0-56ff0c8a5846" />
# Update 3

## 🚀 Recent Progress: The Skeleton Horde Update
We have just completed a major overhaul of the combat and enemy systems, transforming the prototype into a reactive, high-feedback gaming experience.

### 💀 New Modular Enemy System
- **Divergent AI Archetypes**: 
  - **Warrior**: Aggressive melee chase behavior.
  - **Mage**: Tactical ranged caster that maintains distance.
  - **Rogue**: Fast-moving kiting specialist that fires crossbows while retreating.
- **Steering & Separation**: Enemies now utilize separation forces to prevent clumping, ensuring clear battlefield readability.
- **Native Weaponry**: Full integration of the KayKit Skeleton asset pack, including unique Axes, Staves, Blades, and Crossbows.

### 🔥 Combat "Juice" & Mechanics
- **Phase-Based Combat**: Implemented a robust state machine with **Anticipation (Windup)**, **Execution**, and **Recovery** phases for all entities.
- **Visual Telegraphing**: Enemies now vibrate and pulse during attack windups, providing clear visual cues for player reaction.
- **Physical Feedback**: Added knockback impulses, hit-stagger animations, and stylized squash-and-stretch on impact.
- **Visual FX**: Custom stylized magic orbs, muzzle flashes, and gravity-affected impact sparks.

## ✨ Core Features

- **Dynamic Character System**: Swap between different classes (Barbarian, Knight, Mage, Ranger, Rogue) with unique stats and equipment.
- **High-Quality Animations**: Integrated KayKit Character Animations for melee, ranged, and magic combat.
- **Precision Rigging**: Custom bone-resolution system that procedurally attaches weapon assets to character skeletons.
- **Tactile Combat**:
  - **Attack Locking**: Movement is locked during attack motions for a weightier feel.
  - **Procedural Weapon Motion**: Secondary motion applied to weapons during swings and shots.
  - **Seamless Transitions**: Smooth cross-fading between movement and combat states.

## 🛠️ Tech Stack

- **Core**: Three.js (WebGL)
- **Bundler**: Vite
- **Assets**: KayKit Skeletons, Adventurers & Character Animations (CC0)

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Arthurs-excalibur/IronStorm.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 📜 Credits

- **3D Assets**: [Kay Lousberg](https://kaylousberg.com/)
- **Engine**: [Three.js](https://threejs.org/)

---
Created with ❤️ by Arthurs-excalibur
