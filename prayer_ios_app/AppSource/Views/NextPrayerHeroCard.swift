import SwiftUI

struct NextPrayerHeroCard: View {
    let prayer: PrayerTime?
    let arabicCountdown: String
    let englishCountdown: String
    let progress: Double
    let language: AppLanguage

    @State private var pulse = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 28)
                .fill(.ultraThinMaterial.opacity(0.28))
                .overlay(
                    RoundedRectangle(cornerRadius: 28)
                        .stroke(AppPalette.gold.opacity(0.5), lineWidth: 1)
                )
                .shadow(color: AppPalette.gold.opacity(pulse ? 0.4 : 0.12), radius: pulse ? 22 : 8)
                .onAppear {
                    withAnimation(.easeInOut(duration: 1.7).repeatForever(autoreverses: true)) {
                        pulse = true
                    }
                }

            VStack(spacing: 10) {
                Text("Next Prayer")
                    .foregroundStyle(AppPalette.warmWhite.opacity(0.9))
                Text(prayer?.type.arabicName ?? "--")
                    .font(.system(size: 38, weight: .bold))
                    .foregroundStyle(AppPalette.gold)
                Text(prayer?.type.englishName ?? "--")
                    .foregroundStyle(AppPalette.warmWhite.opacity(0.9))
                Text(language == .arabic ? arabicCountdown : englishCountdown)
                    .font(.headline)
                    .foregroundStyle(AppPalette.teal)
            }
            .padding()

            Circle()
                .trim(from: 0, to: progress)
                .stroke(AppPalette.gold, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .padding(8)
        }
        .frame(height: 260)
    }
}
