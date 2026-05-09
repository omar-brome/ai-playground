# Minimal `.xcodeproj` Scaffold Workflow

This workflow keeps your current source layout and wires it into a clean iOS 17+ SwiftUI target.

## 1) Create the Xcode project shell

1. Open Xcode 15+.
2. File -> New -> Project -> iOS -> App.
3. Product Name: `PrayerTimesApp`
4. Interface: `SwiftUI`
5. Language: `Swift`
6. Tests: optional (can keep on).
7. Save location: `/Users/omarbrome/Documents/Codes/ai-playground/prayer_ios_app`

Expected output:
- `PrayerTimesApp.xcodeproj`
- A generated `PrayerTimesApp` source folder (temporary files can be replaced by your existing files below)

## 2) Keep this target file layout (already prepared)

Use this exact folder structure as target members:

- `PrayerTimesApp/PrayerTimesApp.swift`
- `PrayerTimesApp/Info.plist`
- `PrayerTimesApp/Models/*`
- `PrayerTimesApp/Services/*`
- `PrayerTimesApp/ViewModels/*`
- `PrayerTimesApp/Views/*`
- `PrayerTimesApp/Resources/*`

## 3) Add existing files into the app target

1. In Project Navigator, right-click root group -> `Add Files to "PrayerTimesApp"...`
2. Select folder: `/Users/omarbrome/Documents/Codes/ai-playground/prayer_ios_app/PrayerTimesApp`
3. Options:
   - `Create groups` (not folder references)
   - `Add to targets`: check `PrayerTimesApp`
4. If Xcode generated placeholder files (e.g. another `ContentView.swift`), delete only those placeholders from target.

## 4) Build settings and capabilities

In target settings:

1. **iOS Deployment Target**: `17.0`
2. **Info.plist File**: point to `PrayerTimesApp/Info.plist`
3. **Signing**: set your Team + unique Bundle ID.
4. **Capabilities**:
   - `Push Notifications` NOT required (local notifications only)
   - `Background Modes` optional for future schedule refresh tuning
5. Confirm in `Info.plist`:
   - `NSLocationWhenInUseUsageDescription`
   - `NSUserNotificationsUsageDescription`
   - Portrait orientation only

## 5) Add adhan assets

Add to target:
- `adhan_makkah.mp3`
- `adhan_madinah.mp3`
- `adhan_egypt.mp3`

Place under `PrayerTimesApp/Resources/` and ensure each file has target membership checked.

## 6) First run checklist

1. Simulator: iPhone 15 Pro
2. Clean build folder (`Shift+Cmd+K`)
3. Build + Run (`Cmd+R`)
4. Verify:
   - Home loads prayer times
   - Settings changes refresh data
   - Calendar loads selected month
   - Qibla runs (simulator fallback shown)
   - Permission intro sheet appears first launch

## 7) Validation commands (optional)

From terminal:

```bash
xcrun swiftc -typecheck "PrayerTimesApp/PrayerTimesApp.swift" "PrayerTimesApp/Models"/*.swift "PrayerTimesApp/Services"/*.swift "PrayerTimesApp/ViewModels"/*.swift "PrayerTimesApp/Views"/*.swift
```

---

## Widget timing recommendation

Create the widget immediately **after**:
1. The main app target builds and runs reliably, and
2. You verify one full daily prayer fetch + cache fallback path.

Practical timing: this is the **next milestone** and can start now. Estimated implementation time for a first usable widget set (small + medium): about **2-4 hours**.
