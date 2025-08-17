# SlideScroller - Roguelike 2D Game

A browser-based 2D roguelike game where players navigate through rooms that resemble presentation slides. Built with HTML5 Canvas and vanilla JavaScript.

## Features

### 🎮 Core Gameplay
- **Player Movement**: Move left/right with A/D keys, jump with W
- **Combat System**: Attack with Spacebar, featuring cooldown and range mechanics
- **Room Transitions**: Seamless scrolling between connected rooms
- **Physics Engine**: Gravity, jumping, collision detection, and platform interactions

### 🎨 Visual Design
- **Slide Backgrounds**: Each room displays unique content like presentation slides
- **Procedural Platforms**: Dynamically generated platforms per room
- **Debug Overlay**: Real-time game state information
- **Health System**: Visual health bar with damage tracking

### 🏗️ Technical Architecture
- **Modular Classes**: Separate systems for Player, Rooms, Input, and Game management
- **Entity System**: Rectangle-based collision detection with Vector2 math
- **60fps Game Loop**: Smooth deltaTime-based updates
- **Event-driven Input**: Responsive key handling with state tracking

## Controls

| Key | Action |
|-----|--------|
| A / ← | Move Left |
| D / → | Move Right |
| W / ↑ | Jump |
| Space | Attack |
| ESC | Pause Game |

## Getting Started

1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. Start playing immediately - no build process required!

## File Structure

```
slidescroller/
├── index.html          # Main HTML file
├── style.css           # Game styling and UI
├── js/
│   ├── game.js         # Main game loop and management
│   ├── player.js       # Player character logic
│   ├── room.js         # Room system and transitions
│   └── utils.js        # Utility classes and functions
└── .github/
    └── copilot-instructions.md
```

## Room System

The game features a connected series of rooms, each with:
- **Unique Slide Content**: Placeholder text simulating presentation slides
- **Color-coded Backgrounds**: Visual distinction between rooms
- **Procedural Platforms**: Generated based on room ID for consistent layouts
- **Seamless Transitions**: Smooth scrolling between adjacent rooms

## Planned Features

- 📄 **PDF Import**: Upload presentation slides as room backgrounds
- 🤖 **Enemy AI**: Combat encounters and boss fights
- 🎒 **Inventory System**: Collectible items and power-ups
- 💾 **Save System**: Progress persistence
- 🔊 **Audio**: Sound effects and background music
- 🛠️ **Level Editor**: Custom room creation tools

## Development

This project uses vanilla JavaScript with no build dependencies. Simply edit the files and refresh your browser to see changes.

### Key Classes

- **`Game`**: Main game loop, rendering, and state management
- **`Player`**: Character movement, combat, and physics
- **`RoomManager`**: Room transitions and slide content
- **`InputManager`**: Keyboard input handling
- **`Vector2` / `Rectangle`**: Math utilities for positioning and collision

## Browser Compatibility

Requires a modern browser with HTML5 Canvas support:
- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 12+

---

**Note**: This is the initial implementation focusing on core mechanics and room transitions. PDF slide import functionality will be added in future updates.
