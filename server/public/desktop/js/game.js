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
}

function update() {
}