// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load player and enemy images
const playerImage = new Image();
playerImage.src = 'Rick.png';  // Replace with the correct path to your player image

const enemyImage = new Image();
enemyImage.src = 'PCN.png';  // Replace with the correct path to your enemy image

// Set up the player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 20,
    height: 20,
    speed: 3,
    health: 100,
    maxHealth: 100
};

let score = 0;
let bulletPower = 1;

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
    const enemy = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        width: size,
        height: size,
        speed: enemySpeed
    };
    enemies.push(enemy);
}

// Spawn enemies and increase difficulty over time
setInterval(() => {
    spawnEnemy();

    if (Math.floor(performance.now() / 1000) % 10 === 0) {
        enemySpeed += 0.2;
    }

    if (Math.floor(performance.now() / 1000) % 20 === 0 && enemySpawnInterval > 500) {
        clearInterval(enemySpawnInterval);
        enemySpawnInterval -= 200;
        setInterval(spawnEnemy, enemySpawnInterval);
    }
}, enemySpawnInterval);

// Auto-shoot projectiles every second
setInterval(() => {
    for (let i = 0; i < bulletPower; i++) {
        const angle = (Math.PI / bulletPower) * i;
        const projectile = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            size: 5,
            speed: 5,
            color: 'yellow',
            dx: Math.cos(angle) * 5,
            dy: Math.sin(angle) * 5
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
        color: 'blue',
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
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.size, powerUp.size);
    });

    drawHealthBar();
    drawScore();
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
    ctx.fillText(`Health: ${player.health}`, x + 10, y + 15);
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width - 120, 30);
}

// Start the game loop
gameLoop();
