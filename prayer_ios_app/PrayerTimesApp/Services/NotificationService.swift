import Foundation
import UserNotifications

actor NotificationService {
    private let center = UNUserNotificationCenter.current()

    func requestAuthorization() async {
        _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    func scheduleDaily(dayPrayers: [PrayerTime], preferences: NotificationPreferences) async {
        center.removeAllPendingNotificationRequests()

        for prayer in dayPrayers {
            guard preferences.enabled[prayer.type, default: true] else { continue }
            let components = Calendar.current.dateComponents([.hour, .minute], from: prayer.time)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
            let content = UNMutableNotificationContent()
            content.title = "وقت \(prayer.type.arabicName)"
            content.body = "حان وقت صلاة \(prayer.type.arabicName) - \(DateFormatter.prayerClock.string(from: prayer.time))"
            if preferences.adhanEnabled[prayer.type, default: false] {
                content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: "\(preferences.adhanStyle.fileName).mp3"))
            } else {
                content.sound = .default
            }
            let request = UNNotificationRequest(identifier: "prayer-\(prayer.type.rawValue)", content: content, trigger: trigger)
            try? await center.add(request)
        }
    }
}
