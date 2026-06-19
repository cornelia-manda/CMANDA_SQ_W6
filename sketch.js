// ============================================================
// Week 6 Side Quest — SAVE THE SPIDERS
// ============================================================

// ------------------------------------------------------------
// WORLD
// ------------------------------------------------------------
const WORLD_LENGTH = 1500;
const SCROLL_SPEED = 2.0;
let scrollY = 0;

// ------------------------------------------------------------
// PLAYER CONFIGURATION
// ------------------------------------------------------------
const PLAYER_SPEED = 6;
const BULLET_SPEED = 18;
const SHOOT_COOLDOWN = 12;
const INVINCIBLE_FRAMES = 90;

// ------------------------------------------------------------
// ENEMY CONFIGURATION
// ------------------------------------------------------------
const ENEMY_SPAWN_RATE = 70;
const MAX_ENEMIES = 8;
let spawnTimer = 0;

// ------------------------------------------------------------
// DATA & ASSETS
// ------------------------------------------------------------
let obstacleData;
let obstacles = [];

// Visual Assets
let bgImage;
let playerSheet;
let enemySheet;

// Sound Assets
let music;
let shootSound;
let winSound;

// ------------------------------------------------------------
// SPRITE SHEET CONFIGURATIONS (Week 5 Rules)
// ------------------------------------------------------------
const PLAYER_SPRITE = {
  frameWidth: 80, // Width of one individual frame cell (240 / 3 = 80)
  frameHeight: 64, // Height of one individual frame cell (256 / 4 = 64)
  numFrames: 3, // Total frames horizontally across your sheet (3 spiders in a row)
  animSpeed: 0.15,
};

const ENEMY_SPRITE = {
  frameWidth: 64, // Width of one individual owl cell
  frameHeight: 64, // Height of one individual owl cell
  numFrames: 4,
  animSpeed: 0.1,
};

// ------------------------------------------------------------
// STATE ENTITIES
// ------------------------------------------------------------
let player = {
  x: 400,
  y: 370,
  r: 22,
  currentFrame: 0,
  direction: { x: 0, y: -1 },
  shootTimer: 0,
  health: 8,
  maxHealth: 8,
  invincible: false,
  invincibleTimer: 0,
  bounceVX: 0,
  bounceVY: 0,
};

let bullets = [];
let enemies = [];

let score = 0;
const STATE_START = "start";
const STATE_PLAY = "play";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_START;

// ============================================================
// preload()
// ============================================================
function preload() {
  console.log("Preload starting...");

  // Loaded directly from your root directory instead of data/
  try {
    obstacleData = loadJSON("data/obstacles.json");
    console.log("✓ Loaded obstacles.json");
  } catch (e) {
    console.error("Failed to load obstacles.json:", e);
    obstacleData = { obstacles: [] };
  }

  // Comment out problematic assets for now
  // Load root theme assets
  bgImage = loadImage("assets/images/background.jpg");
  console.log("✓ Loaded background.jpg");
  playerSheet = loadImage("assets/images/spider.png");
  console.log("✓ Loaded spider.png");
  enemySheet = loadImage("assets/images/enemy-owl.png");
  console.log("✓ Loaded enemy-owl.png");

  // Audio Assets
  // music = loadSound("assets/audio/background-audio.mp3");
  // shootSound = loadSound("assets/audio/jump.mp3");
  // winSound = loadSound("assets/audio/win.mp3");

  console.log("Preload complete!");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(800, 450);

  // Build out obstacles array from the JSON layout properties
  if (
    obstacleData &&
    obstacleData.obstacles &&
    Array.isArray(obstacleData.obstacles)
  ) {
    for (let i = 0; i < obstacleData.obstacles.length; i++) {
      let o = obstacleData.obstacles[i];
      obstacles.push({
        x: o.x || 200,
        worldY: o.worldY || -300,
        size: o.size || 50,
      });
    }
  }
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(15, 15, 25);

  if (gameState === STATE_START) {
    drawStartScreen();
  } else if (gameState === STATE_PLAY) {
    scrollWorld();
    drawBackground();
    drawObstacles();
    handleInput();
    applyBounce();
    updateBullets();
    updateEnemies();
    spawnEnemies();
    checkBulletEnemyCollisions();
    checkEnemyPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();
    checkLevelComplete();
    drawEnemies();
    drawBullets();
    drawPlayer();
    drawHUD();
  } else if (gameState === STATE_WIN) {
    drawWinScreen();
  } else if (gameState === STATE_OVER) {
    drawGameOver();
  }
}

function drawStartScreen() {
  background(20, 20, 35);
  fill(150, 100, 220);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("SAVE THE SPIDERS FROM THE OWLS", width / 2, height / 2 - 40);

  fill(255);
  textSize(18);
  text(
    "Click Anywhere on Canvas to Start Saving Spiders!",
    width / 2,
    height / 2 + 10,
  );

  fill(140);
  textSize(13);
  textFont("monospace");
  text("WASD / Arrows to Move • Spacebar to Shoot", width / 2, height / 2 + 65);
}

function mousePressed() {
  if (gameState === STATE_START) {
    gameState = STATE_PLAY;
    if (music && typeof music.loop === "function") {
      try {
        userStartAudio();
        music.loop();
        music.setVolume(0.3);
      } catch (e) {
        console.log("Audio Context initialized cleanly.");
      }
    }
  }
}

function scrollWorld() {
  if (scrollY < WORLD_LENGTH) {
    scrollY += SCROLL_SPEED;
  }
}

function drawBackground() {
  if (bgImage && bgImage.width > 1) {
    // Make background much larger so only a portion shows
    let bgScale = 3; // 3x larger than canvas
    let scaledWidth = width * bgScale;
    let scaledHeight = height * bgScale;
    let bgY = (-scrollY * 0.5) % scaledHeight;
    if (bgY > 0) bgY -= scaledHeight;

    image(bgImage, 0, bgY, scaledWidth, scaledHeight);
    image(bgImage, 0, bgY + scaledHeight, scaledWidth, scaledHeight);
  }

  stroke(255, 255, 255, 0);
  strokeWeight(1);
  // line(0, 70, width, 70);
  noStroke();
}

function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let screenY = o.worldY + scrollY;

    if (screenY < -o.size || screenY > height + o.size) continue;

    let x = o.x - o.size / 2;
    let y = screenY - o.size / 2;
    let s = o.size;

    push();
    // Draw stone-like obstacle
    let glow = map(sin(frameCount * 0.04 + i), -1, 1, 30, 85);
    noStroke();
    fill(100, 90, 80, glow);
    rect(x - 6, y - 6, s + 12, s + 12, 6);

    // Stone texture - gray with darker shading
    fill(140, 130, 120);
    rect(x, y, s, s, 4);

    // Add rocky texture with circles
    fill(110, 100, 90);
    circle(x + s * 0.3, y + s * 0.3, s * 0.25);
    circle(x + s * 0.7, y + s * 0.4, s * 0.2);
    circle(x + s * 0.5, y + s * 0.7, s * 0.22);

    // Shadow/depth
    stroke(80, 70, 60);
    strokeWeight(1.5);
    line(x + s * 0.2, y + s * 0.5, x + s * 0.8, y + s * 0.5);
    noStroke();
    pop();
  }
}

function checkObstaclePlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let screenY = o.worldY + scrollY;

    if (screenY < -o.size || screenY > height + o.size) continue;

    let closestX = constrain(player.x, o.x - o.size / 2, o.x + o.size / 2);
    let closestY = constrain(
      player.y,
      screenY - o.size / 2,
      screenY + o.size / 2,
    );
    let d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      player.health -= 2;
      player.invincible = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;

      let dx = player.x - o.x;
      let dy = player.y - screenY;
      let len = dist(0, 0, dx, dy);
      if (len > 0) {
        player.bounceVX = (dx / len) * 8;
        player.bounceVY = (dy / len) * 8;
      }

      if (player.health <= 0) {
        gameState = STATE_OVER;
        if (music) music.stop();
      }
      break;
    }
  }
}

function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;
    player.bounceVX *= 0.75;
    player.bounceVY *= 0.75;

    player.x = constrain(player.x, player.r, width - player.r);
    player.y = constrain(player.y, 70 + player.r, height - player.r);
  }
}

function handleInput() {
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) {
    player.y -= PLAYER_SPEED;
    player.direction = { x: 0, y: -1 };
  }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
    player.y += PLAYER_SPEED;
    player.direction = { x: 0, y: 1 };
  }
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) {
    player.x -= PLAYER_SPEED;
    player.direction = { x: -1, y: 0 };
  }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {
    player.x += PLAYER_SPEED;
    player.direction = { x: 1, y: 0 };
  }

  player.x = constrain(player.x, player.r, width - player.r);
  player.y = constrain(player.y, 70 + player.r, height - player.r);

  if (player.shootTimer > 0) player.shootTimer--;

  if (keyIsDown(32) && player.shootTimer === 0) {
    bullets.push({
      x: player.x + player.direction.x * (player.r + 4),
      y: player.y + player.direction.y * (player.r + 4),
      vx: player.direction.x * BULLET_SPEED,
      vy: player.direction.y * BULLET_SPEED,
    });
    player.shootTimer = SHOOT_COOLDOWN;
    if (shootSound) shootSound.play();
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;

    if (
      bullets[i].x < 0 ||
      bullets[i].x > width ||
      bullets[i].y < 0 ||
      bullets[i].y > height
    ) {
      bullets.splice(i, 1);
    }
  }
}

function spawnEnemies() {
  if (enemies.length >= MAX_ENEMIES) return;

  spawnTimer++;
  if (spawnTimer < ENEMY_SPAWN_RATE) return;
  spawnTimer = 0;

  let progress = scrollY / WORLD_LENGTH;
  let speed = 0.8 + progress * 1.0;

  enemies.push({
    x: random(30, width - 30),
    y: -25,
    r: 35,
    speed: speed,
    currentFrame: 0,
  });
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = dist(e.x, e.y, player.x, player.y);

    if (d > 0) {
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }

    e.y += SCROLL_SPEED;

    if (e.y > height + 30) {
      enemies.splice(i, 1);
    }
  }
}

function checkBulletEnemyCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      let d = dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y);
      if (d < enemies[j].r + 8) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
        break;
      }
    }
  }
}

// ------------------------------------------------------------
// STATE HANDLING & COLLISION LOOPS
// ------------------------------------------------------------
function checkEnemyPlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < enemies.length; i++) {
    let d = dist(player.x, player.y, enemies[i].x, enemies[i].y);
    if (d < player.r + enemies[i].r - 6) {
      player.health -= 2;
      player.invincible = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;

      if (player.health <= 0) {
        gameState = STATE_OVER;
        if (music) music.stop();
      }
      break;
    }
  }
}

function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

function checkLevelComplete() {
  if (scrollY >= WORLD_LENGTH) {
    gameState = STATE_WIN;
    if (winSound) winSound.play();
    if (music) music.stop();
  }
}

function drawBullets() {
  // Draw webs instead of plain circles
  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];
    push();
    stroke(200, 200, 200, 180);
    strokeWeight(1.5);
    noFill();
    // Draw a web-like shape
    ellipse(b.x, b.y, 10);
    line(b.x - 5, b.y - 5, b.x + 5, b.y + 5);
    line(b.x - 5, b.y + 5, b.x + 5, b.y - 5);
    pop();
  }
}

function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];

    if (enemySheet && enemySheet.width > 1) {
      e.currentFrame =
        (e.currentFrame + ENEMY_SPRITE.animSpeed) % ENEMY_SPRITE.numFrames;
      let frameX = floor(e.currentFrame) * ENEMY_SPRITE.frameWidth;

      push();
      imageMode(CENTER);
      image(
        enemySheet,
        e.x,
        e.y,
        e.r * 2.5,
        e.r * 2.5,
        frameX,
        0,
        ENEMY_SPRITE.frameWidth,
        ENEMY_SPRITE.frameHeight,
      );
      pop();
    } else {
      fill(255, 100, 100);
      ellipse(e.x, e.y, e.r * 2);
    }
  }
}

function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) return;

  if (playerSheet && playerSheet.width > 1) {
    player.currentFrame =
      (player.currentFrame + PLAYER_SPRITE.animSpeed) % PLAYER_SPRITE.numFrames;
    let frameX = floor(player.currentFrame) * PLAYER_SPRITE.frameWidth;

    // Determine which row based on direction
    let frameY = 0;
    if (player.direction.y < 0)
      frameY = 3; // Up
    else if (player.direction.y > 0)
      frameY = 0; // Down
    else if (player.direction.x < 0)
      frameY = 1; // Left
    else if (player.direction.x > 0) frameY = 2; // Right

    let spriteY = frameY * PLAYER_SPRITE.frameHeight;

    push();
    imageMode(CENTER);
    image(
      playerSheet,
      player.x,
      player.y,
      player.r * 2.5,
      player.r * 2.5,
      frameX,
      spriteY,
      PLAYER_SPRITE.frameWidth,
      PLAYER_SPRITE.frameHeight,
    );
    pop();
  } else {
    fill(100, 230, 210);
    ellipse(player.x, player.y, player.r * 2);
  }
}

function drawHUD() {
  noStroke();
  fill(180);
  textSize(13);
  textAlign(LEFT);
  textFont("monospace");
  text("Move: WASD/Arrows   Shoot: Space", 16, 24);

  fill(255);
  textSize(16);
  textAlign(RIGHT);
  text("Spiders Saved: " + score, width - 16, 28);

  let barW = 160;
  let barH = 14;
  let barX = width - barW - 16;
  let barY = 40;
  let fillW = map(player.health, 0, player.maxHealth, 0, barW);

  fill(40);
  rect(barX, barY, barW, barH, 4);

  let healthColour = lerpColor(
    color(200, 50, 50),
    color(50, 180, 90),
    player.health / player.maxHealth,
  );
  fill(healthColour);
  rect(barX, barY, fillW, barH, 4);

  let progBarX = width - 6;
  let progBarH = height - 40;
  let progBarY = 20;
  let progFill = map(scrollY, 0, WORLD_LENGTH, 0, progBarH);

  fill(40);
  rect(progBarX, progBarY, 4, progBarH, 2);
  fill(150, 100, 220);
  rect(progBarX, progBarY + progFill, 4, progBarH - progFill, 2);
}

function drawWinScreen() {
  background(10, 25, 15);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(44);
  text("You Made It To Safety!", width / 2, height / 2 - 30);
  fill(180);
  textSize(16);
  text("Final Score: " + score, width / 2, height / 2 + 15);
  textSize(14);
  fill(100);
  text("Press R to save more spiders", width / 2, height / 2 + 55);
}

// ------------------------------------------------------------
// END CONTEXTS
// ------------------------------------------------------------
function drawGameOver() {
  background(25, 10, 10);
  fill(220, 60, 60);
  textAlign(CENTER, CENTER);
  textSize(44);
  text("The Owls Won", width / 2, height / 2 - 30);
  fill(180);
  textSize(16);
  text("Score: " + score, width / 2, height / 2 + 15);
  textSize(14);
  fill(100);
  text("Press R to retry", width / 2, height / 2 + 55);
}

function keyPressed() {
  if (
    (key === "r" || key === "R") &&
    gameState !== STATE_PLAY &&
    gameState !== STATE_START
  ) {
    gameState = STATE_PLAY;
    score = 0;
    scrollY = 0;
    spawnTimer = 0;
    bullets = [];
    enemies = [];
    player.x = 400;
    player.y = 370;
    player.health = player.maxHealth;
    player.invincible = false;
    if (music) music.loop();
  }
}
