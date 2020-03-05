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

function preload() {
    const self = this;
    io.on('connection', function (socket) {
        socket.on('desktop connected', function() {
            currentDesktop = socket;
            console.log('1 - desktop connected : ' + currentDesktop.id);
        })
    });
}

function create() {

}

function update() {
    const self = this;
}

const game = new Phaser.Game(config);
window.gameLoaded();
