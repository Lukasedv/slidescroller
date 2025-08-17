class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.inputManager = new InputManager();
        this.roomManager = new RoomManager();
        this.player = new Player(100, 702); // Place player on ground (750 - 48 = 702)
        
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        
        // Game state
        this.isPaused = false;
        this.gameStarted = false;
        this.pausedByFocusLoss = false; // Track if paused by tab switching
        
        this.init();
    }

    init() {
        // Set up canvas
        this.canvas.width = 1200;
        this.canvas.height = 800;
        
        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Start the game loop
        this.start();
        
        console.log('SlideScroller Game initialized!');
        console.log('Controls: A/D - Move, W - Jump, Space - Attack');
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
        
        // Update game systems
        this.roomManager.update(this.deltaTime);
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
            roomIndicator.textContent = `Room ${currentRoom.id} - ${currentRoom.slideContent}`;
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render room (includes background and platforms)
        this.roomManager.render(this.ctx);
        
        // Render player
        this.player.render(this.ctx);
        
        // Render UI overlays
        this.renderDebugInfo();
        
        // Only show pause menu for manual pause, not focus loss pause
        if (this.isPaused && !this.pausedByFocusLoss) {
            this.renderPauseMenu();
        }
    }

    renderDebugInfo() {
        // Render debug information in top-right corner
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(1000, 10, 190, 120);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const player = this.player;
        const debugLines = [
            `FPS: ${Math.round(1 / this.deltaTime)}`,
            `Position: ${Math.round(player.position.x)}, ${Math.round(player.position.y)}`,
            `Velocity: ${Math.round(player.velocity.x)}, ${Math.round(player.velocity.y)}`,
            `Grounded: ${player.isGrounded}`,
            `Health: ${player.health}/${player.maxHealth}`,
            `Room: ${this.roomManager.getCurrentRoom()?.id || 'None'}`,
            `Transitioning: ${this.roomManager.isTransitioning}`,
            `Can Transition: ${player.canTransition}`
        ];
        
        debugLines.forEach((line, index) => {
            this.ctx.fillText(line, 1010, 30 + index * 14);
        });
        
        this.ctx.restore();
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
        this.player = new Player(100, 600);
        this.roomManager = new RoomManager();
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

// Handle window resize
window.addEventListener('resize', () => {
    if (game && game.canvas) {
        // Keep canvas centered
        const container = document.querySelector('.game-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            // Canvas size is fixed, but we can adjust container positioning if needed
        }
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
