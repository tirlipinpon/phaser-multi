/**
 * Created by tirli on 20-02-20.
 */
class Beam extends Phaser.GameObjects.Sprite {
    constructor(scene, player) {

        var x = player.x;
        var y = player.y - 16;

        super(scene, x, y, 'beam');

        scene.add.existing(this);
        scene.physics.world.enableBody(this);
        this.body.velocity.y = -250;
        this.id = player.id;
        player.projectilesGroup.add(this);
    }

    update() {
        if (this.y < 32) {
            this.destroy();
        }
    }
}