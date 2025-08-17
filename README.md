# SlideScroller - Roguelike 2D Game

A browser-based 2D roguelike game where players navigate through rooms that resemble presentation slides. Built with HTML5 Canvas and vanilla JavaScript.

## Features

### 🎮 Core Gameplay
- **Player Movement**: Move left/right with A/D keys, jump with W
- **Combat System**: Attack with Spacebar, featuring cooldown and range mechanics
- **Room Transitions**: Seamless scrolling between connected rooms
- **Physics Engine**: Gravity, jumping, collision detection, and platform interactions

### 📄 PDF Integration (NEW!)
- **PDF Upload Support**: Place any PDF in the `/presentation/` folder to use as slide backgrounds
- **Automatic Detection**: Game automatically finds and loads PDF files
- **Password Support**: Works with encrypted/password-protected PDFs
- **Up to 100 Slides**: Supports presentations with up to 100 pages
- **High Quality Rendering**: PDF pages are converted to high-resolution images
- **Hot Reload**: Click "Reload PDF" button to refresh after changing PDFs

### 🎨 Visual Design
- **PDF Slide Backgrounds**: Your presentation slides become the game environment
- **Fullscreen Experience**: Game runs in fullscreen for immersive presentation viewing
- **Responsive Scaling**: Slides automatically scale to fit any screen size
- **Fallback Slides**: Built-in placeholder slides when no PDF is provided

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

### Quick Start
1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. Start playing immediately - no build process required!

### Using Your Own PDF Presentation
1. Save your PDF file in the `/presentation/` folder with one of these names:
   - `presentation.pdf` (recommended)
   - `slides.pdf`
   - `slide.pdf` 
   - `deck.pdf`
   - `talk.pdf`
2. Refresh the game or click the "Reload PDF" button
3. Your PDF pages will become interactive game slides!

### Supported PDF Features
- ✅ Up to 100 pages/slides
- ✅ Password-protected PDFs
- ✅ Any PDF viewable in browsers
- ✅ Automatic page-to-room conversion
- ✅ High-quality image rendering

## File Structure

```
slidescroller/
├── index.html          # Main HTML file
├── style.css           # Game styling and UI
├── presentation/       # Place your PDF files here
│   ├── README.md       # PDF upload instructions
│   └── instructions.html # Detailed PDF setup guide
├── js/
│   ├── game.js         # Main game loop and management
│   ├── player.js       # Player character logic
│   ├── room.js         # Room system and transitions
│   ├── pdf-processor.js # PDF loading and conversion
│   ├── weapons.js      # Combat system
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

- 🤖 **Enemy AI**: Combat encounters and boss fights
- 🎒 **Inventory System**: Collectible items and power-ups
- 💾 **Save System**: Progress persistence
- 🔊 **Audio**: Sound effects and background music
- 🛠️ **Level Editor**: Custom room creation tools
- 📱 **Mobile Support**: Touch controls for mobile devices

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
