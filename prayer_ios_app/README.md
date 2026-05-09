# أوقات الصلاة — Awqat Al-Salah (Lebanon)

Native **Swift / SwiftUI** prayer times app for Lebanon: daily times from the free [AlAdhan API](https://aladhan.com/prayer-times-api), Qibla compass, monthly calendar, local notifications, and Lebanese city presets — **no API keys required**.

**Requirements:** Xcode 15+, iOS 17+, Swift 5.9+

## Features

- **Home** — Next prayer hero card with countdown, five prayer rows + sunrise, Arabic/English labels, dark theme with gold/teal accents
- **Qibla** — Compass-style UI with bearing to Kaaba; simulator uses a fixed fallback bearing
- **Calendar** — Monthly prayer times via `calendarByCity`
- **Settings** — Lebanese cities, calculation method (Gulf / MWL), per-prayer offsets, notifications, adhan toggles & style, language, light/dark theme (`@AppStorage`)
- **Offline** — Caches the latest daily response in `UserDefaults` when the network fails

## Tech stack

SwiftUI, URLSession (async/await), UserNotifications, CoreLocation, AVFoundation — **no third-party packages**.

## Repository layout

```
prayer_ios_app/
├── PrayerTimesApp.xcodeproj    # Open this in Xcode
├── AppSource/                  # Main app source (add to target as groups)
│   ├── PrayerTimesApp.swift   # @main entry
│   ├── Info.plist
│   ├── Models/
│   ├── Services/
│   ├── ViewModels/
│   ├── Views/
│   └── Resources/             # README for adhan filenames; add .mp3 to target
├── XCODEPROJ_SETUP.md         # Xcode project wiring notes
└── README.md                  # This file
```

Template files under `AppSource/PrayerTimesApp/PrayerTimesApp/` (`ContentView`, etc.) exist for Xcode scaffolding; the live app entry is `AppSource/PrayerTimesApp.swift`.

## Setup (GitHub clone → run)

1. Open `PrayerTimesApp.xcodeproj` in Xcode.
2. Select the **PrayerTimesApp** scheme and an **iPhone** simulator (or device).
3. **Signing:** Target → Signing & Capabilities → choose your **Team** for device runs.
4. **Info.plist:** Target → Build Settings → set **Info.plist File** to `AppSource/Info.plist`, **Generate Info.plist File** = No (if you use the bundled plist).
5. Ensure `Info.plist` is **not** in **Copy Bundle Resources** (only processed via Build Settings).
6. Add adhan audio to the target (optional for notifications): `adhan_makkah.mp3`, `adhan_madinah.mp3`, `adhan_egypt.mp3` in `AppSource/Resources/` — see `AppSource/Resources/README.md`.

Build (**⌘B**) then Run (**⌘R**).

Detailed Xcode steps: [`XCODEPROJ_SETUP.md`](./XCODEPROJ_SETUP.md).

## API

- Daily: `GET https://api.aladhan.com/v1/timingsByCity?city=...&country=Lebanon&method=8|3`
- Monthly: `GET https://api.aladhan.com/v1/calendarByCity?...`

Times are interpreted in **`Asia/Beirut`**.

## Next steps (ideas)

1. **WidgetKit** — Small/medium widgets sharing today’s next prayer & times (App Group + timeline).
2. **App icon & launch screen** — Full-bleed launch storyboard matching the gold/dark brand.
3. **Live Activity** — Optional lock-screen countdown to next prayer (iOS 16+).
4. **Settings UX** — Auto-apply on change instead of manual “Apply” if you add that pattern back.
5. **Tests** — Unit tests for API parsing, next-prayer math, and notification scheduling.
6. **Privacy** — Short `PrivacyInfo.xcprivacy` if you ship to App Store and use required APIs.

## License

Specify in this repo’s root `LICENSE` if you publish publicly; prayer times data is subject to [AlAdhan](https://aladhan.com/) terms of use.
