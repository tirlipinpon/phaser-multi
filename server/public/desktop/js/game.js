var game;
var text;
var initialTime = 3;
var timedEvent = null;
const healthBars = {};
const scores = {};
var gameStarted = false;
var playersGroup = null;
var self = null;
var timeGame = 0;

window.onload = function () {
     var config = {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scale: {
            parent: 'phaser-example',
            // mode: Phaser.Scale.Fit,
            // autoCenter: Phaser.Scale.CENTER_BOTH,
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
     game = new Phaser.Game(config);
     this.socket = io();
};
window.onbeforeunload = function (e) {
    this.socket.emit('desktop disconnected');
};

function preload() {
    var self = this;
    self.load.image('ship', '/public/desktop/assets/spaceShips_001.png');
    this.load.image('background', '/public/desktop/assets/background.png');
    this.load.image('parallax_1', '/public/desktop/assets/parallax1.png');
    this.load.image('parallax_2', '/public/desktop/assets/parallax2.png');

    socket.emit('desktop connected');
    self.numberPlayers = getText(self);
}

function create() {
    self = this;

    this.background = setBackground(self);
    console.log(this.background.depth);
    this.parallax_1 = setParallax(0, 0, 50, 'parallax_1');
    this.parallax_2 = setParallax(self.game.config.width - 50, 0, 50, 'parallax_2');


    playersGroup = this.add.group();
    socket.on('desktop nbPlayers', function (nbPlayers) {
        // console.log('nbPlayers : ' + nbPlayers);
        self.numberPlayers.setText(nbPlayers + ' player');
        self.numberPlayers.setDepth(1);
        console.log(self.numberPlayers.depth);
    });
    socket.on('desktop new player', function (playerInfo) {
        console.log('C - new player : ', playerInfo);
        addPlayerToPhaser(self, playerInfo);
        drawHealthBar(self, playerInfo.health, playerInfo.x, playerInfo.color, playerInfo.id, playerInfo.position);
        drawScores(self, playerInfo.x, playerInfo.id, playerInfo.position);
    });
    socket.on('desktop remove player', function (playerId) {
        console.log('E - remove Player : ', playerId);
        if (!gameStarted) {
            removeHealthBar(playerId);
            removeScore(playerId);
        }
        removePlayerFromPhaser(self, playerId);
    });
    socket.on('desktop start game', function (timeMs) {
        self.numberPlayers.destroy();
        if (timedEvent === null) {
            console.log('desktop start game : ', timeMs);
            var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
            text = self.add.text(window.innerWidth/2-100, window.innerHeight/2, '',  style);
            text.setText(formatTime(initialTime));
            text.setOrigin(.5);
            text.setAlpha(.4);
            timedEvent = self.time.addEvent({ delay: 1000, callback: onEventCountdown, callbackScope: this, loop: true });
        }
    });
}



function update() {
    var self = this;
    // if (text) {
    //     console.log(elapsed.getProgress().toString().substr(0, 4))
    //     text.setText('Event.progress: ' + elapsed.getProgress().toString().substr(0, 4));
    // }
    if (gameStarted) {
        this.background.tilePositionY -= 0.5;
        this.parallax_1.tilePositionY -= 1.5;
        this.parallax_2.tilePositionY -= 1.5;
    }
}

function setParallax(x, y, size, name) {
    this.parallax = self.add.tileSprite(x, y, size, self.game.config.height, name);
    this.parallax.setOrigin(0, 0);
    this.parallax.alpha = 0.5;
    // this.parallax_1.scaleX = 1.2;
    // this.parallax_1.setPosition(-35, 0);
    // this.parallax_1.setScrollFactor(0);
    return this.parallax;
}

function setBackground(self) {
    var background = self.add.tileSprite(0, 0, self.game.config.width, self.game.config.height, 'background');
    background.setOrigin(0, 0);
    background.setDisplaySize(self.game.config.width, self.game.config.height);
    return background;
}

function formatTime(seconds){
    // Minutes
    // var minutes = Math.floor(seconds/60);
    // Seconds
    var partInSeconds = seconds%60;
    // Adds left zeros to seconds
    partInSeconds = partInSeconds.toString().padStart(2,'0');
    // Returns formated time
    return partInSeconds;
}

function setTimerStartGame(self) {
    // var timer = self.scene.time.addEvent({
    //     delay: 3000,                // ms
    //     callback: callback,
    //     args: [],
    //     callbackScope: self,
    //     loop: false,
    //     repeat: 0,
    //     startAt: 0,
    //     timeScale: 1,
    //     paused: false
    // });
    // this.elapsed = timer.delayedCall(3000, onEvent, [], this);
    this.elapsed = self.time.delayedCall(3000, onEvent, [], this);
    text = self.add.text('Event.progress: ' + this.elapsed.getProgress().toString().substr(0, 4));
}

function getText(self) {
    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    var text = self.add.text(window.innerWidth/2-100, window.innerHeight/2, '0 player', style);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    text.setOrigin(.5);
    text.setAlpha(.4);
    return text;
}

function addPlayerToPhaser(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
    player.id = playerInfo.id;
    player.color = playerInfo.color;
    player.position = playerInfo.position;
    player.health = playerInfo.health;
    player.score = playerInfo.score;
    player.projectilesGroup = self.add.group();
    playersGroup.add(player);
    timeGame += 30;
}

function removePlayerFromPhaser(self, playerId) {
    playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.id) {
            player.destroy();
            timeGame -= 30;
        }
    });
}

function removeHealthBar(playerId) {
    if (healthBars[playerId]) {
        healthBars[playerId].clear();
        delete healthBars[playerId];
    }
}

function removeScore(playerId) {
    if (scores[playerId]) {
        scores[playerId].destroy();
        delete scores[playerId];
    }
}

function onEventCountdown() {
    initialTime -= 1; // One second
    if (initialTime < 0) {
        timedEvent.destroy();
        text.destroy();
        gameStarted = true;
        drawTimeEndCountdown();
        socket.emit('desktop game started');
    } else {
        text.setText(formatTime(initialTime));
        console.log(formatTime(initialTime));
    }
}

function onEventCountdownGameEnd() {
    timeGame -= 1;
    if (timeGame < 0) {
        timedEvent.destroy();
        text.destroy();
        gameStarted = false;
        socket.emit('desktop game ended');
    } else {
        if (timeGame < 30 && timeGame > 20) {
            text.displayWidth += 2;
            text.displayHeight += 2;
            text.setAlpha(.1);
        } else if (timeGame < 20 && timeGame > 10) {
            text.displayWidth += 10;
            text.displayHeight += 10;
            text.setAlpha(.2);
        } else if (timeGame < 10) {
            text.displayWidth += 20;
            text.displayHeight += 20;
            text.setAlpha(.3);
        }
        text.setText(formatTime(timeGame));
    }
}

function drawHealthBar(self, life, x, color, id, position) {
    if (healthBars[id]) {
        healthBars[id].clear();
    }
    // var graphics = self.add.graphics();
    // graphics.fillStyle(color, 1);
    // graphics.fillRect(10 , 20, life, 10);
    // graphics.lineStyle(2, 0xffff00, 0);
    // graphics.strokeRect(10, 20, 100, 10);
    // healthBar[id] = graphics;

    if (color === 'red') {
        color = 0xff0000;
    } else if (color === 'green') {
        color = 0x00ff00;
    } else if (color === 'blue') {
        color = 0x0000ff;
    } else if (color === 'pink') {
        color = 0xff03b2;
    } else {
        color = 0xffffff;
    }

     // ( [x] [, y] [, width] [, height])
    var rect = new Phaser.Geom.Rectangle(x*(position/2), 50, life, 10);
    var graphics = self.add.graphics({ fillStyle: { color: color } });
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(x*(position/2), 50, life+2, 10);
    graphics.fillRectShape(rect);
    healthBars[id] = graphics;
}

function drawScores(self, x, id, position) {
    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    var text = self.add.text(x*(position/2), 15, '0', style);
    scores[id] = text;

}

function drawTimeEndCountdown() {
    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    text = self.add.text(window.innerWidth/2-100, window.innerHeight/2, '',  style);
    text.setText(formatTime(timeGame));
    text.setOrigin(.5);
    text.setAlpha(.1);
    timedEvent = self.time.addEvent({ delay: 1000, callback: onEventCountdownGameEnd, callbackScope: this, loop: true });
}