export class InputController {
  constructor(scene) {
    this.scene = scene;
    this.justPressed = false;
  }

  bind() {
    this.spaceKey = this.scene.input.keyboard.addKey("SPACE");
    this.pointerDown = false;
    this.scene.input.on("pointerdown", () => {
      this.pointerDown = true;
    });
  }

  update() {
    this.justPressed = this.spaceKey?.isDown || this.pointerDown;
    this.pointerDown = false;
    return this.justPressed;
  }
}
