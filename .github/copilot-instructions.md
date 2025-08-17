<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SlideScroller Game - Copilot Instructions

This is a 2D roguelike game built with HTML5 Canvas and JavaScript. The game features:

## Core Mechanics
- **Player Movement**: WASD or arrow keys for movement, with physics-based jumping and gravity
- **Combat System**: Space bar for attacks with cooldown and range detection
- **Room Transitions**: Seamless scrolling between rooms when reaching screen edges

## Architecture
- **Modular Design**: Separate classes for Player, Room, RoomManager, and Game systems
- **Entity System**: Rectangle-based collision detection and Vector2 math utilities
- **Input Management**: Centralized input handling with key state tracking

## Key Features
- **Slide Backgrounds**: Each room displays content like presentation slides
- **Physics Engine**: Custom gravity, jumping, and collision detection
- **Room Generation**: Procedural platform generation per room
- **Debug Information**: Real-time debug overlay showing game state

## Code Style Guidelines
- Use ES6 classes and modern JavaScript features
- Maintain consistent naming conventions (camelCase)
- Keep game loop at 60fps with deltaTime-based updates
- Use Vector2 and Rectangle utility classes for positioning and collision
- Implement proper separation of concerns between game systems

## Future Features to Consider
- PDF slide import functionality
- Enemy AI and combat
- Item collection system
- Save/load game state
- Sound effects and music
- Level editor

When making changes, ensure compatibility with the existing physics and room transition systems.
