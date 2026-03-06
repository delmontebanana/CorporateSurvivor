// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load player, enemy, and power-up images
const playerImage = new Image();
playerImage.src = 'archive/images/Rick.png';  // Replace with the correct path to your player image

const enemyImage = new Image();
enemyImage.src = 'archive/images/PCN.png';  // Replace with the correct path to your enemy image

const powerUpImage = new Image();
powerUpImage.src = 'archive/images/copilot.png';  // Replace with the correct path to your power-up image

// Load background music and level-up sound
const backgroundMusic = new Audio('archive/sounds/Retro.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const levelUpSound = new Audio('archive/sounds/levelup.mp3');

// Play background music after user interaction
document.addEventListener('click', () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => console.error('Autoplay prevented:', error));
    }
});

// Set up the player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 35,
    height: 35,
    speed: 3,
    health: 100,
    maxHealth: 100,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    damageMultiplier: 1 // Add damage multiplier for level-ups
};

let score = 0;
let bulletPower = 1;
let killCount = 0; // Track the number of kills

// Key tracking
let keys = {};

// Enemy, projectile, and power-up arrays
const enemies = [];
const projectiles = [];
const powerUps = [];

// Enemy spawn settings
let enemySpawnInterval = 2000; // Start with 2 seconds between spawns
let enemySpeed = 1.5; // Initial enemy speed

// Listen for keyboard events
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Function to spawn enemies
function spawnEnemy() {
    const size = 20;
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;

    if (edge === 0) { // Top
        x = Math.random() * canvas.width;
        y = -size;
    } else if (edge === 1) { // Right
        x = canvas.width + size;
        y = Math.random() * canvas.height;
    } else if (edge === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + size;
    } else { // Left
        x = -size;
        y = Math.random() * canvas.height;
    }

    const enemy = {
        x: x,
        y: y,
        width: size,
        height: size,
        speed: enemySpeed
    };
    enemies.push(enemy);
}

// Spawn enemies and increase difficulty over time
let spawnIntervalId = setInterval(spawnEnemy, enemySpawnInterval);

setInterval(() => {
    if (Math.floor(performance.now() / 1000) % 10 === 0) {
        enemySpeed += 0.2;
    }

    if (Math.floor(performance.now() / 1000) % 20 === 0 && enemySpawnInterval > 500) {
        clearInterval(spawnIntervalId);
        enemySpawnInterval -= 200;
        spawnIntervalId = setInterval(spawnEnemy, enemySpawnInterval);
    }
}, 1000);

// Auto-shoot projectiles every second
setInterval(() => {
    for (let i = 0; i < bulletPower; i++) {
        const angle = (Math.PI * 2 / bulletPower) * i;
        const projectile = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            size: 5,
            speed: 5,
            color: 'yellow',
            dx: Math.cos(angle) * 5,
            dy: Math.sin(angle) * 5,
            damage: 10 * player.damageMultiplier // Apply damage multiplier
        };
        projectiles.push(projectile);
    }
}, 1000);

// Spawn power-ups every 10 seconds
setInterval(() => {
    const powerUp = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 15,
        type: 'power' // Now includes bullet power-up
    };
    powerUps.push(powerUp);
}, 10000);

// Game Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game logic
function update() {
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;

        if (projectile.y < 0 || projectile.y > canvas.height || projectile.x < 0 || projectile.x > canvas.width) {
            projectiles.splice(index, 1);
        }
    });

    projectiles.forEach((projectile, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.size > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.size > enemy.y) {
                enemies.splice(eIndex, 1);
                projectiles.splice(pIndex, 1);
                score += 10; // Increase score when enemy is hit
                gainExperience(20); // Gain experience when enemy is hit
                killCount++; // Increment kill count
            }
        });
    });

    enemies.forEach((enemy, eIndex) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            player.health -= 0.5;
        }
    });

    if (player.health <= 0) {
        alert("Game Over! You scored " + score + " points and survived for " + Math.floor(performance.now() / 1000) + " seconds.");
        document.location.reload();
    }

    powerUps.forEach((powerUp, index) => {
        if (player.x < powerUp.x + powerUp.size &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.size &&
            player.y + player.height > powerUp.y) {

            if (powerUp.type === 'power') {
                player.health = Math.min(player.maxHealth, player.health + 20);
                bulletPower += 1; // Increase bullet power
            }

            powerUps.splice(index, 1);
        }
    });
}

function gainExperience(amount) {
    player.experience += amount;
    if (player.experience >= player.experienceToNextLevel) {
        player.experience -= player.experienceToNextLevel;
        player.level += 1;
        player.experienceToNextLevel = Math.floor(player.experienceToNextLevel * 1.5);
        player.speed += 0.5; // Increase speed on level up
        player.damageMultiplier += 0.1; // Increase damage multiplier on level up
        levelUpSound.play(); // Play level-up sound
    }
}

// Draw the game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    enemies.forEach(enemy => {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    });

    projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.color;
        ctx.fillRect(projectile.x, projectile.y, projectile.size, projectile.size);
    });

    powerUps.forEach(powerUp => {
        ctx.drawImage(powerUpImage, powerUp.x, powerUp.y, powerUp.size, powerUp.size);
    });

    drawHealthBar();
    drawScore();
    drawExperienceBar();
}

function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;

    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthWidth = (player.health / player.maxHealth) * barWidth;
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, healthWidth, barHeight);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${Math.ceil(player.health)}`, x + 10, y + 15);
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);
    ctx.fillText(`Level: ${player.level}`, canvas.width - 150, 60);
    ctx.fillText(`Kills: ${killCount}`, canvas.width - 150, 90); // Display kill count
}

function drawExperienceBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 50;

    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);

    const expWidth = (player.experience / player.experienceToNextLevel) * barWidth;
    ctx.fillStyle = 'blue';
    ctx.fillRect(x, y, expWidth, barHeight);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`EXP: ${player.experience}/${player.experienceToNextLevel}`, x + 10, y + 15);
}

// Start the game loop
gameLoop();

