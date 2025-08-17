class Room {
    constructor(id, slideContent, backgroundColor = '#2a2a2a') {
        this.id = id;
        this.slideContent = slideContent;
        this.backgroundColor = backgroundColor;
        this.platforms = [];
        this.enemies = [];
        this.items = [];
        this.leftTransition = null;
        this.rightTransition = null;
        
        // Generate some basic platforms for each room
        this.generatePlatforms();
    }

    generatePlatforms() {
        // Ground platform
        this.platforms.push(new Platform(0, 750, 1200, 50));
        
        // Generate some random platforms based on room ID
        const seed = this.id;
        const numPlatforms = 3 + (seed % 3);
        
        for (let i = 0; i < numPlatforms; i++) {
            const x = 100 + (i * 250) + ((seed * 7) % 100);
            const y = 500 - ((seed * 13 + i * 17) % 200);
            const width = 150 + ((seed * 11 + i * 19) % 100);
            
            this.platforms.push(new Platform(x, y, width, 20));
        }
        
        // Add some wall platforms for room boundaries
        this.platforms.push(new Platform(-10, 0, 10, 800)); // Left wall
        this.platforms.push(new Platform(1200, 0, 10, 800)); // Right wall
    }

    update(deltaTime) {
        // Update enemies, items, etc.
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.items.forEach(item => item.update(deltaTime));
    }

    render(ctx) {
        // Clear and set background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, 1200, 800);
        
        // Render slide content as background
        this.renderSlideBackground(ctx);
        
        // Render platforms
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        
        this.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Render enemies and items
        this.enemies.forEach(enemy => enemy.render(ctx));
        this.items.forEach(item => item.render(ctx));
    }

    renderSlideBackground(ctx) {
        // Render slide content as a large background text
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.slideContent, 600, 400);
        
        // Add some decorative elements to simulate a slide
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, 1100, 700);
        
        ctx.font = '24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'left';
        ctx.fillText(`Room ${this.id} - ${this.slideContent}`, 70, 100);
        
        ctx.restore();
    }

    checkCollisions(rect) {
        const collisions = [];
        this.platforms.forEach(platform => {
            if (rect.intersects(platform.getRect())) {
                collisions.push(platform);
            }
        });
        return collisions;
    }

    getTransitionRoom(direction) {
        if (direction === 'left') return this.leftTransition;
        if (direction === 'right') return this.rightTransition;
        return null;
    }

    setTransitions(leftRoom, rightRoom) {
        this.leftTransition = leftRoom;
        this.rightTransition = rightRoom;
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getRect() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
}

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.currentRoom = null;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionSpeed = 2.0;
        this.transitionDirection = null;
        this.nextRoom = null;
        
        this.generateRooms();
    }

    generateRooms() {
        // Create a series of connected rooms with slide-like content
        const slideContents = [
            "Welcome Slide",
            "Game Mechanics",
            "Player Movement",
            "Combat System",
            "Room Transitions",
            "Boss Fight",
            "Victory Screen"
        ];

        const colors = [
            '#2a4a6b',  // Blue
            '#6b2a4a',  // Red
            '#4a6b2a',  // Green
            '#6b4a2a',  // Brown
            '#4a2a6b',  // Purple
            '#6b6b2a',  // Olive
            '#2a6b6b'   // Teal
        ];

        for (let i = 0; i < slideContents.length; i++) {
            const room = new Room(i + 1, slideContents[i], colors[i % colors.length]);
            this.rooms.set(i + 1, room);
        }

        // Set up room transitions
        for (let i = 1; i <= slideContents.length; i++) {
            const room = this.rooms.get(i);
            const leftRoom = i > 1 ? i - 1 : null;
            const rightRoom = i < slideContents.length ? i + 1 : null;
            room.setTransitions(leftRoom, rightRoom);
        }

        // Start in the first room
        this.currentRoom = this.rooms.get(1);
    }

    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionProgress += this.transitionSpeed * deltaTime;
            
            if (this.transitionProgress >= 1.0) {
                this.completeTransition();
            }
        }
        
        if (this.currentRoom) {
            this.currentRoom.update(deltaTime);
        }
    }

    render(ctx) {
        if (this.isTransitioning && this.nextRoom) {
            this.renderTransition(ctx);
        } else if (this.currentRoom) {
            this.currentRoom.render(ctx);
        }
    }

    renderTransition(ctx) {
        const progress = this.transitionProgress;
        const offset = this.transitionDirection === 'right' ? 
            -1200 * progress : 1200 * progress;
        
        ctx.save();
        
        // Render current room
        ctx.translate(offset, 0);
        this.currentRoom.render(ctx);
        
        // Render next room
        const nextOffset = this.transitionDirection === 'right' ? 
            1200 : -1200;
        ctx.translate(nextOffset, 0);
        this.nextRoom.render(ctx);
        
        ctx.restore();
    }

    startTransition(direction, player) {
        if (this.isTransitioning) return false;
        
        const nextRoomId = this.currentRoom.getTransitionRoom(direction);
        if (!nextRoomId) return false;
        
        this.nextRoom = this.rooms.get(nextRoomId);
        if (!this.nextRoom) return false;
        
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionDirection = direction;
        
        // Position player for transition
        if (direction === 'right') {
            player.position.x = 50;
        } else {
            player.position.x = 1150;
        }
        
        return true;
    }

    completeTransition() {
        this.isTransitioning = false;
        this.currentRoom = this.nextRoom;
        this.nextRoom = null;
        this.transitionDirection = null;
        this.transitionProgress = 0;
        
        // Update UI
        document.getElementById('roomIndicator').textContent = 
            `Room ${this.currentRoom.id}`;
    }

    getCurrentRoom() {
        return this.currentRoom;
    }
}
