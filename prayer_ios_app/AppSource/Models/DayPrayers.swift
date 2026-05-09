import Foundation

struct DayPrayers: Identifiable, Codable, Hashable {
    let id: String
    let city: String
    let weekday: String
    let gregorianDate: Date
    let hijriDate: String
    let hijriMonthEnglish: String
    let hijriYear: String
    let prayers: [PrayerTime]
    let fetchedAt: Date

    init(
        city: String,
        weekday: String,
        gregorianDate: Date,
        hijriDate: String,
        hijriMonthEnglish: String,
        hijriYear: String,
        prayers: [PrayerTime],
        fetchedAt: Date = Date()
    ) {
        self.id = "\(city)-\(Int(gregorianDate.timeIntervalSince1970))"
        self.city = city
        self.weekday = weekday
        self.gregorianDate = gregorianDate
        self.hijriDate = hijriDate
        self.hijriMonthEnglish = hijriMonthEnglish
        self.hijriYear = hijriYear
        self.prayers = prayers.sorted { $0.time < $1.time }
        self.fetchedAt = fetchedAt
    }
}

extension DayPrayers {
    var prayerOnly: [PrayerTime] {
        prayers.filter { $0.type.isPrayer }
    }
}
