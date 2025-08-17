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
        
        // No platform generation needed anymore
    }

    generatePlatforms() {
        // No platforms needed - just keep method for compatibility
        this.platforms = [];
    }

    update(deltaTime) {
        // Update enemies, items, etc.
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.items.forEach(item => item.update(deltaTime));
    }

    render(ctx) {
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
        
        // Render enemies and items
        this.enemies.forEach(enemy => enemy.render(ctx));
        this.items.forEach(item => item.render(ctx));
    }

    renderSlideBackground(ctx, screenWidth, screenHeight) {
        ctx.save();
        
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
            
            // Draw the PDF page image filling the screen
            ctx.drawImage(this.slideImage, drawX, drawY, drawWidth, drawHeight);
            
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
            this.currentRoom.update(deltaTime);
        }
    }

    render(ctx) {
        if (this.isLoadingPDF) {
            this.renderLoadingScreen(ctx);
        } else if (this.isTransitioning && this.nextRoom) {
            this.renderTransition(ctx);
        } else if (this.currentRoom) {
            this.currentRoom.render(ctx);
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

    renderTransition(ctx) {
        const progress = this.transitionProgress;
        const screenWidth = ctx.canvas.width;
        const offset = this.transitionDirection === 'right' ? 
            -screenWidth * progress : screenWidth * progress;
        
        ctx.save();
        
        // Render current room
        ctx.translate(offset, 0);
        this.currentRoom.render(ctx);
        
        // Render next room
        const nextOffset = this.transitionDirection === 'right' ? 
            screenWidth : -screenWidth;
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
