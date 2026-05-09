import SwiftUI

struct PrayerRowView: View {
    let prayer: PrayerTime
    let timeText: String
    let isHighlighted: Bool
    let isPast: Bool
    let language: AppLanguage
    let notificationEnabled: Bool
    let onBellTap: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: prayer.type.icon)
                .foregroundStyle(prayer.type.isPrayer ? AppPalette.gold : AppPalette.teal)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text("\(prayer.type.englishName) / \(prayer.type.arabicName)")
                    .foregroundStyle(AppPalette.warmWhite)
                Text(timeText)
                    .font(.subheadline)
                    .foregroundStyle(AppPalette.warmWhite.opacity(0.85))
            }
            Spacer()
            if prayer.type.isPrayer {
                Button(action: onBellTap) {
                    Image(systemName: notificationEnabled ? "bell.fill" : "bell.slash")
                        .foregroundStyle(AppPalette.gold)
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial.opacity(isHighlighted ? 0.45 : 0.22), in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(isHighlighted ? AppPalette.gold : .clear, lineWidth: 1))
        .opacity(isPast ? 0.5 : 1)
    }
}
