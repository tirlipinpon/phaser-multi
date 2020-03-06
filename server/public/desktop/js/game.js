var game;

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

    socket.emit('desktop connected');
    self.numberPlayers = getText(self);
}

function create() {
    var self = this;
    self.playersGroup = this.add.group();
    socket.on('desktop nbPlayers', function (nbPlayers) {
        // console.log('nbPlayers : ' + nbPlayers);
        self.numberPlayers.setText(nbPlayers + ' player')
    });
    socket.on('desktop new player', function (playerInfo) {
        console.log('C - new player : ', playerInfo);
        addPlayerToPhaser(self, playerInfo);
    });
    socket.on('desktop remove player', function (playerId) {
        console.log('E - remove Player : ', playerId);
        removePlayerFromPhaser(self, playerId);
    });
}

function update() {
}

function getText(self) {
    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    var text = self.add.text(window.innerWidth/2-100, window.innerHeight/2, '0 player', style);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    return text;
}

function addPlayerToPhaser(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
    player.id = playerInfo.id;
    player.color = playerInfo.color;
    player.position = playerInfo.position;
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