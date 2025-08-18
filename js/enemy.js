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
        
        // Spawning properties
        this.isSpawning = false;
        this.spawnDelay = 0;
        this.spawnTimer = 0;
        this.hasLanded = false;
        this.landingEffect = 0; // For visual effects when landing
        
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
        
        // Handle spawning state
        if (this.isSpawning) {
            this.updateSpawning(deltaTime);
            // Only apply physics during spawning, no movement patterns
            this.updatePhysics(deltaTime, room);
            this.updateAnimation(deltaTime);
            return;
        }
        
        this.updateMovement(deltaTime, room);
        this.updatePhysics(deltaTime, room);
        this.updateAnimation(deltaTime);
    }

    updateSpawning(deltaTime) {
        // Handle spawn delay
        if (this.spawnDelay > 0) {
            this.spawnDelay -= deltaTime;
            return; // Don't fall yet, wait for delay
        }
        
        // Count down spawn timer for effects
        this.spawnTimer += deltaTime;
        
        // Check if enemy has landed (touched ground)
        if (this.isGrounded && !this.hasLanded) {
            this.hasLanded = true;
            this.landingEffect = 0.3; // Landing effect duration
            this.isSpawning = false; // Stop spawning state
            this.startX = this.position.x; // Set patrol center to landing position
            console.log(`Enemy ${this.index} landed and started patrolling`);
        }
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
        // Use current screen dimensions from room instead of hardcoded values
        const screenHeight = room.screenHeight || 800; // Fallback to 800 if not available
        const screenWidth = room.screenWidth || 1000; // Fallback to 1000 if not available
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
        
        // Handle landing effect countdown
        if (this.landingEffect > 0) {
            this.landingEffect -= deltaTime;
        }
        
        // Varied bobbing animation with phase offset for desync
        const bobFrequency = 4 + (this.index * 0.5); // Different frequencies per enemy
        this.bobOffset = Math.sin(this.animationTimer * bobFrequency + this.phaseOffset) * 1;
    }

    render(ctx) {
        if (!this.isAlive) return;
        
        // Don't render if still waiting for spawn delay
        if (this.isSpawning && this.spawnDelay > 0) return;
        
        const drawX = this.position.x;
        const drawY = this.position.y + this.bobOffset;
        
        // Add landing effect (screen shake or size bounce)
        let sizeMultiplier = 1;
        if (this.landingEffect > 0) {
            sizeMultiplier = 1 + (this.landingEffect * 0.5); // Bounce effect when landing
        }
        
        // Add spawning effect (fade in or glow)
        let alpha = 1;
        if (this.isSpawning) {
            alpha = Math.min(1, this.spawnTimer * 2); // Fade in over 0.5 seconds
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Add glow effect during landing
        if (this.landingEffect > 0) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10 * this.landingEffect;
        }
        
        // Draw enemy body (simple rectangle with rounded corners)
        ctx.fillStyle = this.color;
        
        const renderWidth = this.size.x * sizeMultiplier;
        const renderHeight = this.size.y * sizeMultiplier;
        const renderX = drawX - (renderWidth - this.size.x) / 2;
        const renderY = drawY - (renderHeight - this.size.y) / 2;
        
        // Draw main body - use fillRect as fallback for roundRect
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(renderX, renderY, renderWidth, renderHeight, 4);
            ctx.fill();
        } else {
            // Fallback for browsers without roundRect
            ctx.fillRect(renderX, renderY, renderWidth, renderHeight);
        }
        
        // Draw eyes (adjusted for size multiplier)
        ctx.fillStyle = this.eyeColor;
        const eyeSize = 3 * sizeMultiplier;
        const eyeY = renderY + (6 * sizeMultiplier);
        
        // Left eye
        ctx.beginPath();
        ctx.arc(renderX + (6 * sizeMultiplier), eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(renderX + renderWidth - (6 * sizeMultiplier), eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw simple mouth (adjusted for size multiplier)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(renderX + renderWidth / 2, renderY + (16 * sizeMultiplier), 4 * sizeMultiplier, 0, Math.PI);
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
        return this.enemies.find(enemy => enemy.canDamagePlayer(player)) || null;
    }

    // Get enemies that can be hit by player attack
    getEnemiesInRange(playerPosition, playerSize, attackRange, playerFacing) {
        // Calculate attack area in front of the player, aligned with weapon position
        // Make the attack area wider and taller for easier hitting, extending to floor
        const attackWidth = attackRange;
        const attackHeight = 120; // Much taller attack area to cover from player to ground
        
        // Position attack area to align with weapon, not overlap with player
        const attackX = playerFacing > 0 ? 
            playerPosition.x + playerSize.x : // Start from right edge of player when facing right
            playerPosition.x - attackWidth;   // End at left edge of player when facing left
        
        // Make attack area extend from player center down to ground level
        const attackY = playerPosition.y + (playerSize.y / 2) - 10; // Start slightly above player center
        
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
