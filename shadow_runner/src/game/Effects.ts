import Phaser from 'phaser'

export function addBurst(scene: Phaser.Scene, x: number, y: number, color = 0x57f8d4, count = 18): void {
  for (let i = 0; i < count; i += 1) {
    const dot = scene.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.95).setDepth(80)
    scene.tweens.add({
      targets: dot,
      x: x + Phaser.Math.Between(-70, 70),
      y: y + Phaser.Math.Between(-70, 70),
      alpha: 0,
      scale: 0.1,
      duration: Phaser.Math.Between(280, 520),
      ease: 'Sine.easeOut',
      onComplete: () => dot.destroy(),
    })
  }
}

export function addFloatingText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#57f8d4'): void {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color,
      stroke: '#030510',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(90)

  scene.tweens.add({
    targets: label,
    y: y - 42,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => label.destroy(),
  })
}

export function flashCamera(scene: Phaser.Scene, color = 0x57f8d4, duration = 180): void {
  scene.cameras.main.flash(duration, (color >> 16) & 255, (color >> 8) & 255, color & 255, false)
}
