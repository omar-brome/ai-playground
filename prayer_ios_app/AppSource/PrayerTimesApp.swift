import SwiftUI

@main
struct PrayerTimesApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var prayerVM = PrayerTimesViewModel()
    @StateObject private var calendarVM = CalendarViewModel()
    @StateObject private var qiblaVM = QiblaViewModel()

    var body: some Scene {
        WindowGroup {
            MainView()
                .environmentObject(prayerVM)
                .environmentObject(calendarVM)
                .environmentObject(qiblaVM)
                .preferredColorScheme(prayerVM.theme == .dark ? .dark : .light)
                .task {
                    await prayerVM.bootstrap()
                    await calendarVM.bootstrap(
                        city: prayerVM.selectedCity.englishName,
                        method: prayerVM.calculationMethod.rawValue
                    )
                }
                .onChange(of: scenePhase) { _, newPhase in
                    if newPhase == .active {
                        Task { await prayerVM.refresh() }
                    }
                }
        }
    }
}
