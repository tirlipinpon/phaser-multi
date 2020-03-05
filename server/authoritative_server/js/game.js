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
var currentDesktop;
const players = {};
const playerColor = ['red', 'green', 'blue', 'pink'];
const playerUsedColor = [];
var currentPosition = 1;

function preload() {
    const self = this;
    self.load.image('ship', 'assets/spaceShips_001.png');
}

function create() {
    var self = this;
    this.playersGroup = self.physics.add.group();
    io.on('connection', function (socket) {
        // desktop entries
        socket.on('desktop connected', function () {
            currentDesktop = socket;
            console.log('1 - desktop connected : ' + currentDesktop.id);
        });
        // mobile entries
        socket.on('mobile connected', function () {
            console.log('2 - mobile connected : ' + socket.id);
            players[socket.id] = getNewPlayers(socket);
            addPlayerToPhaser(self, players[socket.id]);
            socket.broadcast.emit('desktop nbPlayers', Object.keys(players).length);
            socket.emit('mobile set params', Object.keys(players).length === 1, players[socket.id].color);
            currentDesktop.emit('desktop new Player', players[socket.id]);
        });
    });
}

function update() {
    const self = this;
}

const game = new Phaser.Game(config);
window.gameLoaded();

function getNewPlayers(socket) {
    var player = {
        x: currentPosition * 100,
        y: 100,
        id: socket.id,
        color: playerColor[0],
        position: currentPosition,
        input: {
            left: false,
            right: false,
            up: false,
            down: false

        }
    };
    currentPosition++;
    playerUsedColor.push(playerColor[0]);
    playerColor.shift();
    return player;
}

function addPlayerToPhaser(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
    player.playerId = playerInfo.playerId;
    player.projectilesGroup = self.add.group();
    self.playersGroup.add(player);
}