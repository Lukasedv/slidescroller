// Base Weapon class
class Weapon {
    constructor(name, damage, range, attackDuration, attackCooldown) {
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.attackDuration = attackDuration;
        this.attackCooldown = attackCooldown;
    }

    // Override in subclasses to render the weapon on the player
    renderOnPlayer(ctx, player) {
        // Default implementation - no visual
    }

    // Override in subclasses to render attack animation
    renderAttack(ctx, player, attackProgress, debugMode = false) {
        // Default implementation - no attack visual
    }

    // Override in subclasses for weapon-specific attack logic
    onAttackStart(player) {
        // Default implementation - basic attack
    }

    // Override in subclasses for weapon-specific attack effects
    onAttackHit(player, target) {
        // Default implementation - basic damage
        if (target && target.takeDamage) {
            target.takeDamage(this.damage);
        }
    }
}

// Punch Weapon - Default fist fighting
class PunchWeapon extends Weapon {
    constructor() {
        super("Fists", 25, 50, 0.3, 0.5); // Increased range from 35 to 50
        this.handSize = 8;
    }

    renderOnPlayer(ctx, player) {
        // Draw hands as balls at the front of the character like a boxer's stance
        const handOffset = 8; // Distance from each other
        const frontOffset = 6; // Distance in front of the character (closer to body)
        const baseX = player.position.x + (player.facing > 0 ? player.size.x + frontOffset : -frontOffset);
        const baseY = player.position.y + player.size.y / 2;
        
        // Add bobbing animation when moving
        let bobOffset = 0;
        if (Math.abs(player.velocity.x) > 10) {
            // Create bobbing effect based on animation timer (slower frequency)
            bobOffset = Math.sin(player.animationTimer * 8) * 2;
        }

        // Left and right hands positioned at the front
        const leftHandX = baseX - handOffset / 2;
        const rightHandX = baseX + handOffset / 2;
        const handY = baseY + bobOffset;

        // Left hand
        ctx.fillStyle = '#fdbcb4'; // Skin color
        ctx.beginPath();
        ctx.arc(leftHandX, handY, this.handSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Right hand
        ctx.beginPath();
        ctx.arc(rightHandX, handY, this.handSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Add knuckle details
        ctx.fillStyle = '#e69373';
        ctx.fillRect(leftHandX - 1, handY - 1, 2, 2);
        ctx.fillRect(rightHandX - 1, handY - 1, 2, 2);
    }

    renderAttack(ctx, player, attackProgress, debugMode = false) {
        // Calculate punch extension based on attack progress
        const maxPunchDistance = 25; // Increased to match new range
        const punchDistance = Math.sin(attackProgress * Math.PI) * maxPunchDistance;
        
        const armWidth = 4;
        const armLength = 12 + punchDistance;
        
        // Add bobbing animation when moving (even while attacking)
        let bobOffset = 0;
        if (Math.abs(player.velocity.x) > 10) {
            bobOffset = Math.sin(player.animationTimer * 8) * 1; // Smaller bob during attack, slower frequency
        }
        
        // Draw punching arm and hand
        const armStartX = player.position.x + (player.facing > 0 ? player.size.x : 0);
        const armY = player.position.y + player.size.y / 2 - 2 + bobOffset;
        const handX = armStartX + (player.facing > 0 ? armLength : -armLength - this.handSize);
        const handY = armY - this.handSize / 2;
        
        // Draw attack range indicator (semi-transparent area) - only in debug mode
        if (debugMode) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ffff00'; // Yellow attack area
            const attackWidth = this.range;
            const attackHeight = 80; // Match the hit detection area
            
            // Position attack area to align with weapon, not overlap with player
            const attackX = player.facing > 0 ? 
                player.position.x + player.size.x : // Start from right edge of player when facing right
                player.position.x - attackWidth;     // End at left edge of player when facing left
            const attackY = player.position.y - 20;
            
            ctx.fillRect(attackX, attackY, attackWidth, attackHeight);
            ctx.restore();
        }
        
        // Draw arm (rectangle extending from body)
        ctx.fillStyle = '#fdbcb4'; // Skin color
        if (player.facing > 0) {
            ctx.fillRect(armStartX, armY, armLength, armWidth);
        } else {
            ctx.fillRect(armStartX - armLength, armY, armLength, armWidth);
        }
        
        // Draw fist
        ctx.fillStyle = '#f4a88a'; // Slightly darker skin for fist
        ctx.fillRect(handX, handY, this.handSize, this.handSize);
        
        // Add knuckle details
        ctx.fillStyle = '#e69373';
        ctx.fillRect(handX + 1, handY + 1, 2, 2);
        ctx.fillRect(handX + 1, handY + 3, 2, 2);
        
        // Draw impact effect when punch is extended
        if (punchDistance > maxPunchDistance * 0.7) {
            const impactX = handX + (player.facing > 0 ? this.handSize : -8);
            const impactY = handY + this.handSize / 2;
            
            // Draw impact sparkles
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < 3; i++) {
                const sparkleX = impactX + (Math.random() - 0.5) * 12;
                const sparkleY = impactY + (Math.random() - 0.5) * 12;
                ctx.fillRect(sparkleX, sparkleY, 2, 2);
            }
            
            // Draw impact lines
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(impactX - 6, impactY - 6);
            ctx.lineTo(impactX + 6, impactY + 6);
            ctx.moveTo(impactX - 6, impactY + 6);
            ctx.lineTo(impactX + 6, impactY - 6);
            ctx.moveTo(impactX - 8, impactY);
            ctx.lineTo(impactX + 8, impactY);
            ctx.moveTo(impactX, impactY - 8);
            ctx.lineTo(impactX, impactY + 8);
            ctx.stroke();
        }
    }

    onAttackStart(player) {
        console.log('Punch attack started!');
    }
}

// Weapon Manager - handles weapon switching and creation
class WeaponManager {
    constructor() {
        this.weapons = {
            'punch': new PunchWeapon()
        };
        this.currentWeaponId = 'punch';
    }

    getCurrentWeapon() {
        return this.weapons[this.currentWeaponId];
    }

    switchWeapon(weaponId) {
        if (this.weapons[weaponId]) {
            this.currentWeaponId = weaponId;
            console.log(`Switched to weapon: ${this.weapons[weaponId].name}`);
            return true;
        }
        return false;
    }

    addWeapon(weaponId, weapon) {
        this.weapons[weaponId] = weapon;
    }

    getAvailableWeapons() {
        return Object.keys(this.weapons);
    }
}
