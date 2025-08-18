// Enemy system for SlideScroller game

class Enemy {
    constructor(x, y, type = 'basic', index = 0) {
        this.position = new Vector2(x, y);
        this.size = new Vector2(20, 20); // Smaller enemy for easier ground movement
        this.velocity = new Vector2(0, 0);
        this.type = type;
        this.index = index; // Used for randomization
        
        // Physics
        this.gravity = 800;
        this.isGrounded = false;
        this.maxFallSpeed = 600;
        
        // Health and combat
        this.maxHealth = 1; // Dies in one hit
        this.health = this.maxHealth;
        this.isAlive = true;
        
        // Movement pattern with randomization
        this.baseSpeed = 60; // Base speed
        this.speed = this.baseSpeed + (Math.random() - 0.5) * 20; // ±10 speed variation
        this.patrolDistance = 80 + Math.random() * 40; // 80-120 patrol distance
        this.startX = x;
        this.direction = Math.random() < 0.5 ? 1 : -1; // Random initial direction
        this.patrolTimer = 0;
        
        // Add phase offset for animation desync
        this.phaseOffset = index * 0.5 + Math.random() * 2; // Offset based on index + random
        
        // Animation
        this.animationTimer = this.phaseOffset; // Start with offset
        this.bobOffset = 0;
        
        // Color variation (slight hue shift per enemy)
        const hueShift = index * 30; // Different hue per enemy
        this.color = this.generateColor('#ff4444', hueShift);
        this.eyeColor = '#ffffff';
    }

    update(deltaTime, room) {
        if (!this.isAlive) return;
        
        this.updateMovement(deltaTime, room);
        this.updatePhysics(deltaTime, room);
        this.updateAnimation(deltaTime);
    }

    updateMovement(deltaTime, room) {
        // Enhanced patrol pattern with randomization
        this.patrolTimer += deltaTime;
        
        // Change direction when reaching patrol boundaries
        const distanceFromStart = this.position.x - this.startX;
        
        if (distanceFromStart >= this.patrolDistance && this.direction > 0) {
            this.direction = -1;
            // Add slight pause and speed variation when changing direction
            this.speed = this.baseSpeed + (Math.random() - 0.5) * 20;
        } else if (distanceFromStart <= -this.patrolDistance && this.direction < 0) {
            this.direction = 1;
            // Add slight pause and speed variation when changing direction
            this.speed = this.baseSpeed + (Math.random() - 0.5) * 20;
        }
        
        // Occasionally add small random direction changes (every 2-4 seconds)
        if (Math.random() < deltaTime * 0.1) { // 10% chance per second
            this.direction *= -1;
            this.speed = this.baseSpeed + (Math.random() - 0.5) * 15;
        }
        
        // Apply horizontal movement with slight speed variation over time
        const speedVariation = Math.sin(this.animationTimer * 0.5) * 5; // Subtle speed oscillation
        this.velocity.x = this.direction * (this.speed + speedVariation);
    }

    updatePhysics(deltaTime, room) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
            this.velocity.y = Math.min(this.velocity.y, this.maxFallSpeed);
        }
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Ground collision (simple floor detection)
        // Use more accurate screen bounds - default to 800 height
        const screenHeight = 800;
        const screenWidth = 1000;
        const groundY = screenHeight - 50; // Match the ground rendering in room.js
        
        if (this.position.y + this.size.y >= groundY) {
            this.position.y = groundY - this.size.y;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // Keep enemy within reasonable screen bounds
        if (this.position.x < 0) {
            this.position.x = 0;
            this.direction = 1;
        } else if (this.position.x + this.size.x > screenWidth) {
            this.position.x = screenWidth - this.size.x;
            this.direction = -1;
        }
    }

    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Varied bobbing animation with phase offset for desync
        const bobFrequency = 4 + (this.index * 0.5); // Different frequencies per enemy
        this.bobOffset = Math.sin(this.animationTimer * bobFrequency + this.phaseOffset) * 1;
    }

    render(ctx) {
        if (!this.isAlive) return;
        
        const drawX = this.position.x;
        const drawY = this.position.y + this.bobOffset;
        
        // Draw enemy body (simple rectangle with rounded corners)
        ctx.save();
        ctx.fillStyle = this.color;
        
        // Draw main body - use fillRect as fallback for roundRect
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(drawX, drawY, this.size.x, this.size.y, 4);
            ctx.fill();
        } else {
            // Fallback for browsers without roundRect
            ctx.fillRect(drawX, drawY, this.size.x, this.size.y);
        }
        
        // Draw eyes
        ctx.fillStyle = this.eyeColor;
        const eyeSize = 3;
        const eyeY = drawY + 6;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(drawX + 6, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(drawX + this.size.x - 6, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw simple mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(drawX + this.size.x / 2, drawY + 16, 4, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }

    // Get collision rectangle for hit detection
    getCollisionRect() {
        return new Rectangle(this.position.x, this.position.y, this.size.x, this.size.y);
    }

    // Take damage and handle death
    takeDamage(damage) {
        if (!this.isAlive) return;
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.die();
        }
    }

    generateColor(baseColor, hueShift) {
        // Simple color variation - create slight variations of the base red color
        const variations = [
            '#ff4444', // Original red
            '#ff6644', // Orange-red
            '#ff4466', // Pink-red
            '#cc4444', // Dark red
            '#ff7744'  // Light orange-red
        ];
        return variations[hueShift % variations.length] || baseColor;
    }

    die() {
        this.isAlive = false;
        console.log('Enemy defeated!');
        
        // Optional: Add death effect or animation here
        // For now, just mark as dead (won't render or update)
    }

    // Check if player is close enough to damage them
    canDamagePlayer(player) {
        if (!this.isAlive) return false;
        
        const enemyRect = this.getCollisionRect();
        const playerRect = new Rectangle(
            player.position.x, 
            player.position.y, 
            player.size.x, 
            player.size.y
        );
        
        return enemyRect.intersects(playerRect);
    }
}

// Enemy manager to handle multiple enemies in a room
class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    removeDeadEnemies() {
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }

    update(deltaTime, room) {
        this.enemies.forEach(enemy => enemy.update(deltaTime, room));
        // Don't automatically remove dead enemies - let them stay for visual feedback
    }

    render(ctx, debugMode = false) {
        this.enemies.forEach(enemy => {
            enemy.render(ctx);
            
            // Draw enemy hitbox in debug mode
            if (debugMode && enemy.isAlive) {
                const rect = enemy.getCollisionRect();
                ctx.save();
                ctx.strokeStyle = '#ff0000'; // Red for enemy hitboxes
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.7;
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                ctx.restore();
            }
        });
    }

    // Get all living enemies
    getLivingEnemies() {
        return this.enemies.filter(enemy => enemy.isAlive);
    }

    // Check if any enemy can damage the player
    checkPlayerCollisions(player) {
        return this.enemies.some(enemy => enemy.canDamagePlayer(player));
    }

    // Get enemies that can be hit by player attack
    getEnemiesInRange(playerPosition, playerSize, attackRange, playerFacing) {
        // Calculate attack area in front of the player, aligned with weapon position
        // Make the attack area wider and taller for easier hitting
        const attackWidth = attackRange;
        const attackHeight = 80; // Taller attack area
        
        // Position attack area to align with weapon, not overlap with player
        const attackX = playerFacing > 0 ? 
            playerPosition.x + playerSize.x : // Start from right edge of player when facing right
            playerPosition.x - attackWidth;   // End at left edge of player when facing left
        const attackY = playerPosition.y - 20; // Center the attack area around player height
        
        const attackRect = new Rectangle(
            attackX, 
            attackY,
            attackWidth, 
            attackHeight
        );
        
        return this.enemies.filter(enemy => {
            if (!enemy.isAlive) return false;
            return enemy.getCollisionRect().intersects(attackRect);
        });
    }

    clear() {
        this.enemies = [];
    }
}
