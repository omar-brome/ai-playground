import SwiftUI

struct MainView: View {
    @AppStorage("didShowPermissionIntro") private var didShowPermissionIntro = false
    @State private var showPermissionIntro = false

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
            QiblaView()
                .tabItem { Label("Qibla", systemImage: "location.north.line.fill") }
            CalendarView()
                .tabItem { Label("Calendar", systemImage: "calendar") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(AppPalette.gold)
        .onAppear {
            if !didShowPermissionIntro {
                showPermissionIntro = true
            }
        }
        .sheet(isPresented: $showPermissionIntro, onDismiss: { didShowPermissionIntro = true }) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Welcome to أوقات الصلاة")
                    .font(.title2.bold())
                Text("We request notifications for prayer alerts and location for accurate Qibla direction.")
                    .foregroundStyle(.secondary)
                Button("Continue") {
                    showPermissionIntro = false
                }
                .buttonStyle(.borderedProminent)
                .tint(AppPalette.gold)
            }
            .padding()
            .presentationDetents([.medium])
        }
    }
}
