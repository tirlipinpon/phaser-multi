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

    io.on('connection', function (socket) {
        socket.on('disconnect', function () {
            console.log('mobile disconnected');
        });
        socket.on('mobileConnected', function () {
            console.log('a mobile connected');
            socket.emit('start');
        });
    });
}

function update() {
    const self = this;
}

const game = new Phaser.Game(config);
window.gameLoaded();
