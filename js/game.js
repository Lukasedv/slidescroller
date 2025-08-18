class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.inputManager = new InputManager();
        this.roomManager = new RoomManager();
        
        // Get actual screen dimensions
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        
        this.player = new Player(100, this.screenHeight - 150); // Place player near bottom with some margin
        
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        
        // Game state
        this.isPaused = true; // Start paused until user makes choice
        this.gameStarted = false;
        this.pausedByFocusLoss = false; // Track if paused by tab switching
        this.welcomeShown = false;
        this.controlsStartTime = null;
        
        this.init();
    }

    init() {
        // Set up canvas to fullscreen
        this.canvas.width = this.screenWidth;
        this.canvas.height = this.screenHeight;
        
        // Disable image smoothing for game elements (player, weapons, etc.)
        // Slide backgrounds will override this setting temporarily
        this.ctx.imageSmoothingEnabled = false;
        
        // Show welcome popup before starting
        this.showWelcomePopup();
        
        // Start the game loop (but paused)
        this.start();
        
        console.log('SlideScroller Game initialized!');
        console.log('Controls: A/D - Move, W - Jump, Space - Attack');
        console.log(`Screen size: ${this.screenWidth}x${this.screenHeight}`);
        console.log(`Device pixel ratio: ${window.devicePixelRatio || 1}`);
    }

    showWelcomePopup() {
        const overlay = document.getElementById('pdfWelcomeOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.welcomeShown = true;
        }
    }

    hideWelcomePopup() {
        const overlay = document.getElementById('pdfWelcomeOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        this.isPaused = false;
        this.gameStarted = true;
        this.welcomeShown = false;
        
        // Start timer to fade out controls help
        this.controlsStartTime = performance.now();
        
        // Show controls help with fadeout animation
        const controlsHelp = document.querySelector('.controls-help');
        if (controlsHelp) {
            controlsHelp.classList.add('visible');
            setTimeout(() => {
                controlsHelp.classList.add('fade-out');
                // Remove from DOM after fade completes
                setTimeout(() => {
                    controlsHelp.style.display = 'none';
                }, 1000);
            }, 3000); // Start fade after 3 seconds
        }
    }

    start() {
        this.isRunning = true;
        this.gameStarted = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
        this.lastTime = currentTime;

        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.isPaused) return;

        // Update input manager
        this.inputManager.update();
        
        // Handle pause (only for manual ESC pause, not focus loss)
        if (this.inputManager.wasJustPressed('Escape') && !this.pausedByFocusLoss) {
            this.togglePause();
        }
        
        // Debug keys (commented out for production)
        // if (this.inputManager.wasJustPressed('KeyH')) {
        //     this.player.takeDamage(10);
        // }
        // if (this.inputManager.wasJustPressed('KeyG')) {
        //     this.player.heal(10);
        // }
        
        // Update game systems
        this.roomManager.update(this.deltaTime, this.screenWidth, this.screenHeight);
        this.player.update(this.deltaTime, this.roomManager, this.inputManager);
        
        // Update game state
        this.updateGameState();
    }

    updateGameState() {
        // Check for game over conditions
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        // Update UI elements
        this.updateUI();
    }

    updateUI() {
        // Update room indicator
        const roomIndicator = document.getElementById('roomIndicator');
        if (roomIndicator && this.roomManager.getCurrentRoom()) {
            const currentRoom = this.roomManager.getCurrentRoom();
            const totalRooms = this.roomManager.getTotalRooms();
            roomIndicator.textContent = `Slide ${currentRoom.id}/${totalRooms} - ${currentRoom.slideContent}`;
        }
        
        // Update PDF status
        const pdfStatus = document.getElementById('pdfStatus');
        
        if (pdfStatus) {
            if (this.roomManager.isLoadingPresentation()) {
                const progress = this.roomManager.getLoadingProgress();
                pdfStatus.textContent = `Loading: ${progress.message} (${Math.round(progress.progress)}%)`;
            } else if (this.roomManager.pdfProcessor && this.roomManager.pdfProcessor.isReady()) {
                const pageCount = this.roomManager.pdfProcessor.getPageCount();
                pdfStatus.textContent = `PDF loaded: ${pageCount} slides`;
            } else {
                pdfStatus.textContent = 'Using demo slides';
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render room (includes background and platforms)
        this.roomManager.render(this.ctx);
        
        // Render player
        this.player.render(this.ctx);
        
        // Only show pause menu for manual pause, not focus loss pause
        if (this.isPaused && !this.pausedByFocusLoss) {
            this.renderPauseMenu();
        }
    }

    renderPauseMenu() {
        // Render pause overlay
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        this.ctx.restore();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pausedByFocusLoss = false; // Reset focus loss flag when manually toggling
        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
    }

    gameOver() {
        this.isPaused = true;
        console.log('Game Over!');
        
        // Render game over screen
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press F5 to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        
        this.ctx.restore();
    }

    restart() {
        // Reset game state
        this.player = new Player(100, this.screenHeight - 150);
        this.roomManager = new RoomManager();
        this.roomManager.updateScreenDimensions(this.screenWidth, this.screenHeight);
        this.isPaused = false;
        this.gameStarted = true;
        
        console.log('Game restarted!');
    }

    stop() {
        this.isRunning = false;
    }
}

// Initialize game when page loads
let game;

window.addEventListener('load', () => {
    game = new Game();
});

// Global function to reload PDF presentation (removed reload button functionality)
window.reloadPresentationPDF = async function() {
    // This function is kept for compatibility but no longer used in UI
    if (game && game.roomManager) {
        console.log('Reloading PDF presentation...');
        await game.roomManager.reloadPDF();
    }
};

// Global function to continue without PDF
window.continueWithoutPDF = function() {
    if (game) {
        console.log('Continuing with demo slides');
        game.hideWelcomePopup();
        // Room manager will already have default slides loaded
    }
};

// Global function to load PDF from file upload
window.loadPDFFromFile = async function(fileInput) {
    if (game && game.roomManager && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        console.log('Loading PDF from uploaded file:', file.name);
        
        // Hide welcome popup if it's showing
        if (game.welcomeShown) {
            game.hideWelcomePopup();
        }
        
        // Reset current PDF processor
        game.roomManager.pdfProcessor.reset();
        game.roomManager.isLoadingPDF = true;
        
        // Load PDF from file
        const success = await game.roomManager.pdfProcessor.loadPDFFromFile(file);
        
        if (success) {
            console.log('PDF uploaded successfully');
        } else {
            console.error('Failed to load uploaded PDF');
            // Fall back to default slides
            game.roomManager.generateDefaultRooms();
        }
        
        game.roomManager.isLoadingPDF = false;
        
        // Clear the file input for future uploads
        fileInput.value = '';
    }
};

// Handle window resize
window.addEventListener('resize', () => {
    if (game && game.canvas) {
        // Update screen dimensions
        game.screenWidth = window.innerWidth;
        game.screenHeight = window.innerHeight;
        game.canvas.width = game.screenWidth;
        game.canvas.height = game.screenHeight;
        
        // Update room manager with new dimensions
        game.roomManager.updateScreenDimensions(game.screenWidth, game.screenHeight);
    }
});

// Handle page visibility for pause/resume
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            // Tab lost focus - silently pause
            game.isPaused = true;
            game.pausedByFocusLoss = true;
        } else {
            // Tab regained focus - silently resume
            if (game.pausedByFocusLoss) {
                game.isPaused = false;
                game.pausedByFocusLoss = false;
            }
        }
    }
});
