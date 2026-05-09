import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var prayerVM: PrayerTimesViewModel
    @EnvironmentObject var vm: CalendarViewModel

    var body: some View {
        ZStack {
            IslamicPatternBackground()
            VStack {
                monthPicker
                if vm.isLoading {
                    ProgressView().tint(AppPalette.gold)
                } else {
                    List(vm.days) { day in
                        VStack(alignment: .leading, spacing: 6) {
                            Text("\(DateFormatter.gregorianLong.string(from: day.gregorianDate))")
                                .font(.subheadline.bold())
                            Text("\(day.hijriDate) \(day.hijriMonthEnglish) \(day.hijriYear)")
                                .font(.caption)
                                .foregroundStyle(AppPalette.teal)
                            HStack {
                                ForEach(day.prayerOnly) { prayer in
                                    VStack {
                                        Text(prayer.type.englishName).font(.caption2)
                                        Text(DateFormatter.prayerClock.string(from: prayer.time)).font(.caption2)
                                    }
                                }
                            }
                        }
                        .listRowBackground(Color.clear)
                    }
                    .scrollContentBackground(.hidden)
                    .refreshable {
                        await vm.fetch(city: prayerVM.selectedCity.englishName, method: prayerVM.calculationMethod.rawValue)
                    }
                }
            }
            .padding(.top)
        }
        .task {
            await vm.fetch(city: prayerVM.selectedCity.englishName, method: prayerVM.calculationMethod.rawValue)
        }
    }

    private var monthPicker: some View {
        HStack {
            Picker("Month", selection: $vm.selectedMonth) {
                ForEach(1...12, id: \.self) { month in
                    Text("\(month)").tag(month)
                }
            }
            Picker("Year", selection: $vm.selectedYear) {
                ForEach(2024...2030, id: \.self) { year in
                    Text("\(year)").tag(year)
                }
            }
            Button("Load") {
                Task {
                    await vm.fetch(city: prayerVM.selectedCity.englishName, method: prayerVM.calculationMethod.rawValue)
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(AppPalette.gold)
        }
        .padding(.horizontal)
    }
}
