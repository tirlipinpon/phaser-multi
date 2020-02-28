const players = {};

const config = {
    type: Phaser.HEADLESS,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {y: 0}
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    autoFocus: false,
    scale: {
        parent: 'phaser-example',
        // mode: Phaser.Scale.Fit,
        // autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    }
};

function preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('star', 'assets/star_gold.png');
    this.load.image('beam', 'assets/beam.png');
}

function create() {
    const self = this;
    this.playersGroup = self.physics.add.group();

    self.star = self.physics.add.image(randomPosition(700), randomPosition(500), 'star');

    self.physics.add.collider(this.playersGroup);
    self.physics.add.overlap(this.playersGroup, self.star, function (star, player) {
        self.star.setPosition(randomPosition(700), randomPosition(500));
        io.emit('starLocation', {x: self.star.x, y: self.star.y});
    });

    io.on('connection', function (socket) {
        console.log('a user connected');
        // create a new player and add it to our players object
        players[socket.id] = getNewPlayers(socket);
        // add player to server
        addPlayer(self, players[socket.id], self.star);

        socket.on('disconnect', function () {
            console.log('user disconnected');
            // remove player from server
            removePlayer(self, socket.id);
            // remove this player from our players object
            delete players[socket.id];
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });
        // when a player moves, update the player data
        socket.on('playerInput', function (inputData) {
            handlePlayerInput(self, socket.id, inputData);
        });
        socket.on('playerSpacebar', function () {
            handlePlayerSpacebar(self, socket.id, socket);
        });

        socket.on('mobileConnected', function () {
            // send the players object to the new player
            socket.emit('currentPlayers', players);

            // update all other players of the new player
            socket.broadcast.emit('newPlayer', players[socket.id]);

            // send the star object to the new player
            socket.emit('starLocation', {x: self.star.x, y: self.star.y});
        });
        socket.on('orientationGamma', function (gamma) {
            console.log(gamma)
        });
        socket.on('orientationAlpha', function (gamma) {
            console.log(gamma)
        });
    });


}

function update() {
    const self = this;

    this.playersGroup.getChildren().forEach(function (player) {
        const input = players[player.playerId].input;

        if (input.left) {
            player.setVelocityX(-200);
        } else if (input.right) {
            player.setVelocityX(200);
        } else {
            player.setVelocityX(0);
        }
        if (input.up) {
            player.setVelocityY(-200);
        } else if (input.down) {
            player.setVelocityY(200);
        } else {
            player.setVelocityY(0);
        }

        players[player.playerId].x = player.x;
        players[player.playerId].y = player.y;

        player.projectilesGroup.getChildren().forEach(function (beam) {
            if (beam.y < 132) {
                beam.destroy();
                console.log(' - ' + player.projectilesGroup.getChildren().length);
            }
        });
    });
    // when a ship goes off the screen, force ship to appear on the other side of the screen.
    self.physics.world.wrap(this.playersGroup, 5);

    io.emit('playerUpdates', players);
}

function getNewPlayers(socket) {
    return {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
        input: {
            left: false,
            right: false,
            up: false,
            down: false

        }
    };
}

function randomPosition(max) {
    return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
    self.playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
            players[player.playerId].input = input;
        }
    });
}

function handlePlayerSpacebar(self, playerId, socket) {
    self.playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
            addBeam(self, player);
            socket.broadcast.emit('otherPlayerFire', players[socket.id]);
        }
    });
}

function addBeam(self, playerInfo) {
    const beam = self.physics.add.image(playerInfo.x, playerInfo.y - 16, 'beam');
    var beamToEmit = {
        name: 'beam',
        velocity: -250
    };
    beam.body.velocity.y = beamToEmit.velocity;
    playerInfo.projectilesGroup.add(beam);
    console.log(' ++++ ' + playerInfo.projectilesGroup.getChildren().length);
}

function addPlayer(self, playerInfo, star) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
    player.playerId = playerInfo.playerId;
    player.projectilesGroup = self.add.group();
    self.physics.add.overlap(player.projectilesGroup, star, function (star, player) {
        self.star.setPosition(randomPosition(700), randomPosition(500));
        io.emit('starLocation', {x: self.star.x, y: self.star.y});
    });
    self.playersGroup.add(player);
}

function removePlayer(self, playerId) {
    self.playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
            player.destroy();
        }
    });
}

const game = new Phaser.Game(config);
window.gameLoaded();
