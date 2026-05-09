import Foundation

@MainActor
final class CalendarViewModel: ObservableObject {
    @Published var days: [DayPrayers] = []
    @Published var isLoading = false
    @Published var selectedMonth: Int
    @Published var selectedYear: Int
    @Published var errorMessage: String?

    private let apiService = PrayerAPIService()

    init() {
        let now = Date()
        let calendar = Calendar(identifier: .gregorian)
        self.selectedMonth = calendar.component(.month, from: now)
        self.selectedYear = calendar.component(.year, from: now)
    }

    func bootstrap(city: String, method: Int) async {
        await fetch(city: city, method: method)
    }

    func fetch(city: String, method: Int) async {
        isLoading = true
        defer { isLoading = false }
        do {
            days = try await apiService.fetchPrayerCalendar(
                city: city,
                method: method,
                month: selectedMonth,
                year: selectedYear
            )
            errorMessage = nil
        } catch {
            errorMessage = "Failed to load calendar."
        }
    }
}
