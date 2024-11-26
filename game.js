var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
const TURRET_SPRITE = new Image();
TURRET_SPRITE.src = 'turret.png';
const GAME_WIDTH = 256;
const GAME_HEIGHT = 256;
const TURRET_WIDTH = 16;
const TURRET_HEIGHT = 16;
const TURRET_SPEED = 20;
const LASER_WIDTH = 1;
const LASER_HEIGHT = 4;
const LASER_SPEED = 25;
var gameStart = false;
var lastTime = 0;
var gameOver = false;
var score = 0;
var turretCollided = false;
var lasers = [];

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

function laser(x, y, w, h, y_vel, group) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.y_vel = y_vel;
    this.group = group; // player or enemy
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
    var x1 = ob1.x + ob1.w - ob2.x;
    var x2 = ob2.x + ob2.w - ob1.x;
    var y1 = ob1.y + ob1.h - ob2.y;
    var y2 = ob2.y + ob2.h - ob1.y;
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
    if (turret.x >= GAME_WIDTH - turret.w/2 && turret.x_vel > 0 ||
        turret.x <= -turret.w/2 && turret.x_vel < 0) 
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
        var lsr_obj = new laser(turret.x + TURRET_WIDTH/2, turret.y, 1, 4, -1, group);
        lasers.push(lsr_obj);
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
            if (event.key == ' ') {
                fire("turret");
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
        }
    })
}

function update(deltaTime) {
    moveTurret(deltaTime);
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.drawImage(turret.sprite, turret.x, turret.y);
    console.log(lasers);
    for (i = 0; i < lasers.length; i++) {
        var lsr = lasers[i];
        lsr.y += lsr.y_vel;
        ctx.fillRect(lsr.x, lsr.y, lsr.w, lsr.h);
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