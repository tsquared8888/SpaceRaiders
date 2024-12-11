var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
const TURRET_SPRITE = new Image();
const ALIEN_SPRITE = new Image();
TURRET_SPRITE.src = 'turret.png';
ALIEN_SPRITE.src = 'alien.png';
const GAME_WIDTH = 256;
const GAME_HEIGHT = 256;
const TURRET_WIDTH = 16;
const TURRET_HEIGHT = 16;
const TURRET_SPEED = 20;
const ALIEN_WIDTH = 16;
const ALIEN_HEIGHT = 16;
const ALIEN_SPACING = 8;
const ALIEN_SPEED = 16;//4;
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
var alien_direction = 1;
var alien_move_down = false;
var row_index = ALIEN_ROWS-1;
var col_index = ALIEN_COLS-1;
var shotReady = true;
var timer = 0.0;
var timerMax = 0.5;

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
    this.sprite = ALIEN_SPRITE;
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
    timerMax = 0.5
    gameOver = false;
    alien_move_down = false;
    alien_direction = 1;
    lasers = [];
    document.getElementById('game-over-text').innerHTML = '';
    turret.x = GAME_WIDTH/2 - TURRET_WIDTH/2;
    turret.y = GAME_HEIGHT - TURRET_HEIGHT;

    aliens = new Array(ALIEN_ROWS);
    for (let i = 0; i < ALIEN_ROWS; i++) {
        aliens[i] = new Array(ALIEN_COLS);
    }

    for (let i = 0; i < ALIEN_ROWS; i++) {
        for (let j = 0; j < ALIEN_COLS; j++) {
            aliens[i][j] = new alien(i*ALIEN_WIDTH+i*ALIEN_SPACING+ALIEN_SPACING, j*ALIEN_HEIGHT+j*ALIEN_SPACING+ALIEN_SPACING, ALIEN_WIDTH, ALIEN_HEIGHT);
        }
    }
    row_index = ALIEN_ROWS-1;
    col_index = ALIEN_COLS-1;
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

// We can't use a for loop since we want to move one alien at a time.
// Also why we use a unique row and column index
function moveAliens(deltaTime) {
    timer += deltaTime;
    while (timer > timerMax) {
        // Moves only visible aliens
        if (aliens[row_index][col_index] != 0) {
            timer = 0;
        }

        if (alien_move_down) {
            aliens[row_index][col_index].y += ALIEN_HEIGHT + ALIEN_SPACING;
        } else {
            aliens[row_index][col_index].x += alien_direction * ALIEN_SPEED;
        }

        // Index handling
        if (alien_direction == 1) {
            col_index -= 1; 
            if (col_index == -1) {
                row_index -= 1;
                if (row_index == -1) {
                    row_index = aliens.length-1;
                    col_index = aliens[row_index].length-1;
                    // move aliens down
                    if (alien_move_down) {
                        alien_move_down = false;
                        alien_direction *= -1;
                        row_index = 0;
                    } else {
                        checkEdges();
                    }
                }
                col_index = aliens[row_index].length-1;
            }
        } else {
            col_index -= 1; 
            if (col_index == -1) {
                row_index += 1;
                if (row_index == aliens.length) {
                    row_index = 0;
                    col_index = aliens[row_index].length-1;
                    // move aliens down
                    if (alien_move_down) {
                        alien_move_down = false;
                        alien_direction *= -1;
                        row_index = aliens.length-1;
                    } else {
                        checkEdges();
                    }
                }
                col_index = aliens[row_index].length-1;
            }
        }
        
    }
}

function checkEdges() {
    // Check if the first lowest row of aliens is greater than the maximum height and end the game if true
    for (let i = ALIEN_ROWS-1; i > 0; i--) {
        for (let j = ALIEN_COLS-1; j > 0; j--) {
            if (aliens[i][j] != 0 && aliens[i][j].y >= GAME_HEIGHT - ALIEN_SPACING - 2 * ALIEN_HEIGHT) {
                gameOver = true;
                return;
            }
        }
    }
    // If aliens are moving right, we move from right to left to find right edge
    if (alien_direction == 1) {
        for (let i = ALIEN_ROWS-1; i > 0; i--) {
            for (let j = ALIEN_COLS-1; j > 0; j--) {
                if (aliens[i][j] != 0 && aliens[i][j].x >= GAME_WIDTH - ALIEN_SPACING - 2 * ALIEN_WIDTH) {
                    alien_move_down = true;
                }
            }
        }
    } else if (alien_direction == -1) { // Else we move left to right to find left edge
        for (let i = ALIEN_ROWS-1; i > 0; i--) {
            for (let j = ALIEN_COLS-1; j > 0; j--) {
                if (aliens[i][j] != 0 && aliens[i][j].x <= ALIEN_SPACING + 2 * ALIEN_WIDTH) {
                    alien_move_down = true;
                }
            }
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
                    timerMax -= 0.01;
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
    moveAliens(deltaTime);
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
            if (alien != 0) {
                ctx.drawImage(alien.sprite, alien.x, alien.y);
            }
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
    if (!gameOver) {
        update(deltaTime);
    }
    draw(deltaTime);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);