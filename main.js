const term = require( 'terminal-kit' ).terminal;
const { ScreenBuffer } = require('terminal-kit');

const hat = '^';
const hole = 'O';
const fieldCharacter = '▓';
const pathCharacter = '*';

class Field {
  constructor(fieldArray, width, height) {
    this.field = fieldArray;
    this.fieldWidth = width;
    this.fieldHeight = height;
   }

  static generateField(width, height, holePercentage) {
    let fieldArray = new Array(width * height);
    // place the player at the top left corner
    fieldArray[0] = '*';
    fieldArray = fieldArray.fill(fieldCharacter, 1, fieldArray.length);

    // radnomly insert the hat
    fieldArray[Math.floor(Math.random() * (fieldArray.length - 1) + 1)] = hat; 

    // randomly insert the holes 
    let numOfHoles = Math.floor(holePercentage * (width * height));
    while (numOfHoles > 0) {
        let index = Math.floor(Math.random() * fieldArray.length);
        if (fieldArray[index] !== pathCharacter && fieldArray[index] !== hat) {
            fieldArray[index] = 'O';
            --numOfHoles;
        }
    }

    return new Field(fieldArray, width, height);
  }
}

let posX = 0;
let posY = 0;
const fieldOffsetX = 2;
const fieldOffsetY = 2;
const myField = Field.generateField(16, 20, 0.35);

// create screen buffer of the whole terminal
const screen = new ScreenBuffer({ dst: term, noFill: true });
screen.fill({attr: {defaultColor: true}});

// create a second screen buffer of the playing field that will draw on top of screen buffer
const fieldBuffer = new ScreenBuffer({ 
    width: myField.fieldWidth, 
    height: myField.fieldHeight, 
    dst: screen,
    x: fieldOffsetX,
    y: fieldOffsetY,
    noFill: true 
});

// draw the initial field
drawField();

term.grabInput();
term.on('key', function(name, matches, data) {
    if ( name === 'CTRL_C') { terminate(); }

    switch (name) {
        case 'w':
            move(posX, posY - 1);
            break;
        case 's':
            move(posX, posY + 1);
            break;
        case 'a':
            move(posX - 1, posY);
            break;
        case 'd':
            move(posX + 1, posY);
            break;
        default:
            break;
    }

});

function move(x, y) {
    if(!inBounds(x, y)) { return; }
    
    const nextPos = myField.field[y * myField.fieldWidth + x];
    if (inBounds(x, y) && nextPos === fieldCharacter) {
        myField.field[y * myField.fieldWidth + x] = '*';
        posX = x;
        posY = y;
    }

    if (nextPos === hole) {
        screen.put({
            x: fieldOffsetX,
            y: fieldOffsetY + myField.fieldHeight + 2,
            markup: true
        }, '^ROh no! You fell in a hole... Better luck next time^');
        screen.draw();
        terminate();
    }

    if (nextPos === hat) {
        screen.put({
            x: fieldOffsetX,
            y: fieldOffsetY + myField.fieldHeight + 2,
            markup: true
        }, '^GHooray! You found your hat!^');
        screen.draw();
        terminate()
    }
    drawField();
}

function inBounds(x, y) {
    if (x >= myField.fieldWidth || x < 0 || y >= myField.fieldHeight || y < 0)
        return false;
    return true;
}

function drawField() {
    // iterate through the field string and map to a 2D space
    for (let row = 0; row < myField.fieldHeight; row++) {
        for (let column = 0; column < myField.fieldWidth; column++) {
            // index into the field string
            const fieldChar = myField.field[row * myField.fieldWidth + column];
            fieldBuffer.put({
                x: column,
                y: row,
            }, fieldChar);
        }
    }
    screen.put({
        x: fieldOffsetX,
        y: fieldOffsetY + myField.fieldHeight + 1,
    }, 'Which way? (W = up, A = left, S = down, D = right)');

    //output buffers to the screen
    fieldBuffer.draw();
    screen.draw();
}

function terminate() {
    term.grabInput( false );
    term.processExit();
}