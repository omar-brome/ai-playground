import Foundation

enum PrayerType: String, Codable, CaseIterable, Identifiable {
    case fajr
    case sunrise
    case dhuhr
    case asr
    case maghrib
    case isha

    var id: String { rawValue }

    var englishName: String {
        switch self {
        case .fajr: return "Fajr"
        case .sunrise: return "Sunrise"
        case .dhuhr: return "Dhuhr"
        case .asr: return "Asr"
        case .maghrib: return "Maghrib"
        case .isha: return "Isha"
        }
    }

    var arabicName: String {
        switch self {
        case .fajr: return "فجر"
        case .sunrise: return "الشروق"
        case .dhuhr: return "ظهر"
        case .asr: return "عصر"
        case .maghrib: return "مغرب"
        case .isha: return "عشاء"
        }
    }

    var icon: String {
        switch self {
        case .fajr: return "moon.stars.fill"
        case .sunrise: return "sunrise.fill"
        case .dhuhr: return "sun.max.fill"
        case .asr: return "sun.haze.fill"
        case .maghrib: return "sunset.fill"
        case .isha: return "moon.fill"
        }
    }

    var isPrayer: Bool { self != .sunrise }
}

struct PrayerTime: Identifiable, Codable, Hashable {
    let id: PrayerType
    let type: PrayerType
    let time: Date
}

enum CalculationMethod: Int, CaseIterable, Identifiable {
    case gulfRegion = 8
    case muslimWorldLeague = 3

    var id: Int { rawValue }
    var label: String {
        switch self {
        case .gulfRegion: return "Method 8 - Gulf Region"
        case .muslimWorldLeague: return "Method 3 - Muslim World League"
        }
    }
}

enum AppLanguage: String, CaseIterable, Identifiable {
    case arabic
    case english
    var id: String { rawValue }
}

enum AppTheme: String, CaseIterable, Identifiable {
    case dark
    case light
    var id: String { rawValue }
}

enum AdhanStyle: String, CaseIterable, Identifiable {
    case makkah
    case madinah
    case egyptian

    var id: String { rawValue }
    var title: String {
        switch self {
        case .makkah: return "Makkah Adhan"
        case .madinah: return "Madinah Adhan"
        case .egyptian: return "Egyptian Adhan"
        }
    }

    var fileName: String {
        switch self {
        case .makkah: return "adhan_makkah"
        case .madinah: return "adhan_madinah"
        case .egyptian: return "adhan_egypt"
        }
    }
}

struct NotificationPreferences {
    let enabled: [PrayerType: Bool]
    let adhanEnabled: [PrayerType: Bool]
    let adhanStyle: AdhanStyle
}
