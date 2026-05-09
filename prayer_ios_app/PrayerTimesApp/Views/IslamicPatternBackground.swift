import SwiftUI

struct IslamicPatternBackground: View {
    var body: some View {
        ZStack {
            AppPalette.midnight.ignoresSafeArea()
            Canvas { context, size in
                let step: CGFloat = 50
                for x in stride(from: 0, through: size.width, by: step) {
                    for y in stride(from: 0, through: size.height, by: step) {
                        var path = Path()
                        let center = CGPoint(x: x, y: y)
                        for i in 0..<8 {
                            let angle = CGFloat(i) * (.pi / 4)
                            let p = CGPoint(x: center.x + cos(angle) * 10, y: center.y + sin(angle) * 10)
                            i == 0 ? path.move(to: p) : path.addLine(to: p)
                        }
                        path.closeSubpath()
                        context.stroke(path, with: .color(AppPalette.gold.opacity(0.07)), lineWidth: 1)
                    }
                }
            }
        }
    }
}
