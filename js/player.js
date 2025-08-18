class Player {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(64, 96); // Made character bigger (was 32x48)
        this.maxHealth = 100;
        this.health = this.maxHealth;
        
        // Movement properties - increased speed for faster traversal
        this.speed = 600; // Doubled from 300
        this.jumpPower = 700; // Increased jump power
        this.gravity = 1200;
        this.groundDrag = 0.1;  // Lower value = less drag = more movement
        this.airDrag = 0.02;    // Very low air drag for better air control
        this.isGrounded = true; // Start grounded since no platforms
        this.coyoteTime = 0.1;
        this.coyoteTimer = 0;
        
        // Weapon system
        this.weaponManager = new WeaponManager();
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackCooldownTimer = 0;
        
        // Animation properties
        this.facing = 1; // 1 for right, -1 for left
        this.animationTimer = 0;
        this.frameIndex = 0;
        
        // Room transition
        this.canTransition = true;
        this.transitionCooldown = 1.0;
        this.transitionTimer = 0;
        
        // Jump debounce
        this.jumpPressed = false;
        
        // Attack debounce  
        this.spacePressed = false;
        
        // Damage cooldown to prevent rapid damage
        this.damageCooldown = 1.0; // 1 second between damage instances
        this.damageTimer = 0;
        
        // Invincibility system
        this.invincibilityDuration = 1.0; // 1 second of invincibility
        this.invincibilityTimer = 0;
        this.isInvincible = false;
        this.flashTimer = 0;
        this.flashInterval = 0.1; // Flash every 100ms during invincibility
        
        // Knockback system
        this.isKnockedBack = false;
        this.knockbackDuration = 0.3; // 300ms of knockback physics override
        this.knockbackTimer = 0;
        
        // Death callback
        this.onDeath = null; // Callback function for when player dies
    }

    update(deltaTime, roomManager, inputManager) {
        this.handleInput(inputManager, deltaTime, roomManager);
        this.updatePhysics(deltaTime, roomManager);
        this.updateCombat(deltaTime, roomManager);
        this.updateAnimation(deltaTime);
        this.updateTransitions(deltaTime);
        this.checkRoomTransitions(roomManager, inputManager);
        this.updateHealth();
        this.updateInvincibility(deltaTime);
        this.checkEnemyCollisions(roomManager);
    }

    handleInput(inputManager, deltaTime, roomManager) {
        const currentRoom = roomManager.getCurrentRoom();
        if (!currentRoom || roomManager.isTransitioning) return;

        // Don't process movement input during knockback
        if (this.isKnockedBack) {
            console.log('Skipping input handling during knockback');
            return;
        }

        // Horizontal movement
        let horizontalInput = 0;
        if (inputManager.isPressed('KeyA') || inputManager.isPressed('ArrowLeft')) {
            horizontalInput = -1;
            this.facing = -1;
        }
        if (inputManager.isPressed('KeyD') || inputManager.isPressed('ArrowRight')) {
            horizontalInput = 1;
            this.facing = 1;
        }

        // Debug: Log input and grounded state (reduced logging)
        if (horizontalInput !== 0 && this.isGrounded) {
            console.log(`Ground Input: ${horizontalInput}, Velocity: ${this.velocity.x}`);
        }

        if (this.isGrounded) {
            this.velocity.x = horizontalInput * this.speed;
        } else {
            // Air control (very strong for precise control)
            if (horizontalInput !== 0) {
                this.velocity.x += horizontalInput * this.speed * 1.5 * deltaTime;
                this.velocity.x = clamp(this.velocity.x, -this.speed, this.speed);
            } else {
                // Apply minimal air drag when no input
                this.velocity.x *= 0.995;
            }
        }

        // Apply immediate stopping when no input and grounded
        if (horizontalInput === 0 && this.isGrounded) {
            this.velocity.x = 0;
        }

        // Jumping - using manual debounce since wasJustPressed isn't working
        const wPressed = inputManager.isPressed('KeyW');
        
        if (wPressed && !this.jumpPressed && (this.isGrounded || this.coyoteTimer > 0)) {
            console.log('Jump triggered!');
            this.velocity.y = -this.jumpPower;
            this.coyoteTimer = 0;
            this.isGrounded = false;
            this.jumpPressed = true; // Mark as pressed to prevent repeated jumps
        }
        
        // Reset jump pressed when key is released
        if (!wPressed) {
            this.jumpPressed = false;
        }

        // Attacking - using manual debounce like jumping
        const spacePressed = inputManager.isPressed('Space');
        
        if (spacePressed && !this.spacePressed && this.attackCooldownTimer <= 0 && !this.isAttacking) {
            console.log('Attack triggered!');
            this.startAttack(roomManager);
            this.spacePressed = true; // Mark as pressed to prevent repeated attacks
        }
        
        // Reset attack pressed when key is released
        if (!spacePressed) {
            this.spacePressed = false;
        }
    }

    updatePhysics(deltaTime, roomManager) {
        const currentRoom = roomManager.getCurrentRoom();
        if (!currentRoom) return;

        // Get screen dimensions from room manager
        const screenHeight = roomManager.screenHeight || 800;
        const groundLevel = screenHeight - 50; // Ground is 50 pixels from bottom

        // Apply gravity only if not on ground
        if (this.position.y < groundLevel - this.size.y) {
            this.velocity.y += this.gravity * deltaTime;
            this.isGrounded = false;
        } else if (!this.isKnockedBack) {
            // Only snap to ground if not being knocked back
            this.position.y = groundLevel - this.size.y;
            if (this.velocity.y > 0) {
                this.velocity.y = 0;
            }
            this.isGrounded = true;
            this.coyoteTimer = this.coyoteTime;
        }

        // Calculate next position
        const nextPosition = this.position.add(this.velocity.multiply(deltaTime));
        
        // Update position
        this.position = nextPosition;
        
        // Keep player in horizontal bounds for room transitions
        const screenWidth = roomManager.screenWidth || 1200;
        this.position.x = clamp(this.position.x, 0, screenWidth - this.size.x);
        
        // Only clamp Y position if not being knocked back
        if (!this.isKnockedBack) {
            this.position.y = clamp(this.position.y, 0, screenHeight - this.size.y);
        } else {
            // During knockback, allow some movement above ground but prevent going below
            this.position.y = Math.min(this.position.y, screenHeight - this.size.y);
        }
    }

    handleCollisions(nextPosition, room) {
        // Simplified collision - no platforms needed
        // Just keep player on the ground level
        // This method is kept for compatibility but essentially does nothing now
        this.position = nextPosition;
    }

    updateCombat(deltaTime, roomManager) {
        const currentWeapon = this.weaponManager.getCurrentWeapon();
        
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                console.log('Attack finished');
                this.isAttacking = false;
                this.attackCooldownTimer = currentWeapon.attackCooldown;
            }
        }

        if (this.attackCooldownTimer > 0) {
            this.attackCooldownTimer -= deltaTime;
        }
    }

    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Simple frame animation
        if (this.animationTimer > 0.1) {
            this.frameIndex = (this.frameIndex + 1) % 4;
            this.animationTimer = 0;
        }
    }

    updateTransitions(deltaTime) {
        if (this.transitionTimer > 0) {
            this.transitionTimer -= deltaTime;
            if (this.transitionTimer <= 0) {
                this.canTransition = true;
            }
        }
    }

    checkRoomTransitions(roomManager, inputManager) {
        if (!this.canTransition || roomManager.isTransitioning) return;

        const currentRoom = roomManager.getCurrentRoom();
        if (!currentRoom) return;

        // Get screen dimensions from room manager
        const screenWidth = roomManager.screenWidth || 1200;

        // Check for room transitions at screen edges
        if (this.position.x <= 10 && this.velocity.x < 0) {
            // Try to transition left
            if (roomManager.startTransition('left', this)) {
                this.startTransitionCooldown();
            }
        } else if (this.position.x >= screenWidth - this.size.x - 10 && this.velocity.x > 0) {
            // Try to transition right
            if (roomManager.startTransition('right', this)) {
                this.startTransitionCooldown();
            }
        }
    }

    startTransitionCooldown() {
        this.canTransition = false;
        this.transitionTimer = this.transitionCooldown;
    }

    startAttack(roomManager) {
        const currentWeapon = this.weaponManager.getCurrentWeapon();
        console.log(`Starting attack with ${currentWeapon.name}!`);
        
        this.isAttacking = true;
        this.attackTimer = currentWeapon.attackDuration;
        
        // Create attack hitbox and check for enemies
        const attackRect = new Rectangle(
            this.position.x + (this.facing > 0 ? this.size.x : -currentWeapon.range),
            this.position.y,
            currentWeapon.range,
            this.size.y
        );

        // Call weapon-specific attack logic
        currentWeapon.onAttackStart(this);

        console.log('Attack rect:', attackRect);
        console.log('Attack timer set to:', this.attackTimer);
        console.log('Is attacking:', this.isAttacking);

        // Check for enemies in attack range and deal damage
        if (roomManager && roomManager.getCurrentRoom()) {
            const currentRoom = roomManager.getCurrentRoom();
            const enemiesHit = currentRoom.damageEnemiesInRange(
                this.position, 
                this.size,
                currentWeapon.range, 
                this.facing, 
                currentWeapon.damage
            );
            
            if (enemiesHit > 0) {
                console.log(`Hit ${enemiesHit} enemy(ies)!`);
            }
        }
    }

    updateHealth() {
        // Health bar is now rendered directly on canvas in render() method
        // No DOM manipulation needed
    }

    updateInvincibility(deltaTime) {
        if (this.isInvincible) {
            this.invincibilityTimer -= deltaTime;
            this.flashTimer += deltaTime;
            
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
                this.invincibilityTimer = 0;
                this.flashTimer = 0;
            }
        }
        
        if (this.isKnockedBack) {
            this.knockbackTimer -= deltaTime;
            
            if (this.knockbackTimer <= 0) {
                this.isKnockedBack = false;
                this.knockbackTimer = 0;
            }
        }
    }

    takeDamage(amount, enemyPosition = null) {
        console.log('takeDamage called!', amount, enemyPosition, 'isInvincible:', this.isInvincible);
        
        // Don't take damage if invincible
        if (this.isInvincible) {
            console.log('Player is invincible, ignoring damage');
            return;
        }
        
        this.health = Math.max(0, this.health - amount);
        
        // Start invincibility period
        this.isInvincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        this.flashTimer = 0;
        
        // Apply knockback if enemy position is provided
        if (enemyPosition) {
            console.log('Enemy position provided for knockback:', enemyPosition);
            console.log('Enemy position details:', {
                position: enemyPosition.position,
                size: enemyPosition.size
            });
            
            const knockbackForce = 800; // Much stronger knockback
            const upwardForce = 500; // Strong upward component
            
            // Use correct enemy position structure (enemy.position.x, not enemy.x)
            const knockbackDirection = new Vector2(
                this.position.x + this.size.x/2 - (enemyPosition.position.x + enemyPosition.size.x/2),
                this.position.y + this.size.y/2 - (enemyPosition.position.y + enemyPosition.size.y/2)
            );
            
            console.log('Knockback direction calculation:', {
                playerCenter: { x: this.position.x + this.size.x/2, y: this.position.y + this.size.y/2 },
                enemyCenter: { x: enemyPosition.position.x + enemyPosition.size.x/2, y: enemyPosition.position.y + enemyPosition.size.y/2 },
                direction: { x: knockbackDirection.x, y: knockbackDirection.y }
            });
            
            // Normalize and apply knockback
            if (knockbackDirection.length() > 0) {
                knockbackDirection.normalize();
                
                // Apply strong horizontal knockback
                this.velocity.x = knockbackDirection.x * knockbackForce;
                
                // Always apply significant upward force, regardless of enemy position
                this.velocity.y = -upwardForce; // Always launch upward
                
                // Activate knockback state to override ground physics temporarily
                this.isKnockedBack = true;
                this.knockbackTimer = this.knockbackDuration;
                this.isGrounded = false; // Force player into air
                
                console.log(`Knockback applied! Direction: ${knockbackDirection.x.toFixed(2)}, ${knockbackDirection.y.toFixed(2)}, Velocity: ${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)}`);
                console.log('Knockback state:', { isKnockedBack: this.isKnockedBack, knockbackTimer: this.knockbackTimer });
            }
        } else {
            console.log('No enemy position provided for knockback!');
        }
        
        console.log(`Player took ${amount} damage! Health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // Weapon management methods
    switchWeapon(weaponId) {
        return this.weaponManager.switchWeapon(weaponId);
    }

    getCurrentWeapon() {
        return this.weaponManager.getCurrentWeapon();
    }

    addWeapon(weaponId, weapon) {
        this.weaponManager.addWeapon(weaponId, weapon);
    }

    render(ctx, debugMode = false) {
        ctx.save();
        
        // Draw player shadow only when grounded
        if (this.isGrounded) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.ellipse(
                this.position.x + this.size.x / 2,
                this.position.y + this.size.y + 2,
                this.size.x / 2 - 2, 8, 0, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Draw player outline/contour for visibility on any background
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.position.x - 1, this.position.y - 1, this.size.x + 2, this.size.y + 2);
        
        // Draw inner white outline for extra contrast
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x - 0.5, this.position.y - 0.5, this.size.x + 1, this.size.y + 1);

        // Draw player body with Microsoft logo
        // Determine player color based on invincibility status
        let playerColor = '#ffffff'; // Default white
        if (this.isInvincible) {
            // Flash white more brightly during invincibility
            const flashCycle = Math.floor(this.flashTimer / this.flashInterval) % 2;
            playerColor = flashCycle === 0 ? '#ffffff' : '#ffffdd'; // Flash between white and very light yellow
        }
        
        ctx.fillStyle = playerColor;
        ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
        
        // Draw Microsoft logo (4 colored squares)
        const logoSize = 8; // Slightly larger for better visibility
        const logoSpacing = 1;
        const logoStartX = this.position.x + (this.size.x - (logoSize * 2 + logoSpacing)) / 2;
        const logoStartY = this.position.y + (this.size.y - (logoSize * 2 + logoSpacing)) / 2 + 8;
        
        // Top-left square (red) - with outline
        ctx.fillStyle = '#f35325';
        ctx.fillRect(logoStartX, logoStartY, logoSize, logoSize);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(logoStartX, logoStartY, logoSize, logoSize);
        
        // Top-right square (green) - with outline
        ctx.fillStyle = '#81bc06';
        ctx.fillRect(logoStartX + logoSize + logoSpacing, logoStartY, logoSize, logoSize);
        ctx.strokeRect(logoStartX + logoSize + logoSpacing, logoStartY, logoSize, logoSize);
        
        // Bottom-left square (blue) - with outline
        ctx.fillStyle = '#05a6f0';
        ctx.fillRect(logoStartX, logoStartY + logoSize + logoSpacing, logoSize, logoSize);
        ctx.strokeRect(logoStartX, logoStartY + logoSize + logoSpacing, logoSize, logoSize);
        
        // Bottom-right square (yellow) - with outline
        ctx.fillStyle = '#ffba08';
        ctx.fillRect(logoStartX + logoSize + logoSpacing, logoStartY + logoSize + logoSpacing, logoSize, logoSize);
        ctx.strokeRect(logoStartX + logoSize + logoSpacing, logoStartY + logoSize + logoSpacing, logoSize, logoSize);
        
        // Draw player face direction indicator with outline
        ctx.fillStyle = '#2E7D32';
        const eyeX = this.position.x + (this.facing > 0 ? this.size.x - 10 : 6);
        const eyeY = this.position.y + 10;
        
        // Eyes with black outline
        ctx.fillRect(eyeX, eyeY, 4, 4);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(eyeX, eyeY, 4, 4);
        
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(eyeX, eyeY + 8, 4, 4);
        ctx.strokeRect(eyeX, eyeY + 8, 4, 4);

        // Draw current weapon on player
        const currentWeapon = this.weaponManager.getCurrentWeapon();
        if (!this.isAttacking) {
            currentWeapon.renderOnPlayer(ctx, this);
        }

        // Draw weapon attack animation when attacking
        if (this.isAttacking) {
            const attackProgress = 1 - (this.attackTimer / currentWeapon.attackDuration);
            currentWeapon.renderAttack(ctx, this, attackProgress, debugMode);
        }

        // Draw enhanced movement indicator with outline
        if (Math.abs(this.velocity.x) > 10) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.position.x - 2, this.position.y - 2, this.size.x + 4, this.size.y + 4);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.position.x - 1.5, this.position.y - 1.5, this.size.x + 3, this.size.y + 3);
        }

        // Draw grounded indicator
        if (this.isGrounded) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.position.x + this.size.x / 2 - 2, this.position.y - 8, 4, 4);
        }

        // Draw health bar above player (only when missing health)
        if (this.health < this.maxHealth) {
            const healthBarWidth = 40;
            const healthBarHeight = 6;
            const healthBarX = this.position.x + this.size.x / 2 - healthBarWidth / 2;
            const healthBarY = this.position.y - 20;
            const healthPercent = this.health / this.maxHealth;

            // Health bar background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, healthBarHeight + 2);
            
            // Health bar border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            
            // Health bar fill
            const fillWidth = healthBarWidth * healthPercent;
            let healthColor;
            if (healthPercent > 0.6) {
                healthColor = '#4CAF50'; // Green
            } else if (healthPercent > 0.3) {
                healthColor = '#FF9800'; // Orange
            } else {
                healthColor = '#F44336'; // Red
            }
            
            ctx.fillStyle = healthColor;
            ctx.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
        }

        // Draw player hitbox in debug mode
        if (debugMode) {
            const rect = this.getRect();
            ctx.save();
            ctx.strokeStyle = '#00ff00'; // Green for player hitbox
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            ctx.restore();
        }

        ctx.restore();
    }

    checkEnemyCollisions(roomManager) {
        if (!roomManager || !roomManager.getCurrentRoom()) return;
        
        const currentRoom = roomManager.getCurrentRoom();
        
        // Check if any enemy is colliding with the player
        const collidingEnemy = currentRoom.checkPlayerEnemyCollisions(this);
        if (collidingEnemy) {
            console.log('Enemy collision detected!', collidingEnemy);
            // Take damage from enemy collision with knockback
            this.takeDamage(10, collidingEnemy); // Pass enemy for knockback calculation
        }
    }

    die() {
        console.log('Player died!');
        
        // Call death callback if set
        if (this.onDeath) {
            this.onDeath();
        }
        
        // Reset health to prevent death loop during respawn
        this.health = this.maxHealth;
        
        // Reset any ongoing states
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.isKnockedBack = false;
        this.knockbackTimer = 0;
        this.velocity = new Vector2(0, 0);
    }

    getRect() {
        return new Rectangle(this.position.x, this.position.y, this.size.x, this.size.y);
    }
}
