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
    this.socket = io();
};
window.onbeforeunload = function (e) {
    this.socket.emit('desktop disconnected');
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

    this.nbPlayerText = this.add.text(100,100, '0 player');
}

function create() {
    var self = this;

    self.playersGroup = this.add.group();
    socket.emit('desktop connected');

    socket.on('number players', function (number, color) {
        self.nbPlayerText.setText(number + ' player')
    });
    socket.on('start game', function () {
        console.log('start game to desktop');
    });

}

function update() {
}