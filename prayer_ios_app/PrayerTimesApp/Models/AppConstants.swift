import Foundation
import SwiftUI

enum AppConstants {
    static let beirutTimeZone = TimeZone(identifier: "Asia/Beirut") ?? .current
}

enum AppPalette {
    static let midnight = Color(red: 13.0 / 255.0, green: 17.0 / 255.0, blue: 23.0 / 255.0)
    static let gold = Color(red: 201.0 / 255.0, green: 162.0 / 255.0, blue: 39.0 / 255.0)
    static let teal = Color(red: 78.0 / 255.0, green: 205.0 / 255.0, blue: 196.0 / 255.0)
    static let warmWhite = Color(red: 245.0 / 255.0, green: 240.0 / 255.0, blue: 232.0 / 255.0)
}

extension DateFormatter {
    static let gregorianLong: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = AppConstants.beirutTimeZone
        formatter.dateStyle = .full
        formatter.timeStyle = .none
        return formatter
    }()

    static let prayerClock: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = AppConstants.beirutTimeZone
        formatter.dateFormat = "h:mm a"
        return formatter
    }()

    static let cacheDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = AppConstants.beirutTimeZone
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }()
}

extension Int {
    var arabicNumeral: String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "ar")
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: self)) ?? "\(self)"
    }
}
