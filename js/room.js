class Room {
    constructor(id, slideContent, backgroundColor = '#2a2a2a', slideImage = null) {
        this.id = id;
        this.slideContent = slideContent;
        this.backgroundColor = backgroundColor;
        this.slideImage = slideImage; // PDF page image
        this.platforms = []; // Keep empty array for compatibility
        this.enemies = [];
        this.items = [];
        this.leftTransition = null;
        this.rightTransition = null;
        
        // Enemy management
        this.enemyManager = new EnemyManager();
        
        // Store screen dimensions for enemy spawning
        this.screenWidth = 1000; // Default values
        this.screenHeight = 800;
        
        // Spawn enemies starting from slide 2
        this.spawnEnemies(this.screenWidth, this.screenHeight);
    }

    spawnEnemies(screenWidth = 1000, screenHeight = 800) {
        // Only spawn enemies from slide 2 onward
        if (this.id >= 2) {
            // Spawn 1-3 enemies per room based on room ID
            const enemyCount = Math.min(1 + Math.floor((this.id - 2) / 3), 3);
            
            for (let i = 0; i < enemyCount; i++) {
                // Spawn enemies on the right side of the room (right 60% of screen)
                const rightSideStart = screenWidth * 0.4; // Start at 40% from left
                const rightSideWidth = screenWidth * 0.6; // Use 60% of screen width
                const spacing = rightSideWidth / (enemyCount + 1);
                const x = rightSideStart + spacing * (i + 1) - 10; // Adjust for enemy size
                
                // Spawn enemies above the screen with a small delay between spawns
                const spawnHeight = -50 - (i * 30); // Spawn progressively higher for visual effect
                const y = spawnHeight;
                
                const enemy = new Enemy(x, y, 'basic', i); // Pass index for randomization
                enemy.isSpawning = true; // Mark as spawning for special effects
                enemy.spawnDelay = i * 0.2; // Stagger spawn timing
                
                this.enemyManager.addEnemy(enemy);
            }
            
            console.log(`Spawned ${enemyCount} enemies in room ${this.id} - they will drop from above`);
        }
    }

    respawnEnemies(screenWidth = this.screenWidth, screenHeight = this.screenHeight) {
        // Clear existing enemies
        this.enemyManager.clear();
        
        // Spawn fresh enemies with current screen dimensions
        this.spawnEnemies(screenWidth, screenHeight);
        
        console.log(`Respawned enemies in room ${this.id}`);
    }

    repositionEnemies(screenWidth, screenHeight) {
        // Only reposition if we have enemies
        if (this.id < 2 || this.enemyManager.enemies.length === 0) return;
        
        console.log(`Repositioning ${this.enemyManager.enemies.length} enemies in room ${this.id}`);
        
        // Calculate new ground level
        const groundLevel = screenHeight - 50;
        const enemyGroundY = groundLevel - 20; // Enemy size is 20
        
        // Reposition each enemy to new ground level while keeping relative X positions
        this.enemyManager.enemies.forEach((enemy, index) => {
            if (enemy.isAlive) {
                // Keep the same relative X position but update Y to new ground level
                const enemyCount = this.enemyManager.enemies.filter(e => e.isAlive).length;
                const rightSideStart = screenWidth * 0.4;
                const rightSideWidth = screenWidth * 0.6;
                const spacing = rightSideWidth / (enemyCount + 1);
                const newX = rightSideStart + spacing * (index + 1) - 10;
                
                enemy.position.x = newX;
                enemy.position.y = enemyGroundY;
                enemy.isGrounded = true; // Ensure they're considered on ground
                enemy.velocity.y = 0; // Stop any falling
                
                console.log(`Repositioned enemy ${index} to (${newX}, ${enemyGroundY})`);
            }
        });
    }

    generatePlatforms() {
        // No platforms needed - just keep method for compatibility
        this.platforms = [];
    }

    update(deltaTime, screenWidth, screenHeight) {
        // Check if screen dimensions changed and reposition enemies accordingly
        if (screenWidth && screenHeight && 
            (screenWidth !== this.screenWidth || screenHeight !== this.screenHeight)) {
            
            console.log(`Screen size changed from ${this.screenWidth}x${this.screenHeight} to ${screenWidth}x${screenHeight}`);
            this.screenWidth = screenWidth;
            this.screenHeight = screenHeight;
            
            // Reposition enemies to match new ground level
            this.repositionEnemies(screenWidth, screenHeight);
        }
        
        // Update enemy manager
        this.enemyManager.update(deltaTime, this);
        
        // Update items
        this.items.forEach(item => item.update(deltaTime));
    }

    render(ctx, debugMode = false) {
        // Get current screen dimensions
        const screenWidth = ctx.canvas.width;
        const screenHeight = ctx.canvas.height;
        
        // Clear and set background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        
        // Render slide content as prominent background
        this.renderSlideBackground(ctx, screenWidth, screenHeight);
        
        // Render simple ground line
        ctx.fillStyle = '#333';
        ctx.fillRect(0, screenHeight - 50, screenWidth, 50);
        
        // Render enemies using enemy manager
        this.enemyManager.render(ctx, debugMode);
        
        // Render items
        this.items.forEach(item => item.render(ctx));
    }

    renderSlideBackground(ctx, screenWidth, screenHeight) {
        ctx.save();
        
        // Enable high-quality image smoothing for slide backgrounds
        const originalSmoothing = ctx.imageSmoothingEnabled;
        const originalQuality = ctx.imageSmoothingQuality;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Use full screen for slides - no margins or borders
        const slideWidth = screenWidth;
        const slideHeight = screenHeight;
        
        // If we have a PDF slide image, render it
        if (this.slideImage && this.slideImage.complete) {
            // Calculate aspect ratios to fill the entire screen
            const slideAspect = slideWidth / slideHeight;
            const imageAspect = this.slideImage.width / this.slideImage.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imageAspect > slideAspect) {
                // Image is wider than screen - scale to fill height
                drawHeight = slideHeight;
                drawWidth = drawHeight * imageAspect;
                drawX = (slideWidth - drawWidth) / 2; // Center horizontally
                drawY = 0;
            } else {
                // Image is taller than screen - scale to fill width
                drawWidth = slideWidth;
                drawHeight = drawWidth / imageAspect;
                drawX = 0;
                drawY = (slideHeight - drawHeight) / 2; // Center vertically
            }
            
            // Draw the PDF page image filling the screen with high quality
            ctx.drawImage(this.slideImage, drawX, drawY, drawWidth, drawHeight);
            
            // Restore original smoothing settings for other game elements
            ctx.imageSmoothingEnabled = originalSmoothing;
            ctx.imageSmoothingQuality = originalQuality;
            
            // Add slide number overlay in top-right corner
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenWidth - 90, 10, 80, 30);
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.min(screenWidth, screenHeight) * 0.02}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.id}`, screenWidth - 50, 25);
            
        } else {
            // Fallback to text-based slide (original behavior) - also full screen
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, screenWidth, screenHeight);
            
            // Main slide content - large and centered
            ctx.fillStyle = '#333';
            ctx.font = `${Math.min(screenWidth, screenHeight) * 0.08}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.slideContent, screenWidth / 2, screenHeight / 2);
            
            // Slide number in top-right corner
            ctx.font = `${Math.min(screenWidth, screenHeight) * 0.03}px Arial`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(`Slide ${this.id}`, screenWidth - 30, 30);
            
            // Add some decorative elements
            const lineY = screenHeight / 2 + Math.min(screenWidth, screenHeight) * 0.06;
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(60, lineY);
            ctx.lineTo(screenWidth - 60, lineY);
            ctx.stroke();
        }
        
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

    // Combat methods for enemy interaction
    checkPlayerEnemyCollisions(player) {
        return this.enemyManager.checkPlayerCollisions(player);
    }

    getEnemiesInAttackRange(playerPosition, playerSize, attackRange, playerFacing) {
        return this.enemyManager.getEnemiesInRange(playerPosition, playerSize, attackRange, playerFacing);
    }

    damageEnemiesInRange(playerPosition, playerSize, attackRange, playerFacing, damage) {
        const enemiesInRange = this.getEnemiesInAttackRange(playerPosition, playerSize, attackRange, playerFacing);
        enemiesInRange.forEach(enemy => {
            enemy.takeDamage(damage);
        });
        return enemiesInRange.length; // Return number of enemies hit
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
        
        // Screen dimensions
        this.screenWidth = 1200; // Default values
        this.screenHeight = 800;
        
        // PDF processing
        this.pdfProcessor = new PDFProcessor();
        this.isLoadingPDF = false;
        this.pdfLoadingProgress = 0;
        this.pdfLoadingMessage = '';
        
        // Start with default slides, don't auto-load PDF
        this.generateDefaultRooms();
        this.setupPDFProcessor();
    }

    setupPDFProcessor() {
        // Set up PDF processor callbacks without auto-loading
        this.pdfProcessor.onProgress((progress, message) => {
            this.pdfLoadingProgress = progress;
            this.pdfLoadingMessage = message;
        });
        
        this.pdfProcessor.onLoad((pageImages) => {
            console.log(`PDF loaded with ${pageImages.length} pages`);
            this.generateRoomsFromPDF(pageImages);
            this.isLoadingPDF = false;
        });
    }

    updateScreenDimensions(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
    }

    generateRoomsFromPDF(pageImages) {
        this.rooms.clear();
        
        const colors = [
            '#2a4a6b',  // Blue
            '#6b2a4a',  // Red
            '#4a6b2a',  // Green
            '#6b4a2a',  // Brown
            '#4a2a6b',  // Purple
            '#6b6b2a',  // Olive
            '#2a6b6b',  // Teal
            '#6b4a6b',  // Magenta
            '#4a6b4a',  // Forest
            '#6b6b4a'   // Mustard
        ];

        // Create rooms from PDF pages
        for (let i = 0; i < pageImages.length; i++) {
            const pageImage = pageImages[i];
            const slideContent = `PDF Slide ${i + 1}`;
            const backgroundColor = colors[i % colors.length];
            
            const room = new Room(i + 1, slideContent, backgroundColor, pageImage);
            this.rooms.set(i + 1, room);
        }

        // Set up room transitions
        for (let i = 1; i <= pageImages.length; i++) {
            const room = this.rooms.get(i);
            const leftRoom = i > 1 ? i - 1 : null;
            const rightRoom = i < pageImages.length ? i + 1 : null;
            room.setTransitions(leftRoom, rightRoom);
        }

        // Start in the first room
        this.currentRoom = this.rooms.get(1);
        console.log(`Generated ${pageImages.length} rooms from PDF`);
    }

    generateDefaultRooms() {
        this.rooms.clear();
        
        // Create a series of connected rooms with slide-like content
        const slideContents = [
            "Welcome to SlideScroller!",
            "Upload Your PDF Presentation", 
            "Navigate with A/D Keys",
            "Jump with W Key",
            "Attack with Spacebar",
            "Supports 100+ Slides",
            "Password PDFs Supported",
            "Fullscreen Experience",
            "Upload PDF Anytime",
            "Demo Slide #10",
            "Thanks for Playing!"
        ];

        const colors = [
            '#2a4a6b',  // Blue
            '#6b2a4a',  // Red
            '#4a6b2a',  // Green
            '#6b4a2a',  // Brown
            '#4a2a6b',  // Purple
            '#6b6b2a',  // Olive
            '#2a6b6b',  // Teal
            '#6b4a6b',  // Magenta
            '#4a6b4a',  // Forest
            '#6b6b4a',  // Mustard
            '#4a4a6b'   // Navy
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

    generateRooms() {
        // This method is kept for compatibility but now handled by initializePDF
        this.generateDefaultRooms();
    }

    update(deltaTime, screenWidth, screenHeight) {
        // Update screen dimensions if provided
        if (screenWidth && screenHeight) {
            this.screenWidth = screenWidth;
            this.screenHeight = screenHeight;
        }
        
        if (this.isTransitioning) {
            this.transitionProgress += this.transitionSpeed * deltaTime;
            
            if (this.transitionProgress >= 1.0) {
                this.completeTransition();
            }
        }
        
        if (this.currentRoom) {
            this.currentRoom.update(deltaTime, screenWidth, screenHeight);
        }
    }

    render(ctx, debugMode = false) {
        if (this.isLoadingPDF) {
            this.renderLoadingScreen(ctx);
        } else if (this.isTransitioning && this.nextRoom) {
            this.renderTransition(ctx, debugMode);
        } else if (this.currentRoom) {
            this.currentRoom.render(ctx, debugMode);
        }
    }

    renderLoadingScreen(ctx) {
        const screenWidth = ctx.canvas.width;
        const screenHeight = ctx.canvas.height;
        
        // Dark background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        
        // Loading text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.min(screenWidth, screenHeight) * 0.05}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading Presentation...', screenWidth / 2, screenHeight / 2 - 60);
        
        // Progress bar background
        const barWidth = Math.min(400, screenWidth * 0.6);
        const barHeight = 20;
        const barX = (screenWidth - barWidth) / 2;
        const barY = screenHeight / 2;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress bar fill
        const fillWidth = (this.pdfLoadingProgress / 100) * barWidth;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Progress text
        ctx.font = `${Math.min(screenWidth, screenHeight) * 0.025}px Arial`;
        ctx.fillStyle = '#ccc';
        ctx.fillText(this.pdfLoadingMessage, screenWidth / 2, screenHeight / 2 + 50);
        ctx.fillText(`${Math.round(this.pdfLoadingProgress)}%`, screenWidth / 2, screenHeight / 2 + 80);
    }

    renderTransition(ctx, debugMode = false) {
        const progress = this.transitionProgress;
        const screenWidth = ctx.canvas.width;
        const offset = this.transitionDirection === 'right' ? 
            -screenWidth * progress : screenWidth * progress;
        
        ctx.save();
        
        // Render current room
        ctx.translate(offset, 0);
        this.currentRoom.render(ctx, debugMode);
        
        // Render next room
        const nextOffset = this.transitionDirection === 'right' ? 
            screenWidth : -screenWidth;
        ctx.translate(nextOffset, 0);
        this.nextRoom.render(ctx, debugMode);
        
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
            player.position.x = this.screenWidth - 100; // Use screen width instead of hardcoded value
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

    respawnAllEnemies() {
        console.log('Respawning all enemies in all rooms...');
        
        // Iterate through all rooms and respawn their enemies
        for (const [roomId, room] of this.rooms) {
            room.respawnEnemies();
        }
        
        console.log(`Respawned enemies in ${this.rooms.size} rooms`);
    }

    /**
     * Reload PDF presentation
     */
    async reloadPDF() {
        console.log('Reloading PDF presentation...');
        this.pdfProcessor.reset();
        await this.initializePDF();
    }

    /**
     * Check if PDF is currently loading
     */
    isLoadingPresentation() {
        return this.isLoadingPDF;
    }

    /**
     * Get PDF loading progress
     */
    getLoadingProgress() {
        return {
            progress: this.pdfLoadingProgress,
            message: this.pdfLoadingMessage
        };
    }

    /**
     * Get total number of rooms/slides
     */
    getTotalRooms() {
        return this.rooms.size;
    }
}
