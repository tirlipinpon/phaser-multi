class Beam extends Phaser.GameObjects.Sprite {

    constructor(scene, player) {
        super(scene, player.x, player.y - 16, 'beam');

        scene.add.existing(this);
        scene.physics.world.enableBody(this);
        this.body.velocity.y = -250;
        player.projectilesGroup.add(this);
    }

    update() {
        if (this.y < 132) {
            this.destroy();
        }
    }
}