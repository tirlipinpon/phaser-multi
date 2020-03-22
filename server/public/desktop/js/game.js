var game;
var text; //
var initialTime = 3; // s
var timedEvent = null; //
var healthBars = {}; //
var scores = {}; //
var gameStarted = false; //
// var playersGroup = null;
var self = null;
var timeGame = 0; //
var timerPowerUp; //
var timeEventPowerUp = null; //
var globalSpeed = 0; //
const positionPlayerExtra = [0, 100, 300, 500, 700];
var extraTimeByPlayer = 120; // s
var delayCreationPowerUp = 5000; // ms
var delayToRemovePowerUp = 5000; // ms

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
        physics: {
            default: 'arcade',
            arcade: {
                debug: true
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
    socket.emit('desktop connected');
    var self = this;
    // self.load.image('ship', '/public/desktop/assets/spaceShips_001.png');
    self.load.image('background', '/public/desktop/assets/background.png');
    self.load.image('parallax_1', '/public/desktop/assets/parallax1.png');
    self.load.image('parallax_2', '/public/desktop/assets/parallax2.png');
    self.load.spritesheet('ship', '/public/desktop/assets/spritesheets/ship.png', {frameWidth: 128, frameHeight: 128});
    self.load.spritesheet('ship2', '/public/desktop/assets/spritesheets/ship2.png', {frameWidth: 128, frameHeight: 192});
    self.load.spritesheet('ship3', '/public/desktop/assets/spritesheets/ship3.png', {frameWidth: 128, frameHeight: 256});
    self.load.spritesheet('player', '/public/desktop/assets/spritesheets/player.png', {frameWidth: 128, frameHeight: 81});
    self.load.spritesheet('explosion', '/public/desktop/assets/spritesheets/explosion.png', {frameWidth: 128, frameHeight: 128 });
    self.load.spritesheet('beam', '/public/desktop/assets/spritesheets/small-beam.png', {frameWidth: 16, frameHeight: 64});
    self.load.spritesheet('beam2', '/public/desktop/assets/spritesheets/large-beam.png', {frameWidth: 32, frameHeight: 64});
    self.load.spritesheet('beam3', '/public/desktop/assets/spritesheets/small-beam.png', {frameWidth: 16, frameHeight: 128});
    self.load.spritesheet('power-up', '/public/desktop/assets/spritesheets/power-up.png', { frameWidth: 64, frameHeight: 64 });
    self.load.atlas('flares', '/public/desktop/assets/flares.png', '/public/desktop/assets/flares.json');
    self.numberPlayers = getText(self);
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
        enemies.getChildren().forEach(function (ship) {
            moveShip(ship, globalSpeed + ship.speed);
        });
        powerUps.getChildren().forEach(function (powerUp) {
            // console.log(' limit:' + (self.game.config.height - 20) + ' actu: ' + powerUp.y);
            if (powerUp.y > (self.game.config.height - 15)) {
                powerUp.destroy();
            }
        });
    }
}
function create() {
    self = this;
    self.background = setBackground(self);
    self.parallax_1 = setParallax(0, 0, 50, 'parallax_1');
    self.parallax_2 = setParallax(self.game.config.width - 50, 0, 50, 'parallax_2');
    enemies = self.physics.add.group();
    playersGroup = self.add.group();
    powerUps = self.physics.add.group();
    createAnims();
    socketOn();
}

// game general
function socketOn() {
    socket.on('desktop nbPlayers', function (nbPlayers) {
        self.numberPlayers.setText(nbPlayers + ' player');
        self.numberPlayers.setDepth(1);
    });
    socket.on('desktop new player', function (playerInfo) {
        if (!gameStarted) {
            console.log('C - new player : ', playerInfo);
            addPlayerToPhaser(self, playerInfo);
            drawHealthBar(self, playerInfo.health, playerInfo.x, playerInfo.color, playerInfo.id, playerInfo.position);
            drawScores(self, playerInfo.x, playerInfo.id, playerInfo.position);
        }
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
            var style = {font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"};
            text = self.add.text(window.innerWidth / 2 - 100, window.innerHeight / 2, '', style);
            text.setText(formatTime(initialTime));
            text.setOrigin(.5);
            text.setAlpha(.4);
            timedEvent = self.time.addEvent({delay: 1000, callback: onEventCountdown, callbackScope: this, loop: true});
        }
    });
    socket.on('desktop mobile shoot', function (playerInfo) {
        playersGroup.getChildren().forEach(function (player) {
            if (playerInfo.id === player.id && player.active) {
                if (player.powerUp === 'gray_anim') {
                    new Beam(self, player, 'beam3', 1); // double beam
                } else if (player.powerUp === 'red_anim') {
                    new Beam(self, player, 'beam2', 1); // big beam
                } else {
                    new Beam(self, player, 'beam', 1);
                }
            }
        });
    });
    socket.on('desktop new position', function (playerInfo) {
        setNewPositionPlayers(playerInfo);
    });
    socket.on('desktop mobile action', function (playerInfo, action) {
        if (playerInfo) {
            playersGroup.getChildren().forEach(function (player) {
                if (playerInfo.id === player.id) {
                    movePlayerManager(player, action);
                }
            });
        }

    });
}
function createAnims() {
    self.anims.create({
        key: 'ship1_anim', // id for animation
        frames: self.anims.generateFrameNumbers('ship'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'ship2_anim', // id for animation
        frames: self.anims.generateFrameNumbers('ship2'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'ship3_anim', // id for animation
        frames: self.anims.generateFrameNumbers('ship3'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'player_anim', // id for animation
        frames: self.anims.generateFrameNumbers('player'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 10, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'explode_anim', // id for animation
        frames: self.anims.generateFrameNumbers('explosion'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: 0, // infinity loop -1,
        hideOnComplete: true
    });
    self.anims.create({
        key: 'beam_anim', // id for animation
        frames: self.anims.generateFrameNumbers('beam'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'beam_anim2', // id for animation
        frames: self.anims.generateFrameNumbers('beam2'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'beam_anim3', // id for animation
        frames: self.anims.generateFrameNumbers('beam3'), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'gray_anim', // id for animation
        frames: self.anims.generateFrameNumbers('power-up', {
            start: 0,
            end: 3
        }), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
    self.anims.create({
        key: 'red_anim', // id for animation
        frames: self.anims.generateFrameNumbers('power-up', {
            start: 4,
            end: 7
        }), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
}
function getRandomX(min, max) {
    return Phaser.Math.Between(min, max);
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
function onEventCountdown() {
    initialTime -= 1; // One second
    if (initialTime < 0) {
        timedEvent.destroy();
        text.destroy();
        gameStarted = true;
        // duplicateEnemies();
        drawTimeEndCountdown();
        timeEventPowerUp = self.time.addEvent({delay: delayCreationPowerUp, callback: createPowerUp, callbackScope: this, loop: true});
        socket.emit('desktop game started');
    } else {
        text.setText(formatTime(initialTime));
        text.displayWidth += 20;
        text.displayHeight += 20;
        console.log(formatTime(initialTime));
    }
}
function onEventCountdownGameEnd() {
    if (!gameStarted) {
        timedEvent.destroy();
    }
    timeGame -= 1;
    if (timeGame < 0) {
        resetGame();
    } else {
        displaySizeCoundownGameByTime();
        duplicateEnemiesByTime(timeGame % 20);
        text.setText(formatTime(timeGame));
    }
}
function displaySizeCoundownGameByTime() {
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
}
function resetGame() {
    timedEvent.destroy();
    timeEventPowerUp.destroy();
    text.destroy();
    gameStarted = false;
    initialTime = 3;
    healthBars = {};
    scores = {};
    timeGame = 0;
    globalSpeed = 0;
    timerPowerUp ?  timerPowerUp.remove() : timerPowerUp = null;
    powerUps.getChildren().forEach(function(powerUp) {
        powerUp.destroy();
    });
    enemies.getChildren().forEach(function(enemy) {
        enemy.destroy();
    });
    playersGroup.getChildren().forEach(function(player) {
        player.particles.destroy();
        player.destroy();
    });
    socket.emit('desktop game ended');
}
// decors
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
function formatTime(seconds) {
    // Minutes
    // var minutes = Math.floor(seconds/60);
    // Seconds
    var partInSeconds = seconds;
    // Adds left zeros to seconds
    partInSeconds = partInSeconds.toString().padStart(2, '0');
    // Returns formated time
    return partInSeconds;
}
function getText(self) {
    var style = {font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"};
    var text = self.add.text(window.innerWidth / 2 - 100, window.innerHeight / 2, '0 player', style);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    text.setOrigin(.5);
    text.setAlpha(.4);
    return text;
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
    } else if (color === 'yellow') {
        color = 0xefff00;
    } else {
        color = 0xffffff;
    }

    // ( [x] [, y] [, width] [, height])
    var rect = new Phaser.Geom.Rectangle(positionPlayerExtra[position], 50, life, 10);
    var graphics = self.add.graphics({fillStyle: {color: color}});
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(positionPlayerExtra[position], 50, 100 + 2, 10);
    graphics.fillRectShape(rect);
    healthBars[id] = graphics;
}
function drawScores(self, x, id, position) {
    var style = {font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"};
    var text = self.add.text(positionPlayerExtra[position], 15, this.zeroPad(0, 6), style);
    scores[id] = text;

}
function drawTimeEndCountdown() {
    var style = {font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"};
    text = self.add.text(window.innerWidth / 2 - 100, window.innerHeight / 2, '', style);
    text.setText(formatTime(timeGame));
    text.setOrigin(.5);
    text.setAlpha(.1);
    timedEvent = self.time.addEvent({delay: 1000, callback: onEventCountdownGameEnd, callbackScope: this, loop: true});
}
function zeroPad(number, size) {
    var stringNumber = String(number);
    while (stringNumber.length < (size || 2)) {
        stringNumber = '0' + stringNumber;
    }
    return stringNumber;
}
//power up
function createPowerUp() {
    if (true || powerUps.getChildren().length < 1) {
        var powerUp = self.physics.add.sprite(64, 64, 'power-up');
        powerUp.id = powerUps.getChildren().length+1;
        powerUps.add(powerUp);
        powerUp.setRandomPosition(0, 0, self.game.config.width, 50);

        if (Math.random() > 0.5) {
            powerUp.play('red_anim'); // big beam
        } else {
            powerUp.play('gray_anim'); // double beam gray_anim
        }
        powerUp.setVelocity(100, 400);
        powerUp.setCollideWorldBounds(false);
        // powerUp.setBounceX(1);
        // powerUp.setBounceY(1);
    }
}
function pickPowerUp(player, powerUp) {
    // the twoo params set to true, make it inactive and hide it from the display list.
    powerUp.disableBody(true, true);
    if (timerPowerUp) {
        timerPowerUp.remove();
    }
    setPlayerPowerUpAndDelayToRemove(powerUp, player, 'gray_anim');
    setPlayerPowerUpAndDelayToRemove(powerUp, player, 'red_anim');
    powerUps.getChildren().forEach(function (pu) {
        if (pu.id === powerUp.id) {
            powerUp.destroy();
        }
    });

}
function setPlayerPowerUpAndDelayToRemove(powerUp, player, witchPower) {
    if (powerUp.anims.currentAnim.key === witchPower) {
        player.powerUp = witchPower;
        timerPowerUp = self.time.delayedCall(delayToRemovePowerUp, function () {
            player.powerUp = null;
        }, [], this);
    }
}
// player
function movePlayerManager(player, action) {
    if (action === 'left') {
        player.setVelocityX(-300);
    } else if (action === 'right') {
        player.setVelocityX(300);
    }

    if (action === 'up') {
        player.setVelocityY(-200);
    } else if (action === 'down') {
        player.setVelocityY(200);
    }
}
function setNewPositionPlayers(playerInfo) {
    if (playerInfo) {
        playersGroup.getChildren().forEach(function (player) {
            if (playerInfo.id === player.id) {
                player.x = positionPlayerExtra[playerInfo.position];
                player.position = playerInfo.position;
                removeHealthBar(player.id);
                removeScore(player.id);
                drawHealthBar(self, player.health, player.x, player.color, player.id, player.position);
                drawScores(self, player.x, player.id, player.position);
                setTintToPlayer(player);
            }
        });
    }
}
function hurtPlayer(player, enemy) {
    this.resetShipPos(enemy);
    if (player.alpha < 1) {
        return
    }
    new Explosion(self, player.x, player.y);
    player.disableBody(true, true);
    player.health -= enemy.speed * 10;
    if (player.health < 0) {
        player.health = 0;
    }
    drawHealthBar(self,
        player.health,
        healthBars[player.id].x,
        player.color,
        player.id,
        player.position);
    self.time.addEvent({
        delay: 1000,
        callback: this.resetPlayer(player),
        callbackScope: this,
        loop: false
    });
    if (player.health < 1) {
        removePlayerFromPhaser(self, player.id);
    }
}
function resetPlayer(player) {
    var x = positionPlayerExtra[player.position];
    var y = self.game.config.height + 164;
    player.enableBody(true, x, y, true, true);
    player.alpha = 0.5;
    var tween = self.tweens.add({
        targets: player,
        y: self.game.config.height - 64,
        ease: 'Power1',
        repeat: 0,
        onComplete: function () {
            player.alpha = 1
        },
        callbackScope: this
    });
}
function addPlayerToPhaser(self, playerInfo) {
    const player = self.physics.add.sprite(positionPlayerExtra[playerInfo.position], playerInfo.y, 'player');
    player.id = playerInfo.id;
    player.color = playerInfo.color;
    player.position = playerInfo.position;
    player.health = playerInfo.health;
    player.score = playerInfo.score;
    player.projectilesGroup = self.add.group();
    player.setCollideWorldBounds(true);
    player.setDepth(2);
    // player.play('player_anim');
    setTintToPlayer(player);
    playersGroup.add(player);
    timeGame += extraTimeByPlayer;
    self.physics.add.overlap(player.projectilesGroup, enemies, hitEnemy, null, this);
    self.physics.add.collider(player.projectilesGroup, powerUps, function (projectile, powerUp) {
        projectile.destroy();
    });
    self.physics.add.overlap(player, powerUps, this.pickPowerUp, null, this);
    self.physics.add.overlap(playersGroup, enemies, this.hurtPlayer, null, this);
    // particles
    addParticles(player);

}
function addParticles(player) {
    particles = self.add.particles('flares');
    var emitter = particles.createEmitter({
        frame: player.color,
        lifespan: 300,
        y: { min: 50, max: 50 },
        speedY: { min: 200, max: 400 },
        gravityY: 1200,
        scale: { start: 0.6, end: 0 },
        quantity: 2,
        blendMode: 'ADD'
    });
    particles.setDepth(1);
    emitter.startFollow(player);
    player.particles = particles;
}
function setTintToPlayer(player) {
    player.setTint(0xffffff, 0xffffff, mapColorToExa(player.color), mapColorToExa(player.color));

}
function removePlayerFromPhaser(self, playerId) {
    playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.id) {
            player.particles.destroy();
            player.destroy();
            if (!gameStarted) {
                timeGame -= extraTimeByPlayer;
            }
        }
    });
    if (playersGroup.getChildren().length === 0) {
        gameStarted = false;
    }
}
function mapColorToExa(color) {
    switch(color) {
        case 'red':
            return 0xff0000;
            break;
        case 'green':
            return 0x00ff00;
            break;
        case 'blue':
            return 0x0000ff;
            break;
        case 'yellow':
            return 0xefff00;
            break;
        case 'white':
            return 0xffffff;
            break;
        default: return 0x000000;
    }

}
// enemies / ship
function resetShipPos(ship) {
    ship.y = 0;
    ship.x = getRandomX(50, this.game.config.width-50);
}
function duplicateEnemies() {
    var iEnemy = 1;
    for (var i = 1; i < 4 * playersGroup.getChildren().length; i++) {
        var ship = self.add.sprite(getRandomX(0, self.game.config.width), -50, 'ship' + iEnemy);
        ship.speed = iEnemy;
        iEnemy++;
        if(iEnemy > 3) {
            iEnemy = 1;
        }
        ship.play('ship' + iEnemy + '_anim');
        enemies.add(ship);
    }
}
function duplicateEnemiesByTime(time) {
    if (time === 0) {
        // duplicateEnemies()
    }
}
function moveShip(ship, speed) {
    ship.y += speed;
    if (ship.y > this.game.config.height) {
        resetShipPos(ship);
    }
}
function hitEnemy(projectile, enemy) {
    var explosion = new Explosion(self, enemy.x, enemy.y);
    projectile.destroy();
    this.resetShipPos(enemy);
    playersGroup.getChildren().forEach(function (player) {
        if (projectile.id === player.id) {
            player.score += enemy.speed * 10;
            scores[player.id].setText(this.zeroPad(player.score, 6));
        }
    });
}
