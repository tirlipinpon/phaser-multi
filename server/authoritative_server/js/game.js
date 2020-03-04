const players = {};
const desktops = {};
var mobileList = [];
const teamColor = ['red', 'blue', 'green', 'grey'];
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

    io.on('connection', function (socket) {
        socket.on('desktop disconnected', function () {
            console.log('desktop disconnected');
            removeDesktopPlayers(self, socket);
        });
        socket.on('desktop connected', function () {
            console.log('desktop connected');
        });
        socket.on('mobile connected', function () {
            if (Object.keys(players).length < 4) {
                console.log('a mobile connected');
                players[socket.id] = getNewPlayers(socket);
                addPlayer(self, players[socket.id]);
                mobileList.push(socket.id);
                socket.emit('player added', Object.keys(players).length, players[socket.id].teamColor);
            } else {
                socket.emit('party full', 'This party can hold 4 players max.');
            }
        });
        socket.on('mobile disconnected', function () {
            console.log('mobile disconnected');
            removePlayer(self, socket.id, socket);
        });
        socket.on('start game', function () {
            console.log('start game');
        });
    });
}

function update() {
    const self = this;
}

function getNewPlayers(socket) {
    return {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        // because not added yet to players list
        // use first array elem with length 0
        teamColor: teamColor[Object.keys(players).length],
        input: {
            left: false,
            right: false,
            up: false,
            down: false

        }
    };
}

function addPlayer(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
    player.playerId = playerInfo.playerId;
    player.projectilesGroup = self.add.group();
    self.playersGroup.add(player);
}

function removeDesktopPlayers(self, socket) {
    self.playersGroup.getChildren().forEach(function (player) {
        removePlayer(self, player.playerId, socket)
    });
}

function removePlayer(self, playerId, socket) {
    delete players[playerId];
    self.playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
            player.destroy();
            socket.broadcast.emit('disconnected', 'desktop dead ! You are disconnected');
        }
    });
}

const game = new Phaser.Game(config);
window.gameLoaded();
