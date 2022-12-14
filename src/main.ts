import './style.css';
import * as PIXI from 'pixi.js';
import { sound } from '@pixi/sound';

// Create the application helper and add its render target to the page
const HEIGHT = window.innerHeight, WIDTH = window.innerWidth;
const app = new PIXI.Application({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0x000000
});
let score = 0;
let scoreText = new PIXI.Text(`Score: ${score}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xffffff,
    align: 'center',
});

sound.add('lose', 'lose.mp3');
sound.add('collect', 'collect.mp3');

document.body.appendChild(app.view);
const graphics = new PIXI.Graphics();
const BLOCK_SIZE = 40;
const BLOCK_DISTANCE = 35;
const columns = Math.floor(window.innerWidth / BLOCK_SIZE);
const rows = Math.floor(window.innerHeight / BLOCK_SIZE);
app.stage.interactive = true;

const createGrid = (cols: number, rows: number) => {
    const grid = new Array(cols);
    for (let i = 0; i < cols; i++) {
        grid[i] = new Array(rows);
        for (let j = 0; j < rows; j++) {
            grid[i][j] = Math.random() > 0.35;
        }
    }
    return grid;
};

let loseRectangels: any[] = [];

const drawBlock = (i: number, j: number) => {
    const rectangle: { x: number, y: number } = { x: i * BLOCK_SIZE, y: j * BLOCK_SIZE };
    const isLosing = Math.random() > 0.5;
    if (isLosing) {
        graphics.beginFill(0xFB2208); // red
        loseRectangels.push(rectangle);
    } else {
        graphics.beginFill(0x02FC20); // green
    }
    graphics.drawRect(i * BLOCK_SIZE, j * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    graphics.endFill();
}

const drawGrid = (grid: any[]) => {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] && isEmptyArea(i, j)) {
                drawBlock(i, j);
            }
        }
    }
    app.stage.addChild(graphics);
}

const isEmptyArea = (i: number, j: number) => {
    return !(Math.abs(spriteRestart.x - i * BLOCK_SIZE) <= 60 && Math.abs(spriteRestart.y - j * BLOCK_SIZE) <= 60) && !(Math.abs(spriteApple.x - i * BLOCK_SIZE) <= 60 && Math.abs(spriteApple.y - j * BLOCK_SIZE) <= 60);

}

const getAliveCount = (x: number, y: number, grid: any[]) => {
    let count = 0;
    const maximalX = grid.length - 1;
    const maximalY = grid[0].length - 1;
    let rows, columns;
    for (let i = x - 1; i < x + 2; i++) {
        for (let j = y - 1; j < y + 2; j++) {
            rows = i === -1 ? maximalX : i === maximalX + 1 ? 0 : i;
            columns = j === -1 ? maximalY : j === maximalY + 1 ? 0 : j;
            if (rows !== x || columns !== y) {
                grid[rows][columns] && count++;
            }
        }
    }
    return count;
}

const generateNewGrid = (grid: any[]) => {
    const newGrid = new Array(grid.length);
    for (let i = 0; i < grid.length; i++) {
        newGrid[i] = new Array(grid[i].length);
        for (let j = 0; j < grid[i].length; j++) {
            const cell = grid[i][j];
            const neighboursAlive = getAliveCount(i, j, grid);
            if (cell && (neighboursAlive === 2 || neighboursAlive === 3)) {
                newGrid[i][j] = true;
            } else if (!cell && neighboursAlive === 3) {
                newGrid[i][j] = true;
            } else {
                newGrid[i][j] = false;
            }
        }
    }
    return newGrid;
}

let grid = createGrid(columns, rows);
let isPaused = false;

setInterval(() => {
    if (!isPaused) {
        graphics.clear();
        loseRectangels = [];
        grid = generateNewGrid(grid);
        drawGrid(grid);
    }
}, 1800);

let spriteApple = PIXI.Sprite.from('daily-mail.png');
spriteApple.height = BLOCK_SIZE, spriteApple.width = BLOCK_SIZE;
// Set the initial positions
spriteApple.x = app.screen.width / 2;
spriteApple.y = app.screen.height / 2;

let spriteSnake = PIXI.Sprite.from('cats.png');
spriteSnake.height = BLOCK_SIZE, spriteSnake.width = BLOCK_SIZE;

spriteSnake.x = spriteSnake.width;
spriteSnake.y = spriteSnake.height;

let gameOver = PIXI.Sprite.from('game_over.jpeg');
gameOver.height = 550, gameOver.width = 720;
gameOver.x = (app.screen.width / 2) - (gameOver.width / 2);
gameOver.y = (app.screen.height / 2) - (gameOver.height / 2);

scoreText.x = WIDTH - 150;
scoreText.y = HEIGHT - 50;

let spriteRestart = PIXI.Sprite.from('restart.svg');

spriteRestart.height = 60, spriteRestart.width = 60;
// Set the initial positions
spriteRestart.x = app.screen.width / 2;
spriteRestart.y = HEIGHT - 100;
spriteRestart.interactive = true;
spriteRestart.buttonMode = true;

spriteRestart.on('click', () => {
    restart(true);
})

app.stage.addChild(spriteRestart);
app.stage.addChild(spriteApple);
app.stage.addChild(spriteSnake);
app.stage.addChild(scoreText);

// Add a ticker callback to move the sprite back and forth
let elapsedX = 0.0;
let stepsX = 1.25;
let stepsY = 0;
let speed = 0;

app.ticker.add((delta) => {
    if (isPaused) {
        return;
    }
    elapsedX += delta;
    if (spriteSnake.x + stepsX > WIDTH) { //end of screen
        spriteSnake.x = 0;
    } else if (spriteSnake.x + stepsX < 0) { // start of screen
        spriteSnake.x = WIDTH;
    } else {
        spriteSnake.x += stepsX;
    }

    if (spriteSnake.y + stepsY > HEIGHT) { //end of screen
        spriteSnake.y = 0;
    } else if (spriteSnake.y + stepsY < 0) { //start of screen
        spriteSnake.y = HEIGHT;
    } else {
        spriteSnake.y += stepsY;
    }

    eatApple();
    stuckwall();
});

const moveSnake = (event: any) => {
    switch (event.keyCode) {
        case 37: // Left
            stepsX = -(1.25 + speed);
            stepsY = 0;
            break;
        case 38: // Up
            stepsX = 0;
            stepsY = -(1.25 + speed);
            break;
        case 39: // Right
            stepsX = 1.25 + speed;
            stepsY = 0;
            break;
        case 40: // Down
            stepsX = 0;
            stepsY = 1.25 + speed;
            break;
        default:
            break;
    }
}

function getRandomValue(max: number) {
    return Math.random() * (max - 0);
}


const eatApple = () => {
    if (Math.abs(spriteSnake.x - spriteApple.x) <= BLOCK_DISTANCE && Math.abs(spriteSnake.y - spriteApple.y) <= BLOCK_DISTANCE) {
        sound.play('collect');
        applePosition()
        score++;
        scoreText.text = `Score: ${score}`;
        speed += 1;
    }
}

const applePosition = () => {
    let redayPosApple = false, x = 0, y = 0;
    while (!redayPosApple) {
        redayPosApple = true;
        x = getRandomValue(WIDTH - spriteApple.width);
        y = getRandomValue(HEIGHT - spriteApple.height);
        loseRectangels.forEach((lr) => {
            if ((Math.abs(lr.x - x) <= BLOCK_DISTANCE && Math.abs(lr.y - y) <= BLOCK_DISTANCE)) {
                redayPosApple = false;
            }
        })
    }
    spriteApple.x = x;
    spriteApple.y = y;
}

const stuckwall = () => {
    loseRectangels.forEach((ch) => {
        if (Math.abs(spriteSnake.x - ch.x) <= BLOCK_DISTANCE && Math.abs(spriteSnake.y - ch.y) <= BLOCK_DISTANCE) {
            sound.play('lose');
            app.stage.addChild(gameOver);
            spriteSnake.x = app.screen.width + 100;
            isPaused = true;
        }
    })
}

const restart = (withApple: boolean) => {
    stepsX = 1.25;
    stepsY = 0;
    spriteSnake.x = 0;
    spriteSnake.y = 0;
    scoreText.text = 'Score: 0';
    score = 0;
    if(withApple) {
        spriteApple.x = getRandomValue(WIDTH);
        spriteApple.y = getRandomValue(HEIGHT);
    }
    grid = createGrid(columns, rows);
    spriteApple.x = app.screen.width / 2;
    spriteApple.y = app.screen.height / 2;
    speed = 0;
    isPaused = false;
    app.stage.removeChild(gameOver);
}

document.body.addEventListener('keydown', moveSnake);


