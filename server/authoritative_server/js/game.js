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
var currentDesktop = null;
const players = {};
var playerColor = ['red', 'green', 'blue', 'pink'];
var playerUsedColor = [];
var currentPosition = 1;
var gameStarted = false;
var gameLaunched = false; // TODO: for bug eventlistener from mobile send many

function preload() {
    const self = this;
}

function create() {
    var self = this;
    io.on('connection', function (socket) {
        // desktop entries
        socket.on('desktop connected', function () {
            console.log('A - desktop connected : ' + socket.id);
            currentDesktop = socket;
        });
        socket.on('desktop disconnected', function () {
            console.log('G - desktop disconnected');
            socket.broadcast.emit('mobile desktop disconnected');
            initParameters();
        });
        socket.on('desktop game started', function () {
            console.log('F - game started');
            socket.broadcast.emit('mobile game started');
        });
        // mobile entries
        socket.on('mobile connected', function () {
            if (currentDesktop) {
                console.log('B - mobile connected : ' + socket.id);
                var player = setNewPlayersObject(socket, self);
                console.log('C - new player : ', player);
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
                updateColorFromRemovedPlayer(players[socket.id].color);
                if (currentDesktop) {
                    currentDesktop.emit('desktop remove player', players[socket.id].id);
                }

                delete players[socket.id];
                setNewPosition();
                if (currentDesktop) {
                    currentDesktop.emit('desktop nbPlayers', Object.keys(players).length);
                }
            }
        });
        socket.on('mobile start game', function () {
            console.log('E - start game : ' + socket.id);
            if (!gameLaunched) {
                gameLaunched = true;
                currentDesktop.emit('desktop start game', 3000);
            }
        });
        socket.on('mobile can connect', function () {
            socket.emit('mobile get can connect', !gameLaunched && Object.keys(players).length < 5)
        });
        socket.on('mobile shoot', function () {
            currentDesktop.emit('desktop mobile shoot', players[socket.id])
        });
        socket.on('mobile action', function (action) {
            if (players[socket.id]) {
                currentDesktop.emit('desktop mobile action', players[socket.id], action);
            }
        });
    });
}

function update() {
    const self = this;
}

const game = new Phaser.Game(config);
window.gameLoaded();

function initParameters() {
    currentDesktop = null;
    playerColor = ['red', 'green', 'blue', 'pink'];
    playerUsedColor = [];
    currentPosition = 1;
    gameStarted = false;
    gameLaunched = false;
}

function setNewPlayersObject(socket, self) {
    var player = {
        x: currentPosition * 100 * (currentPosition/2),
        y: self.game.config.height + 164,
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
    player.position = Object.keys(players).length;
    player.health = 100;
    player.score = 0;
    return player;
}

function updateColorFromRemovedPlayer(color) {
    // add color to be used for next incoming player
    playerColor.push(color);
    // add unused color from removed player
    playerUsedColor = playerUsedColor.filter(function (value, index, arr) {
        return value !== color;
    });
}

function emitMobileSetParams(player) {
    io.to(player.id).emit(
        'mobile set params',
        Object.keys(players).length === 1,
        player.color,
        player.position);
}

function setNewPosition() {
    var position = 1;
    for (var key in players) {
        players[key].position = position;
        console.log('server new position :' + players[key].id + ' position: ' + players[key].position);
        currentDesktop.emit('desktop new position', players[key]);
        emitMobileSetParams(players[key]);
        position++;
    }
}