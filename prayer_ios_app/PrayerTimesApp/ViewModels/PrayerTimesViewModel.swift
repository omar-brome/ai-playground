import Foundation
import Combine
import SwiftUI

@MainActor
final class PrayerTimesViewModel: ObservableObject {
    @Published var dayPrayers: DayPrayers?
    @Published var nextPrayer: PrayerTime?
    @Published var countdownTextArabic = "--"
    @Published var countdownTextEnglish = "--"
    @Published var progress: Double = 0
    @Published var errorMessage: String?
    @Published var lastUpdatedBanner: String?

    @AppStorage("selectedCity") private var selectedCityName: String = "Beirut"
    @AppStorage("calculationMethod") private var methodValue: Int = 8
    @AppStorage("appLanguage") private var languageRawValue: String = AppLanguage.arabic.rawValue
    @AppStorage("appTheme") private var themeRawValue: String = AppTheme.dark.rawValue
    @AppStorage("offset_fajr") var offsetFajr: Int = 0
    @AppStorage("offset_dhuhr") var offsetDhuhr: Int = 0
    @AppStorage("offset_asr") var offsetAsr: Int = 0
    @AppStorage("offset_maghrib") var offsetMaghrib: Int = 0
    @AppStorage("offset_isha") var offsetIsha: Int = 0
    @AppStorage("notification_fajr") var notifFajr = true
    @AppStorage("notification_dhuhr") var notifDhuhr = true
    @AppStorage("notification_asr") var notifAsr = true
    @AppStorage("notification_maghrib") var notifMaghrib = true
    @AppStorage("notification_isha") var notifIsha = true
    @AppStorage("adhanEnabled_fajr") var adhanFajr = true
    @AppStorage("adhanEnabled_dhuhr") var adhanDhuhr = true
    @AppStorage("adhanEnabled_asr") var adhanAsr = true
    @AppStorage("adhanEnabled_maghrib") var adhanMaghrib = true
    @AppStorage("adhanEnabled_isha") var adhanIsha = true
    @AppStorage("adhanStyle") private var adhanStyleRaw = AdhanStyle.makkah.rawValue

    private let apiService = PrayerAPIService()
    private let notificationService = NotificationService()
    private var cancellables = Set<AnyCancellable>()

    var selectedCity: LebaneseCity {
        LebaneseCities.all.first(where: { $0.englishName == selectedCityName }) ?? LebaneseCities.all[0]
    }

    var calculationMethod: CalculationMethod {
        CalculationMethod(rawValue: methodValue) ?? .gulfRegion
    }

    var language: AppLanguage {
        get { AppLanguage(rawValue: languageRawValue) ?? .arabic }
        set { languageRawValue = newValue.rawValue }
    }

    var theme: AppTheme {
        get { AppTheme(rawValue: themeRawValue) ?? .dark }
        set { themeRawValue = newValue.rawValue }
    }

    let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init() {
        ticker
            .sink { [weak self] _ in
                self?.refreshDerivedState()
            }
            .store(in: &cancellables)
    }

    func bootstrap() async {
        await requestNotificationPermission()
        await refresh()
    }

    func refresh() async {
        do {
            let live = try await apiService.fetchPrayerTimes(
                city: selectedCity.englishName,
                method: calculationMethod.rawValue
            )
            dayPrayers = applyOffsets(to: live)
            lastUpdatedBanner = nil
            refreshDerivedState()
            await notificationService.scheduleDaily(
                dayPrayers: dayPrayers?.prayerOnly ?? [],
                preferences: notificationPreferences
            )
        } catch {
            if let cached = apiService.loadCachedDayPrayers() {
                dayPrayers = applyOffsets(to: cached)
                lastUpdatedBanner = "Last updated: \(DateFormatter.cacheDate.string(from: cached.fetchedAt))"
                refreshDerivedState()
            } else {
                errorMessage = "Unable to load prayer times."
            }
        }
    }

    func updateCity(_ city: LebaneseCity) async {
        selectedCityName = city.englishName
        await refresh()
    }

    func updateMethod(_ method: CalculationMethod) async {
        methodValue = method.rawValue
        await refresh()
    }

    func refreshDerivedState(now: Date = Date()) {
        guard let dayPrayers else { return }
        let prayers = dayPrayers.prayerOnly.sorted { $0.time < $1.time }
        nextPrayer = prayers.first(where: { $0.time > now }) ?? prayers.first

        if let next = nextPrayer {
            let diff = Int(next.time.timeIntervalSince(now))
            let hours = max(0, diff / 3600)
            let minutes = max(0, (diff % 3600) / 60)
            countdownTextEnglish = "in \(hours)h \(minutes)m"
            countdownTextArabic = "في \(hours.arabicNumeral) ساعة و\(minutes.arabicNumeral) دقيقة"
        }

        if let previous = prayers.last(where: { $0.time <= now }), let next = nextPrayer {
            let interval = next.time.timeIntervalSince(previous.time)
            let elapsed = now.timeIntervalSince(previous.time)
            progress = interval > 0 ? min(max(elapsed / interval, 0), 1) : 0
        }
    }

    func timeString(for date: Date) -> String {
        DateFormatter.prayerClock.string(from: date)
    }

    private func requestNotificationPermission() async {
        await notificationService.requestAuthorization()
    }

    private var notificationPreferences: NotificationPreferences {
        NotificationPreferences(
            enabled: [
                .fajr: notifFajr,
                .dhuhr: notifDhuhr,
                .asr: notifAsr,
                .maghrib: notifMaghrib,
                .isha: notifIsha
            ],
            adhanEnabled: [
                .fajr: adhanFajr,
                .dhuhr: adhanDhuhr,
                .asr: adhanAsr,
                .maghrib: adhanMaghrib,
                .isha: adhanIsha
            ],
            adhanStyle: AdhanStyle(rawValue: adhanStyleRaw) ?? .makkah
        )
    }

    private func applyOffsets(to day: DayPrayers) -> DayPrayers {
        let shifted = day.prayers.map { prayer -> PrayerTime in
            let offsetMinutes: Int
            switch prayer.type {
            case .fajr: offsetMinutes = offsetFajr
            case .dhuhr: offsetMinutes = offsetDhuhr
            case .asr: offsetMinutes = offsetAsr
            case .maghrib: offsetMinutes = offsetMaghrib
            case .isha: offsetMinutes = offsetIsha
            case .sunrise: offsetMinutes = 0
            }
            return PrayerTime(
                id: prayer.type,
                type: prayer.type,
                time: prayer.time.addingTimeInterval(Double(offsetMinutes * 60))
            )
        }
        return DayPrayers(
            city: day.city,
            weekday: day.weekday,
            gregorianDate: day.gregorianDate,
            hijriDate: day.hijriDate,
            hijriMonthEnglish: day.hijriMonthEnglish,
            hijriYear: day.hijriYear,
            prayers: shifted,
            fetchedAt: day.fetchedAt
        )
    }
}
