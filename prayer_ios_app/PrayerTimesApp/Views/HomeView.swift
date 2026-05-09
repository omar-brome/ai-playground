import SwiftUI

struct HomeView: View {
    @EnvironmentObject var vm: PrayerTimesViewModel
    @State private var prayerNotificationStates: [PrayerType: Bool] = [:]

    var body: some View {
        ZStack {
            IslamicPatternBackground()
            ScrollView {
                VStack(spacing: 18) {
                    header
                    NextPrayerHeroCard(
                        prayer: vm.nextPrayer,
                        arabicCountdown: vm.countdownTextArabic,
                        englishCountdown: vm.countdownTextEnglish,
                        progress: vm.progress,
                        language: vm.language
                    )

                    if let prayers = vm.dayPrayers?.prayers {
                        ForEach(prayers) { prayer in
                            PrayerRowView(
                                prayer: prayer,
                                timeText: vm.timeString(for: prayer.time),
                                isHighlighted: prayer.type == vm.nextPrayer?.type,
                                isPast: prayer.time < Date() && prayer.type != vm.nextPrayer?.type,
                                language: vm.language,
                                notificationEnabled: prayerNotificationStates[prayer.type, default: true]
                            ) {
                                prayerNotificationStates[prayer.type, default: true].toggle()
                            }
                        }
                    }

                    if let banner = vm.lastUpdatedBanner {
                        Text(banner)
                            .font(.footnote)
                            .foregroundStyle(AppPalette.teal)
                            .padding(.top, 4)
                    }
                }
                .padding()
            }
            .refreshable {
                await vm.refresh()
            }
        }
        .task {
            await vm.refresh()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "mappin.circle.fill").foregroundStyle(AppPalette.gold)
                Text("\(vm.selectedCity.englishName) / \(vm.selectedCity.arabicName)")
                    .foregroundStyle(AppPalette.warmWhite)
                Spacer()
            }
            .font(.headline)

            if let day = vm.dayPrayers {
                Text(DateFormatter.gregorianLong.string(from: day.gregorianDate))
                    .foregroundStyle(AppPalette.warmWhite.opacity(0.9))
                Text("\(day.hijriDate) \(day.hijriMonthEnglish) \(day.hijriYear)")
                    .foregroundStyle(AppPalette.teal)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .multilineTextAlignment(.trailing)
            }
        }
        .padding()
        .background(.ultraThinMaterial.opacity(0.2), in: RoundedRectangle(cornerRadius: 16))
    }
}
