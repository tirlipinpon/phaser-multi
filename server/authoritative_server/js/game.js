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
var playerColor = ['red', 'green', 'blue', 'pink'];
var playerUsedColor = [];
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
            console.log('A - desktop connected : ' + socket.id);
            currentDesktop = socket;
        });
        // mobile entries
        socket.on('mobile connected', function () {
            if (currentDesktop) {
                console.log('B - mobile connected : ' + socket.id);
                var player = setNewPlayersObject(socket);
                console.log('C - new player : ', player);
                addPlayerToPhaser(self, player);
                socket.emit('mobile set params',
                    Object.keys(players).length === 1,
                    player.color,
                    player.position);
                emitMobileSetParams(players[socket.id]);
                currentDesktop.emit('desktop nbPlayers', Object.keys(players).length);
                currentDesktop.emit('desktop new player', players[socket.id]);
            }
        });
        socket.on('mobile disconnected', function (isFirstPlayer) {
            if (players[socket.id]) {
                console.log('D - mobile disconnected : ' + socket.id + ' isFirstPlayer : ' + isFirstPlayer);
                removePlayerFromPhaser(self, socket.id);
                updateColorFromRemovedPlayer(players[socket.id].color);
                currentDesktop.emit('desktop remove player', players[socket.id].id);
                delete players[socket.id];
                setNewPosition();
                currentDesktop.emit('desktop nbPlayers', Object.keys(players).length);
            }
        });
        socket.on('start game', function () {
           console.log('E - start game : ' + socket.id);
        });

    });
}

function update() {
    const self = this;
}

const game = new Phaser.Game(config);
window.gameLoaded();

function setNewPlayersObject(socket) {
    var player = {
        x: currentPosition * 100,
        y: 100,
        id: socket.id,
        color: playerColor[0],
        position: null,
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
    players[socket.id] = player;
    player.position =  Object.keys(players).length;
    return player;
}

function addPlayerToPhaser(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
    player.playerId = playerInfo.playerId;
    player.projectilesGroup = self.add.group();
    self.playersGroup.add(player);
}

function removePlayerFromPhaser(self, playerId) {
    self.playersGroup.getChildren().forEach(function (player) {
        if (playerId === player.id) {
            player.destroy();
        }
    });
}

function updateColorFromRemovedPlayer(color) {
    // add color to be used for next incoming player
    playerColor.push(color);
    // add unused color from removed player
    playerUsedColor = playerUsedColor.filter(function(value, index, arr) { return value !== color; });
    console.log()
}

function emitMobileSetParams(player) {
    io.to(player.id).emit('mobile set params',
        Object.keys(players).length === 1,
        player.color,
        player.position);
}

function setNewPosition() {
    var position = 1;
    for (var key in players) {
        players[key].position = position;
        console.log('server new position :' +  players[key].id + ' position: ' + players[key].position);
        emitMobileSetParams(players[key]);
        position++;
    }
}