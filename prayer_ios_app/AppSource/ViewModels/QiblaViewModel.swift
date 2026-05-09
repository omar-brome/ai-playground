import Foundation
import CoreLocation
import Combine

@MainActor
final class QiblaViewModel: NSObject, ObservableObject {
    @Published var heading: Double = 0
    @Published var qiblaBearing: Double = 172
    @Published var calibrationMessage = "Point your phone flat and rotate slowly."
    @Published var permissionDenied = false

    private let manager = CLLocationManager()
    private var currentCoordinate: CLLocationCoordinate2D?

    override init() {
        super.init()
        manager.delegate = self
        manager.headingFilter = 1
    }

    func start() {
        if ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] != nil {
            qiblaBearing = 172
            heading = 0
            calibrationMessage = "Simulator mode: fixed 172° for Beirut."
            return
        }
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
        manager.startUpdatingHeading()
    }

    private func computeQibla(from coordinate: CLLocationCoordinate2D) {
        let lat1 = coordinate.latitude * .pi / 180
        let lon1 = coordinate.longitude * .pi / 180
        let lat2 = 21.3891 * .pi / 180
        let lon2 = 39.8579 * .pi / 180
        let dLon = lon2 - lon1
        let x = sin(dLon) * cos(lat2)
        let y = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        var angle = atan2(x, y) * 180 / .pi
        if angle < 0 { angle += 360 }
        qiblaBearing = angle
    }
}

extension QiblaViewModel: CLLocationManagerDelegate {
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            let status = manager.authorizationStatus
            permissionDenied = status == .denied || status == .restricted
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task { @MainActor in
            currentCoordinate = location.coordinate
            computeQibla(from: location.coordinate)
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        Task { @MainActor in
            heading = newHeading.magneticHeading
            calibrationMessage = newHeading.headingAccuracy < 0 ? "Calibration needed." : "Point your phone flat and rotate slowly."
        }
    }
}
