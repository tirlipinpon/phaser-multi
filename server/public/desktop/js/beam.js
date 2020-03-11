/**
 * Created by tirli on 20-02-20.
 */
class Beam extends Phaser.GameObjects.Sprite {
    constructor(scene, player, type, size) {

        var x = player.x;
        var y = player.y - 16;
        var sizeScale = size;

        super(scene, x, y, type);

        scene.add.existing(this);
        scene.physics.world.enableBody(this);
        this.body.velocity.y = -250;
        this.id = player.id;
        this.setScale(sizeScale);
        player.projectilesGroup.add(this);
    }

    update() {
        if (this.y < 32) {
            this.destroy();
        }
    }
}