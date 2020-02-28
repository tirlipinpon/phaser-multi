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
    this.load.image('ship', '/public/desktop/assets/spaceShips_001.png');
    this.load.image('otherPlayer', '/public/desktop/assets/enemyBlack5.png');
    this.load.image('star', '/public/desktop/assets/star_gold.png');
    this.load.spritesheet('beam', '/public/desktop/assets/spritesheets/beam.png', {frameWidth: 16, frameHeight: 16});

    this.load.image('background', '/public/desktop/assets/background.png');
    this.load.image('parallax_1', '/public/desktop/assets/parallax1.png');
    this.load.image('parallax_2', '/public/desktop/assets/parallax2.png');
    this.load.image('stars', '/public/desktop/assets/stars.png');
}

function create() {
    var self = this;
    this.socket = io();
    self.playersGroup = this.add.group();

    animsCreate(self);

    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                self.player = displayPlayers(self, players[id], 'ship');
            } else {
                displayPlayers(self, players[id], 'otherPlayer');
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
        displayPlayers(self, playerInfo, 'otherPlayer');
    });
    this.socket.on('playerUpdates', function (players) {
        Object.keys(players).forEach(function (id) {
            self.playersGroup.getChildren().forEach(function (player) {
                if (players[id].playerId === player.playerId) {
                    player.setPosition(players[id].x, players[id].y);
                    // player.projectiles = players[id].projectiles;
                }

                player.projectilesGroup.getChildren().forEach(function (beam) {
                    // if (players[id].playerId !== player.playerId) {
                    //     displayOpponentBeam(self, player)
                    // }
                    beam.update();
                });

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
    this.socket.on('otherPlayerFire', function (playerinfo) {
        self.playersGroup.getChildren().forEach(function (player) {
            if (playerinfo.playerId === player.playerId) {
                console.log(player);
                displayBeam(self, player);
            }
        });

    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    this.downKeyPressed = false;

    initBackground(self);
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
        displayBeam(this, this.player);
    }

    moveBackground(self)
}

function moveBackground(self) {
    self.background.tilePositionY -= 0.5;
    self.parallax_1.tilePositionY -= 3;
    self.parallax_2.tilePositionY -= 3;
    self.stars.tilePositionY -= 1;
    self.stars2.tilePositionY -= .8;
    self.stars2.scaleX = .8;
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
    var beam = new Beam(self, player);
}

function displayOpponentBeam(self, playerInfo) {
    const beam = self.physics.add.image(playerInfo.x, playerInfo.y - 16, 'beam');
    var beamToEmit = {
        name: 'beam',
        velocity: -250
    };
    beam.body.velocity.y = beamToEmit.velocity;
}

function displayPlayers(self, playerInfo, sprite) {
    const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite);
    if (playerInfo.team === 'blue') player.setTint(0x0000ff);
    else player.setTint(0xff0000);
    player.playerId = playerInfo.playerId;
    player.projectilesGroup = self.add.group();
    self.playersGroup.add(player);
    return player;
}

function initBackground(self) {
    this.background = setBackground(self, 'background', 1);
    this.stars = setBackground(self, 'stars', 0.2);
    this.stars2 = setBackground(self, 'stars', 0.1);
    this.parallax_1 = setParallax(self, 0, 0, 50, 'parallax_1');
    this.parallax_2 = setParallax(self, self.game.config.width - 50, 0, 50, 'parallax_2');
}

function setBackground(self, name, alpha) {
    this.background = self.add.tileSprite(0, 0, self.game.config.width, self.game.config.height, name);
    this.background.setOrigin(0, 0);
    this.background.setDisplaySize(self.game.config.width, self.game.config.height);
    this.background.setAlpha(alpha)

    return this.background;
}

function setParallax(self, x, y, size, name) {
    this.parallax = self.add.tileSprite(x, y, size, self.game.config.height, name);
    this.parallax.setOrigin(0, 0);
    this.parallax.alpha = 0.5;
    // this.parallax_1.scaleX = 1.2;
    // this.parallax_1.setPosition(-35, 0);
    // this.parallax_1.setScrollFactor(0);
    return this.parallax;
}