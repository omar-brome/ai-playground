import SwiftUI

struct QiblaView: View {
    @EnvironmentObject var vm: QiblaViewModel

    var body: some View {
        ZStack {
            IslamicPatternBackground()
            VStack(spacing: 18) {
                Text("القبلة / Qibla")
                    .font(.title2.bold())
                    .foregroundStyle(AppPalette.warmWhite)

                ZStack {
                    Canvas { context, size in
                        let rect = CGRect(origin: .zero, size: size)
                        context.stroke(Path(ellipseIn: rect), with: .color(AppPalette.gold.opacity(0.5)), lineWidth: 2)
                    }
                    .frame(width: 280, height: 280)

                    Image(systemName: "location.north.fill")
                        .font(.system(size: 64))
                        .foregroundStyle(AppPalette.gold)
                        .rotationEffect(.degrees(vm.qiblaBearing - vm.heading))
                        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: vm.heading)

                    VStack {
                        Image(systemName: "building.columns.fill")
                            .foregroundStyle(AppPalette.gold)
                        Spacer()
                    }
                    .frame(height: 220)
                }
                Text("القبلة: \(Int(vm.qiblaBearing).arabicNumeral)° / Qibla: \(Int(vm.qiblaBearing))°")
                    .foregroundStyle(AppPalette.warmWhite)
                Text(vm.calibrationMessage)
                    .foregroundStyle(AppPalette.teal)
                    .font(.footnote)
                if vm.permissionDenied {
                    Text("Location permission denied. Enable location for exact Qibla.")
                        .foregroundStyle(.red)
                }
            }
            .padding()
        }
        .onAppear {
            vm.start()
        }
    }
}
