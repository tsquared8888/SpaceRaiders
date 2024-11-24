var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
const GAME_WIDTH = 256;
const GAME_HEIGHT = 256;
const PADDLE_WIDTH = 40;
const PADDLE_HEIGHT = 8;
const PADDLE_SPEED = 20;
const BALL_WIDTH = 8;
const BALL_HEIGHT = 8;
const BALL_SPEED = 25;
const BRICK_ROWS = 7;
const BRICK_COLS = 6;
const BRICK_WIDTH = 32;
const BRICK_HEIGHT = 8;
const BRICK_SPACING = 4;
var gameStart = false;
var lastTime = 0;
var gameOver = false;
var score = 0;
var paddleCollided = false;

/* Game objects */
var paddle = {
    x: GAME_WIDTH/2 - PADDLE_WIDTH/2,
    y: GAME_HEIGHT - PADDLE_HEIGHT,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    x_vel: 0,
    movL: 0,
    movR: 0
};

var ball = {
    x: GAME_WIDTH/2 - BALL_WIDTH/2,
    y: GAME_HEIGHT/2 - BALL_HEIGHT/2,
    w: BALL_WIDTH,
    h:BALL_HEIGHT,
    x_vel: 0,
    y_vel: 0.5
}

function brick(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

var brick_array = new Array(BRICK_ROWS);
for (let i = 0; i < BRICK_ROWS; i++) {
    brick_array[i] = new Array(BRICK_COLS);
}

// Create bricks
for (let i = 0; i < BRICK_ROWS; i++) {
    for (let j = 0; j < BRICK_COLS; j++) {
        brick_array[i][j] = new brick((i*BRICK_WIDTH)+(BRICK_SPACING*i)+BRICK_SPACING, (j*BRICK_HEIGHT)+(BRICK_SPACING*j)+BRICK_SPACING, BRICK_WIDTH, BRICK_HEIGHT);
    }
}

/************* SUPPORT FUNCTIONS *************/

function resetGame() {
    gameOver = false;
    document.getElementById('game-over-text').innerHTML = '';
    ball.x = GAME_WIDTH/2 - BALL_WIDTH/2;
    ball.y = GAME_HEIGHT/2 - BALL_HEIGHT/2;
    ball.x_vel = 0;
    ball.y_vel = 0.5
    paddle.x = GAME_WIDTH/2 - PADDLE_WIDTH/2;
    paddle.y = GAME_HEIGHT - PADDLE_HEIGHT;
    for (let i = 0; i < BRICK_ROWS; i++) {
        for (let j = 0; j < BRICK_COLS; j++) {
            brick_array[i][j] = new brick((i*BRICK_WIDTH)+(BRICK_SPACING*i)+BRICK_SPACING, (j*BRICK_HEIGHT)+(BRICK_SPACING*j)+BRICK_SPACING, BRICK_WIDTH, BRICK_HEIGHT);
        }
    }
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

// Determines where ball hit the brick
/*
 * Explanation:
 * The math is difficult to explain and understand without images, but I may need it for future projects so here we go.
 * xDiff and yDiff gets distance between center of ball and brick for the respective axes
 * This works regardless of the ball/brick positions since we are using absolute values.
 * Then we subtract the brick width and height from xDiff and yDiff respectively.
 * This gives us the distance between the center of the ball and the edge of the brick.
 * We know that the bigger number means the collision was smaller on that particular axis.
 * As a result, we should be changing the velocity on that axis since that is the axis that triggered the collision.
 * 
 */
function collisionLocation(brick, ball) {
    let xDiff = (ball.x + ball.w/2) - (brick.x + brick.w/2);
    let yDiff = (ball.y + ball.h/2) - (brick.y + brick.h/2);
    if (Math.abs(xDiff) - brick.w/2 > Math.abs(yDiff) - brick.h/2) {
        // If the ball hits two platforms simultaneously, the old code of multiplying velocity by -1
        // triggered twice resulting in ball going the same direction which we don't want.
        let vel = Math.abs(ball.x_vel);
        if (xDiff < 0) {
            ball.x_vel = -vel;
        } else {
            ball.x_vel = vel;
        }
    } else {
        let vel = Math.abs(ball.y_vel);
        if (yDiff < 0) {
            ball.y_vel = -vel;
        } else {
            ball.y_vel = vel;
        }
    }
}

function movePaddle(deltaTime) {
    paddle.x_vel = 0;
    paddle.x_vel = paddle.movR + paddle.movL;
    if (paddle.x >= GAME_WIDTH - paddle.w/2 && paddle.x_vel > 0 ||
        paddle.x <= -paddle.w/2 && paddle.x_vel < 0) 
    {
        paddle.x = paddle.x;
    } else {
        paddle.x += paddle.x_vel * deltaTime;
    }
    if (gameOver) {
        paddle.movL = 0;
        paddle.movR = 0;
    }
}

function moveBall(deltaTime) {
    // Change direction of ball based on location of collision on paddle
    if (!paddleCollided && collisionCheck(paddle, ball)) {
        ball.y_vel *= -1;
        if (ball.x + ball.w/2 < paddle.x+8) {
            ball.x_vel = -0.75;
        } else if (ball.x + ball.w/2 < paddle.x + 16) {
            ball.x_vel = -0.25;
        } else if (ball.x + ball.w/2 < paddle.x + 24) {
            ball.x_vel = 0;
        } else if (ball.x + ball.w/2 < paddle.x + 32) {
            ball.x_vel = 0.25;
        } else if (ball.x + ball.w/2 > paddle.x + 32) {
            ball.x_vel = 0.75;
        }
        paddleCollided = true;
    } else if (!collisionCheck(paddle, ball)) {
        paddleCollided = false;
    }

    // bounce off bricks
    for (let i = 0; i < BRICK_ROWS; i++) {
        for (let j = 0; j < BRICK_COLS; j++) {
            let brick = brick_array[i][j];
            if (brick != 0 && collisionCheck(brick, ball)) {
                collisionLocation(brick, ball);
                brick_array[i][j] = 0;
            }
        }
    }

    // Bounce off walls
    if (ball.y <= 0) {
        ball.y_vel *= -1;
    }
    if (ball.x <= 0 || ball.x + ball.w > GAME_WIDTH) {
        ball.x_vel *= -1;
    }
    ball.x += ball.x_vel * deltaTime * BALL_SPEED;
    ball.y += ball.y_vel * deltaTime * BALL_SPEED;

    // End game
    if (ball.y > GAME_HEIGHT) {
        gameOver = true;
        ball.y_vel = 0;
    }
}

/************* MAIN FUNCTIONS *************/

function input() {
    document.addEventListener("keydown", (event)=> {
        if (!gameOver) {
            if (event.key == 'ArrowRight') {
                paddle.movR = PADDLE_SPEED;
            }
            if (event.key == 'ArrowLeft') {
                paddle.movL = -PADDLE_SPEED;
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
                paddle.movR = 0;
            }
            if (event.key == 'ArrowLeft') {
                paddle.movL = 0;
            }
        }
    })
}

function update(deltaTime) {
    movePaddle(deltaTime);
    moveBall(deltaTime);
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillRect(ball.x, ball.y, ball.w, ball.h);
    for (let i = 0; i < BRICK_ROWS; i++) {
        for (let j = 0; j < BRICK_COLS; j++) {
            let brick = brick_array[i][j];
            ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
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