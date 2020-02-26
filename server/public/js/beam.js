class Beam extends Phaser.GameObjects.Sprite {

    constructor(scene, player) {
        super(scene, player.x, player.y - 16, 'beam');

        scene.add.existing(this);
        scene.physics.world.enableBody(this);
        this.body.velocity.y -= 50;
        player.projectiles.add(this);
    }

    update() {
        if (this.y < 32) {
            this.destroy();
        }
    }
}