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
}

function create() {
    var self = this;
}

function update() {
}