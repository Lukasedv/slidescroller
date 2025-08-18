# SlideScroller - Roguelike 2D Game

A browser-based 2D roguelike game where players navigate through rooms that resemble presentation slides. Built with HTML5 Canvas and vanilla JavaScript.

## Features

### 🎮 Core Gameplay
- **Player Movement**: Move left/right with A/D keys, jump with W
- **Combat System**: Attack with Spacebar, featuring cooldown and range mechanics
- **Enemy System**: Fight against AI enemies that spawn from slide 2 onward
- **Health & Damage**: Health system with visual health bar
- **Room Transitions**: Seamless scrolling between connected rooms
- **Physics Engine**: Gravity, jumping, collision detection, and realistic interactions

### ⚔️ Combat Features
- **Punch Weapon**: Default melee combat with range and impact effects
- **Enemy AI**: Enemies with patrol movement patterns and randomized behavior
- **One-Hit Kills**: Enemies die in one hit for fast-paced combat
- **Knockback System**: Players bounce away dramatically when hit by enemies
- **Invincibility Frames**: 1-second invincibility period with visual flashing after taking damage
- **Hit Detection**: Precise collision detection for both dealing and receiving damage

### 📄 PDF Integration
- **Local File Upload**: Upload any PDF directly through the game interface
- **Automatic Detection**: Game automatically finds and loads PDF files from presentation folder
- **Password Support**: Works with encrypted/password-protected PDFs
- **Up to 100 Slides**: Supports presentations with up to 100 pages
- **High Quality Rendering**: PDF pages are converted to high-resolution images
- **Hot Reload**: Click "Reload PDF" button to refresh after changing PDFs

### 🛠️ Debug & Development
- **Debug Mode**: Press H to toggle hitbox visualization and game diagnostics
- **Visual Hitboxes**: See attack ranges and collision areas in debug mode
- **Real-time Info**: Debug overlay shows position, velocity, health, and game state
- **Console Logging**: Detailed console output for debugging combat and movement

### 🎨 Visual Design
- **PDF Slide Backgrounds**: Your presentation slides become the game environment
- **Health Visualization**: Color-coded health bar (green/orange/red)
- **Player Design**: Microsoft logo-themed character design
- **Enemy Variety**: Color-varied enemies with bobbing animations
- **Visual Effects**: Attack impacts, invincibility flashing, and smooth animations
- **Responsive Scaling**: Game automatically scales to fit any screen size

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
| H | Toggle Debug Mode |
| ESC | Pause Game |

## Getting Started

### Quick Start
1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. Start playing immediately - no build process or server required!

### Using Your Own PDF Presentation
1. Open the game in your browser
2. Click "Choose File" to select a PDF from your computer
3. Your PDF pages will become interactive game slides!
4. Navigate through slides using room transitions (move to screen edges)

### Supported PDF Features
- ✅ Direct file upload through browser interface
- ✅ Up to 100 pages/slides
- ✅ Password-protected PDFs
- ✅ Any PDF viewable in browsers
- ✅ Automatic page-to-room conversion
- ✅ High-quality image rendering

## Gameplay Tips

### Combat
- **Enemy Encounters**: Enemies spawn starting from slide 2
- **Hit and Run**: After taking damage, use the knockback to escape
- **Invincibility**: Use the 1-second invincibility window to reposition
- **Debug Mode**: Press H to see attack ranges and enemy hitboxes

### Navigation
- **Room Transitions**: Walk to the edges of the screen to move between slides
- **Jumping**: Use W to jump over enemies or reach higher areas
- **Slide Progression**: Each PDF page becomes a navigable room

## File Structure

```
slidescroller/
├── index.html          # Main HTML file
├── style.css           # Game styling and UI
├── presentation/       # Optional: place PDF files here for auto-detection
│   ├── README.md       # PDF setup instructions
│   └── instructions.html # Detailed PDF setup guide
├── js/
│   ├── game.js         # Main game loop and management
│   ├── player.js       # Player character logic and combat
│   ├── room.js         # Room system and transitions
│   ├── enemy.js        # Enemy AI and behavior system
│   ├── pdf-processor.js # PDF loading and conversion
│   ├── weapons.js      # Combat system and weapon mechanics
│   └── utils.js        # Utility classes and functions
└── .github/
    └── copilot-instructions.md
```

## Room System

The game features a connected series of rooms, each with:
- **Unique Slide Content**: PDF pages or placeholder content simulating presentation slides
- **Enemy Spawning**: Enemies appear starting from room 2 for combat encounters
- **Procedural Elements**: Generated based on room ID for consistent layouts
- **Seamless Transitions**: Smooth scrolling between adjacent rooms

## Planned Features

- 🤖 **Advanced Enemy Types**: Different enemy varieties with unique behaviors
- 🎒 **Inventory System**: Collectible items and power-ups
- 💾 **Save System**: Progress persistence across sessions
- 🔊 **Audio**: Sound effects and background music
- 🛠️ **Level Editor**: Custom room creation tools
- 📱 **Mobile Support**: Touch controls for mobile devices

## Development

This project uses vanilla JavaScript with no build dependencies. Simply edit the files and refresh your browser to see changes.

### Key Classes

- **`Game`**: Main game loop, rendering, debug mode, and state management
- **`Player`**: Character movement, combat, health, and physics
- **`Enemy`**: AI behavior, movement patterns, and collision detection
- **`EnemyManager`**: Handles multiple enemies per room
- **`RoomManager`**: Room transitions and slide content management
- **`WeaponManager`**: Combat system and weapon mechanics
- **`InputManager`**: Keyboard input handling with debouncing
- **`Vector2` / `Rectangle`**: Math utilities for positioning and collision

## Browser Compatibility

Requires a modern browser with HTML5 Canvas support:
- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 12+

---

**Note**: This is a fully-featured 2D game with combat, enemy AI, health systems, and PDF slide integration. All features work locally in your browser without requiring any server setup.
