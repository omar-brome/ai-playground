import Foundation

final class PrayerAPIService {
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let cacheKey = "cached_day_prayers"

    func fetchPrayerTimes(city: String, method: Int) async throws -> DayPrayers {
        var components = URLComponents(string: "https://api.aladhan.com/v1/timingsByCity")
        components?.queryItems = [
            .init(name: "city", value: city),
            .init(name: "country", value: "Lebanon"),
            .init(name: "method", value: "\(method)")
        ]

        guard let url = components?.url else { throw URLError(.badURL) }
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try decoder.decode(AlAdhanTimingsResponse.self, from: data)
        let day = try response.data.toDayPrayers(city: city)
        cache(day)
        return day
    }

    func fetchPrayerCalendar(city: String, method: Int, month: Int, year: Int) async throws -> [DayPrayers] {
        var components = URLComponents(string: "https://api.aladhan.com/v1/calendarByCity")
        components?.queryItems = [
            .init(name: "city", value: city),
            .init(name: "country", value: "Lebanon"),
            .init(name: "method", value: "\(method)"),
            .init(name: "month", value: "\(month)"),
            .init(name: "year", value: "\(year)")
        ]

        guard let url = components?.url else { throw URLError(.badURL) }
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try decoder.decode(AlAdhanCalendarResponse.self, from: data)
        return try response.data.map { try $0.toDayPrayers(city: city) }
    }

    func loadCachedDayPrayers() -> DayPrayers? {
        guard let data = UserDefaults.standard.data(forKey: cacheKey) else { return nil }
        return try? decoder.decode(DayPrayers.self, from: data)
    }

    private func cache(_ day: DayPrayers) {
        guard let data = try? encoder.encode(day) else { return }
        UserDefaults.standard.set(data, forKey: cacheKey)
    }
}

private struct AlAdhanCalendarResponse: Decodable {
    let data: [AlAdhanDayData]
}

private struct AlAdhanTimingsResponse: Decodable {
    let data: AlAdhanDayData
}

private struct AlAdhanDayData: Decodable {
    let timings: Timings
    let date: DateBlock

    struct Timings: Decodable {
        let fajr: String
        let sunrise: String
        let dhuhr: String
        let asr: String
        let maghrib: String
        let isha: String

        enum CodingKeys: String, CodingKey {
            case fajr = "Fajr"
            case sunrise = "Sunrise"
            case dhuhr = "Dhuhr"
            case asr = "Asr"
            case maghrib = "Maghrib"
            case isha = "Isha"
        }
    }

    struct DateBlock: Decodable {
        let readable: String
        let gregorian: Gregorian
        let hijri: Hijri

        struct Gregorian: Decodable {
            let weekday: Weekday
            struct Weekday: Decodable { let en: String }
        }

        struct Hijri: Decodable {
            let date: String
            let year: String
            let month: Month
            struct Month: Decodable { let en: String }
        }
    }

    func toDayPrayers(city: String) throws -> DayPrayers {
        let dateFormatter = DateFormatter()
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.timeZone = AppConstants.beirutTimeZone
        dateFormatter.dateFormat = "dd MMM yyyy"

        guard let baseDate = dateFormatter.date(from: date.readable) else {
            throw URLError(.cannotParseResponse)
        }

        let prayers = try [
            PrayerTime(id: .fajr, type: .fajr, time: parseTime(timings.fajr, for: baseDate)),
            PrayerTime(id: .sunrise, type: .sunrise, time: parseTime(timings.sunrise, for: baseDate)),
            PrayerTime(id: .dhuhr, type: .dhuhr, time: parseTime(timings.dhuhr, for: baseDate)),
            PrayerTime(id: .asr, type: .asr, time: parseTime(timings.asr, for: baseDate)),
            PrayerTime(id: .maghrib, type: .maghrib, time: parseTime(timings.maghrib, for: baseDate)),
            PrayerTime(id: .isha, type: .isha, time: parseTime(timings.isha, for: baseDate))
        ]

        return DayPrayers(
            city: city,
            weekday: date.gregorian.weekday.en,
            gregorianDate: baseDate,
            hijriDate: date.hijri.date,
            hijriMonthEnglish: date.hijri.month.en,
            hijriYear: date.hijri.year,
            prayers: prayers
        )
    }

    private func parseTime(_ value: String, for date: Date) throws -> Date {
        let raw = value.components(separatedBy: " ").first ?? value
        let split = raw.split(separator: ":")
        guard split.count == 2, let hour = Int(split[0]), let minute = Int(split[1]) else {
            throw URLError(.cannotParseResponse)
        }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = AppConstants.beirutTimeZone
        var components = calendar.dateComponents([.year, .month, .day], from: date)
        components.hour = hour
        components.minute = minute
        return calendar.date(from: components) ?? date
    }
}
