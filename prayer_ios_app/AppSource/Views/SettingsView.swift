import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var vm: PrayerTimesViewModel
    @AppStorage("selectedCity") private var selectedCity = "Beirut"
    @AppStorage("calculationMethod") private var calculationMethod = 8
    @AppStorage("appLanguage") private var appLanguage = AppLanguage.arabic.rawValue
    @AppStorage("appTheme") private var appTheme = AppTheme.dark.rawValue

    @AppStorage("notification_fajr") private var notifFajr = true
    @AppStorage("notification_dhuhr") private var notifDhuhr = true
    @AppStorage("notification_asr") private var notifAsr = true
    @AppStorage("notification_maghrib") private var notifMaghrib = true
    @AppStorage("notification_isha") private var notifIsha = true
    @AppStorage("adhanEnabled_fajr") private var adhanFajr = true
    @AppStorage("adhanEnabled_dhuhr") private var adhanDhuhr = true
    @AppStorage("adhanEnabled_asr") private var adhanAsr = true
    @AppStorage("adhanEnabled_maghrib") private var adhanMaghrib = true
    @AppStorage("adhanEnabled_isha") private var adhanIsha = true
    @AppStorage("adhanStyle") private var adhanStyleRaw = AdhanStyle.makkah.rawValue

    var body: some View {
        NavigationStack {
            Form {
                Section("City") {
                    Picker("Lebanese City", selection: $selectedCity) {
                        ForEach(LebaneseCities.all) { city in
                            Text("\(city.englishName) / \(city.arabicName)").tag(city.englishName)
                        }
                    }
                }

                Section("Calculation Method") {
                    Picker("Method", selection: $calculationMethod) {
                        Text("Method 8 - Gulf Region").tag(8)
                        Text("Method 3 - Muslim World League").tag(3)
                    }
                }

                Section("Offsets (minutes)") {
                    Stepper("Fajr: \(vm.offsetFajr)", value: $vm.offsetFajr, in: -30...30)
                    Stepper("Dhuhr: \(vm.offsetDhuhr)", value: $vm.offsetDhuhr, in: -30...30)
                    Stepper("Asr: \(vm.offsetAsr)", value: $vm.offsetAsr, in: -30...30)
                    Stepper("Maghrib: \(vm.offsetMaghrib)", value: $vm.offsetMaghrib, in: -30...30)
                    Stepper("Isha: \(vm.offsetIsha)", value: $vm.offsetIsha, in: -30...30)
                }

                Section("Language & Theme") {
                    Picker("Language", selection: $appLanguage) {
                        Text("Arabic").tag(AppLanguage.arabic.rawValue)
                        Text("English").tag(AppLanguage.english.rawValue)
                    }

                    Picker("Theme", selection: $appTheme) {
                        Text("Dark").tag(AppTheme.dark.rawValue)
                        Text("Light").tag(AppTheme.light.rawValue)
                    }
                }

                Section("Adhan") {
                    Toggle("Notify Fajr", isOn: $notifFajr)
                    Toggle("Notify Dhuhr", isOn: $notifDhuhr)
                    Toggle("Notify Asr", isOn: $notifAsr)
                    Toggle("Notify Maghrib", isOn: $notifMaghrib)
                    Toggle("Notify Isha", isOn: $notifIsha)
                    Toggle("Fajr Adhan", isOn: $adhanFajr)
                    Toggle("Dhuhr Adhan", isOn: $adhanDhuhr)
                    Toggle("Asr Adhan", isOn: $adhanAsr)
                    Toggle("Maghrib Adhan", isOn: $adhanMaghrib)
                    Toggle("Isha Adhan", isOn: $adhanIsha)
                    Picker("Style", selection: $adhanStyleRaw) {
                        ForEach(AdhanStyle.allCases) { style in
                            Text(style.title).tag(style.rawValue)
                        }
                    }
                }

                Section {
                    Text("Version 1.0.0")
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                Button("Apply") {
                    Task { await vm.refresh() }
                }
            }
        }
    }
}
