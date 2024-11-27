var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
const TURRET_SPRITE = new Image();
TURRET_SPRITE.src = 'turret.png';
const GAME_WIDTH = 256;
const GAME_HEIGHT = 256;
const TURRET_WIDTH = 16;
const TURRET_HEIGHT = 16;
const TURRET_SPEED = 20;
const ALIEN_WIDTH = 16;
const ALIEN_HEIGHT = 16;
const ALIEN_SPACING = 8;
const ALIEN_ROWS = 8;
const ALIEN_COLS = 5;
const LASER_WIDTH = 2;
const LASER_HEIGHT = 8;
const LASER_SPEED = 15;
var gameStart = false;
var lastTime = 0;
var gameOver = false;
var score = 0;
var turretCollided = false;
var lasers = [];
var aliens = [];
var shotReady = true;

/* Game objects */
var turret = {
    sprite: TURRET_SPRITE,
    x: GAME_WIDTH/2 - TURRET_WIDTH/2,
    y: GAME_HEIGHT - TURRET_HEIGHT,
    w: TURRET_WIDTH,
    h: TURRET_HEIGHT,
    x_vel: 0,
    movL: 0,
    movR: 0
};

/************* CREATION FUNCTIONS *************/

function laser(x, y, w, h, y_vel, group) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.y_vel = y_vel;
    this.group = group; // player or enemy
}

function alien(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

aliens = new Array(ALIEN_ROWS);
for (let i = 0; i < ALIEN_ROWS; i++) {
    aliens[i] = new Array(ALIEN_COLS);
}

for (let i = 0; i < ALIEN_ROWS; i++) {
    for (let j = 0; j < ALIEN_COLS; j++) {
        aliens[i][j] = new alien(i*ALIEN_WIDTH+i*ALIEN_SPACING+ALIEN_SPACING, j*ALIEN_HEIGHT+j*ALIEN_SPACING+ALIEN_SPACING, ALIEN_WIDTH, ALIEN_HEIGHT);
    }
}


/************* SUPPORT FUNCTIONS *************/

function resetGame() {
    gameOver = false;
    document.getElementById('game-over-text').innerHTML = '';
    turret.x = GAME_WIDTH/2 - TURRET_WIDTH/2;
    turret.y = GAME_HEIGHT - TURRET_HEIGHT;
}

function collisionCheck(ob1, ob2) {
    // If the equations below are > 0, we know the second object (after minus) is between the first object's position and width
    let x1 = ob1.x + ob1.w - ob2.x;
    let x2 = ob2.x + ob2.w - ob1.x;
    let y1 = ob1.y + ob1.h - ob2.y;
    let y2 = ob2.y + ob2.h - ob1.y;
    if (((x1 > 0 && x1 <= ob1.w) || (x2 > 0 && x2 <= ob2.w))
        && ((y1 > 0 && y1 <= ob1.h)|| (y2 > 0 && y2 <= ob2.h))) 
    {
        return true;
    }
}

function moveTurret(deltaTime) {
    turret.x_vel = 0;
    turret.x_vel = turret.movR + turret.movL;
    // Add bounds to x movement
    if (turret.x >= GAME_WIDTH - turret.w && turret.x_vel > 0 ||
        turret.x <= 0 && turret.x_vel < 0) 
    {
        turret.x = turret.x;
    } else {
        turret.x += turret.x_vel * deltaTime;
    }
    if (gameOver) {
        turret.movL = 0;
        turret.movR = 0;
    }
}

function fire(group) {
    if (group == "turret") {
        let laser_obj = new laser(turret.x + TURRET_WIDTH/2, turret.y, LASER_WIDTH, LASER_HEIGHT, -LASER_SPEED, group);
        lasers.push(laser_obj);
        console.log(lasers[0]);
    }
}

function moveLasers(deltaTime) {
    let i = 0;
    while (i < lasers.length) {
        let laser = lasers[i];
        laser.y += laser.y_vel * deltaTime;
        // remove laser if off screen
        if (laser.y > GAME_HEIGHT || laser.y < -laser.h) {
            lasers.splice(i, 1);
        } else {
            i++;
        }
    }
}

/* 
    Explanation:

    I need to break out of the for loops if a collision happened or I may get an error
    for out of bounds in the lasers array since I remove an element after colliding. I could
    have the while loop inside the fors to make it easier, but that means the for loops
    get executed every frame which seems wasteful.
*/
function checkCollisions() {
    let k = 0;
    while (k < lasers.length) {
        let collided = false;
        for (let i = 0; i < ALIEN_ROWS; i++) {
            if (collided) {
                break;
            }
            for (let j = 0; j < ALIEN_COLS; j++) {
                if (collided) {
                    break;
                }
                if (aliens[i][j] != 0 && collisionCheck(aliens[i][j], lasers[k])) {
                    aliens[i][j] = 0;
                    lasers.splice(k, 1);
                    collided = true;
                }
            }
        }
        if (collided) {
            collided = false;
        } else {
            k++;
        }
    }
}

/************* MAIN FUNCTIONS *************/

function input() {
    document.addEventListener("keydown", (event)=> {
        if (!gameOver) {
            if (event.key == 'ArrowRight') {
                turret.movR = TURRET_SPEED;
            }
            if (event.key == 'ArrowLeft') {
                turret.movL = -TURRET_SPEED;
            }
            if (event.key == ' ' && shotReady) {
                fire("turret");
                shotReady = false;
            }
            
        } else {
            if (event.key == 'Enter') {
                resetGame();
            }
        }
    })
    
    document.addEventListener("keyup", (event)=> {
        if (!gameOver) {
            if (event.key == 'ArrowRight') {
                turret.movR = 0;
            }
            if (event.key == 'ArrowLeft') {
                turret.movL = 0;
            }
            if (event.key == ' ') {
                shotReady = true;
            }
        }
    })
}

function update(deltaTime) {
    moveTurret(deltaTime);
    moveLasers(deltaTime);
    checkCollisions();
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.drawImage(turret.sprite, turret.x, turret.y);
    for (let i = 0; i < lasers.length; i++) {
        let lsr = lasers[i];
        ctx.fillRect(lsr.x, lsr.y, lsr.w, lsr.h);
    }

    for (let i = 0; i < aliens.length; i++) {
        for (let j = 0; j < aliens[i].length; j++) {
            let alien = aliens[i][j];
            ctx.fillRect(alien.x, alien.y, alien.w, alien.h);
        }
    }

    if (gameOver) {
        document.getElementById('game-over-text').innerHTML = 'GAME OVER<br><br>Press Enter <br>To Restart';
    }
}

function gameLoop(timestamp) {
    var deltaTime = (timestamp - lastTime)/100; 
    lastTime = timestamp;
    input();
    update(deltaTime);
    draw(deltaTime);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);