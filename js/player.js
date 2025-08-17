class Player {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(32, 48);
        this.maxHealth = 100;
        this.health = this.maxHealth;
        
        // Movement properties
        this.speed = 300;
        this.jumpPower = 500;
        this.gravity = 1200;
        this.groundDrag = 0.1;  // Lower value = less drag = more movement
        this.airDrag = 0.02;    // Very low air drag for better air control
        this.isGrounded = false;
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
    }

    update(deltaTime, roomManager, inputManager) {
        this.handleInput(inputManager, deltaTime, roomManager);
        this.updatePhysics(deltaTime, roomManager);
        this.updateCombat(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateTransitions(deltaTime);
        this.checkRoomTransitions(roomManager, inputManager);
        this.updateHealth();
    }

    handleInput(inputManager, deltaTime, roomManager) {
        const currentRoom = roomManager.getCurrentRoom();
        if (!currentRoom || roomManager.isTransitioning) return;

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
            this.startAttack();
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

        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // Update coyote timer
        if (!this.isGrounded) {
            this.coyoteTimer -= deltaTime;
        }

        // Calculate next position
        const nextPosition = this.position.add(this.velocity.multiply(deltaTime));
        
        // Collision detection and response
        this.handleCollisions(nextPosition, currentRoom);
        
        // Keep player in bounds (temporary, until room transitions)
        this.position.x = clamp(this.position.x, 0, 1200 - this.size.x);
        this.position.y = clamp(this.position.y, 0, 800 - this.size.y);
    }

    handleCollisions(nextPosition, room) {
        // First, check if we're grounded by checking below current position
        const groundCheckRect = new Rectangle(
            this.position.x, this.position.y + this.size.y,
            this.size.x, 2
        );
        const groundCollisions = room.checkCollisions(groundCheckRect);
        this.isGrounded = groundCollisions.length > 0;

        // Now handle movement collisions
        // Check X movement first - but only check for actual wall collisions
        const xRect = new Rectangle(
            nextPosition.x, this.position.y,
            this.size.x, this.size.y
        );
        
        const xCollisions = room.checkCollisions(xRect);
        if (xCollisions.length > 0) {
            // Filter out collisions that are just the ground platform we're standing on
            const wallCollisions = xCollisions.filter(collision => {
                // If collision is below the player's center, it's likely a ground platform
                return collision.y < this.position.y + this.size.y / 2;
            });
            
            if (wallCollisions.length > 0) {
                // Debug: log what we're colliding with
                console.log('Wall Collision detected:', wallCollisions[0]);
                console.log('Player trying to move from', this.position.x, 'to', nextPosition.x);
                
                // Hit a wall, stop horizontal movement
                this.velocity.x = 0;
                nextPosition.x = this.position.x;
            }
        }

        // Check Y movement
        const yRect = new Rectangle(
            nextPosition.x, nextPosition.y,
            this.size.x, this.size.y
        );
        
        const yCollisions = room.checkCollisions(yRect);
        if (yCollisions.length > 0) {
            const collision = yCollisions[0];
            
            if (this.velocity.y > 0) {
                // Falling - land on platform
                nextPosition.y = collision.y - this.size.y;
                this.velocity.y = 0;
                this.isGrounded = true;
                this.coyoteTimer = this.coyoteTime;
            } else if (this.velocity.y < 0) {
                // Jumping - hit ceiling
                nextPosition.y = collision.y + collision.height;
                this.velocity.y = 0;
            }
        }

        this.position = nextPosition;
    }

    updateCombat(deltaTime) {
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

        // Check for room transitions at screen edges
        if (this.position.x <= 10 && this.velocity.x < 0) {
            // Try to transition left
            if (roomManager.startTransition('left', this)) {
                this.startTransitionCooldown();
            }
        } else if (this.position.x >= 1200 - this.size.x - 10 && this.velocity.x > 0) {
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

    startAttack() {
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

        // TODO: Check for enemies in attack range and deal damage
    }

    updateHealth() {
        // Update health bar
        const healthPercent = this.health / this.maxHealth;
        const healthFill = document.getElementById('healthFill');
        if (healthFill) {
            healthFill.style.width = `${healthPercent * 100}%`;
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Add some visual feedback for taking damage
        // TODO: Add damage flash effect
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

    render(ctx) {
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

        // Draw player body with Microsoft logo
        ctx.fillStyle = '#ffffff'; // Always white, no color change when attacking
        ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
        
        // Draw Microsoft logo (4 colored squares)
        const logoSize = 6;
        const logoSpacing = 1;
        const logoStartX = this.position.x + (this.size.x - (logoSize * 2 + logoSpacing)) / 2;
        const logoStartY = this.position.y + (this.size.y - (logoSize * 2 + logoSpacing)) / 2 + 8;
        
        // Top-left square (red)
        ctx.fillStyle = '#f35325';
        ctx.fillRect(logoStartX, logoStartY, logoSize, logoSize);
        
        // Top-right square (green)
        ctx.fillStyle = '#81bc06';
        ctx.fillRect(logoStartX + logoSize + logoSpacing, logoStartY, logoSize, logoSize);
        
        // Bottom-left square (blue)
        ctx.fillStyle = '#05a6f0';
        ctx.fillRect(logoStartX, logoStartY + logoSize + logoSpacing, logoSize, logoSize);
        
        // Bottom-right square (yellow)
        ctx.fillStyle = '#ffba08';
        ctx.fillRect(logoStartX + logoSize + logoSpacing, logoStartY + logoSize + logoSpacing, logoSize, logoSize);
        
        // Draw player face direction indicator
        ctx.fillStyle = '#2E7D32';
        const eyeX = this.position.x + (this.facing > 0 ? this.size.x - 8 : 4);
        const eyeY = this.position.y + 8;
        ctx.fillRect(eyeX, eyeY, 4, 4);
        ctx.fillRect(eyeX, eyeY + 8, 4, 4);

        // Draw current weapon on player
        const currentWeapon = this.weaponManager.getCurrentWeapon();
        if (!this.isAttacking) {
            currentWeapon.renderOnPlayer(ctx, this);
        }

        // Draw weapon attack animation when attacking
        if (this.isAttacking) {
            const attackProgress = 1 - (this.attackTimer / currentWeapon.attackDuration);
            currentWeapon.renderAttack(ctx, this, attackProgress);
        }

        // Draw movement indicator
        if (Math.abs(this.velocity.x) > 10) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.position.x - 1, this.position.y - 1, this.size.x + 2, this.size.y + 2);
        }

        // Draw grounded indicator
        if (this.isGrounded) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.position.x + this.size.x / 2 - 2, this.position.y - 8, 4, 4);
        }

        ctx.restore();
    }

    getRect() {
        return new Rectangle(this.position.x, this.position.y, this.size.x, this.size.y);
    }
}
