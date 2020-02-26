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

    var game = new Phaser.Game(config);
};
function preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('star', 'assets/star_gold.png');
    this.load.spritesheet('beam', 'assets/spritesheets/beam.png', {frameWidth: 16, frameHeight: 16});
}

function create() {
    var self = this;
    this.socket = io();
    self.playersGroup = this.add.group();
    self.projectilesGroup = this.add.group();

    animsCreate(self);

    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                self.player = displayPlayers(self, players[id], 'ship');
            } else {
                self.player = displayPlayers(self, players[id], 'otherPlayer');
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
        self.player = displayPlayers(self, playerInfo, 'otherPlayer');
    });
    this.socket.on('playerUpdates', function (players) {
        Object.keys(players).forEach(function (id) {
            self.playersGroup.getChildren().forEach(function (player) {
                if (players[id].playerId === player.playerId) {
                    player.setPosition(players[id].x, players[id].y);
                    // player.projectiles = players[id].projectiles;
                }
                if (players[id].projectiles.length) {

                }
            });
        });
    });
    /**
     * check to see if the star game object doesn’t exist
     * if it doesn’t we create the star game object at the location that was provided.
     * If the star game object does exist,
     * then we just update it’s position by calling the setPosition method
     */
    this.socket.on('starLocation', function (starLocation) {
        if (!self.star) {
            self.star = self.add.image(starLocation.x, starLocation.y, 'star');
        } else {
            self.star.setPosition(starLocation.x, starLocation.y);
        }
    });
    this.socket.on('disconnect', function (playerId) {
        self.playersGroup.getChildren().forEach(function (player) {
            if (playerId === player.playerId) {
                player.destroy();
            }
        });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    this.downKeyPressed = false;


    // this.physics.add.collider(this.projectilesGroup, this.playersGroup, function (projectile, player) {
    //     projectile.destroy();
    // });
}

function update() {
    const left = this.leftKeyPressed;
    const right = this.rightKeyPressed;
    const up = this.upKeyPressed;
    const down = this.downKeyPressed;

    if (this.cursors.left.isDown) {
        this.leftKeyPressed = true;
    } else if (this.cursors.right.isDown) {
        this.rightKeyPressed = true;
    } else {
        this.leftKeyPressed = false;
        this.rightKeyPressed = false;
    }

    if (this.cursors.up.isDown) {
        this.upKeyPressed = true;
    } else if (this.cursors.down.isDown) {
        this.downKeyPressed = true;
    } else {
        this.upKeyPressed = false;
        this.downKeyPressed = false;
    }

    if (left !== this.leftKeyPressed ||
        right !== this.rightKeyPressed ||
        up !== this.upKeyPressed ||
        down !== this.downKeyPressed
    ) {
        this.socket.emit('playerInput', {
            left: this.leftKeyPressed,
            right: this.rightKeyPressed,
            up: this.upKeyPressed,
            down: this.downKeyPressed
        });
    }

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
        this.socket.emit('playerSpacebar');
        // displayBeam(this, this.player)

    }
}

function animsCreate(self) {
    self.anims.create({
        key: 'beam_anim', // id for animation
        frames: self.anims.generateFrameNumbers('beam', {
            start: 1,
            end: 2
        }), // an array of frames : generateFrameNumbers -> using frames from ship spritesheet
        frameRate: 20, // speed of animation (frame/sec)
        repeat: -1 // infinity loop -1
    });
}

function displayBeam(self, player) {
    new Beam(self, player);
}

function displayPlayers(self, playerInfo, sprite) {
    const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite);
    if (playerInfo.team === 'blue') player.setTint(0x0000ff);
    else player.setTint(0xff0000);
    player.playerId = playerInfo.playerId;
    // player.projectiles = playerInfo.projectiles;
    self.playersGroup.add(player);
    return player;
}
