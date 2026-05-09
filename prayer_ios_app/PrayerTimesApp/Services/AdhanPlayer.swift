import Foundation
import AVFoundation

@MainActor
final class AdhanPlayer: ObservableObject {
    private var player: AVAudioPlayer?

    func play(style: AdhanStyle) {
        guard let url = Bundle.main.url(forResource: style.fileName, withExtension: "mp3") else { return }
        do {
            player = try AVAudioPlayer(contentsOf: url)
            player?.prepareToPlay()
            player?.play()
        } catch {
            print("Adhan audio failed: \(error.localizedDescription)")
        }
    }

    func stop() {
        player?.stop()
    }
}
