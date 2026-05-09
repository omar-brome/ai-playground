import Foundation
import CoreLocation

struct LebaneseCity: Identifiable, Codable, Hashable {
    let id: String
    let englishName: String
    let arabicName: String
    let latitude: Double
    let longitude: Double

    init(englishName: String, arabicName: String, latitude: Double, longitude: Double) {
        self.id = englishName
        self.englishName = englishName
        self.arabicName = arabicName
        self.latitude = latitude
        self.longitude = longitude
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

enum LebaneseCities {
    static let all: [LebaneseCity] = [
        LebaneseCity(englishName: "Beirut", arabicName: "بيروت", latitude: 33.8938, longitude: 35.5018),
        LebaneseCity(englishName: "Tripoli", arabicName: "طرابلس", latitude: 34.4335, longitude: 35.8442),
        LebaneseCity(englishName: "Sidon", arabicName: "صيدا", latitude: 33.5571, longitude: 35.3715),
        LebaneseCity(englishName: "Tyre", arabicName: "صور", latitude: 33.2704, longitude: 35.2038),
        LebaneseCity(englishName: "Jounieh", arabicName: "جونيه", latitude: 33.9808, longitude: 35.6178),
        LebaneseCity(englishName: "Zahle", arabicName: "زحلة", latitude: 33.8463, longitude: 35.9020),
        LebaneseCity(englishName: "Baalbek", arabicName: "بعلبك", latitude: 34.0058, longitude: 36.2181),
        LebaneseCity(englishName: "Nabatieh", arabicName: "النبطية", latitude: 33.3789, longitude: 35.4839),
        LebaneseCity(englishName: "Aley", arabicName: "عاليه", latitude: 33.8078, longitude: 35.5997),
        LebaneseCity(englishName: "Byblos", arabicName: "جبيل", latitude: 34.1230, longitude: 35.6519)
    ]
}
