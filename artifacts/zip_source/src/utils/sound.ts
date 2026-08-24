import { audioController, SuccessSoundType } from './audioController';

// Sound utility wrapper backed by the hidden Web Audio controller
class SoundFx {
  playValid(type?: SuccessSoundType) {
    audioController.playSuccess(type);
  }

  playSuccess(type?: SuccessSoundType) {
    audioController.playSuccess(type);
  }

  playBell() {
    audioController.playCrispBell();
  }

  playChaChing() {
    audioController.playCrispChaChing();
  }

  playDenied() {
    audioController.playDenied();
  }

  playBuzzer() {
    audioController.playCrispBuzzer();
  }

  playFanfare() {
    audioController.playFanfare();
  }

  setMuted(muted: boolean) {
    audioController.setMuted(muted);
  }

  isMuted(): boolean {
    return audioController.getIsMuted();
  }

  setSuccessSoundPreference(type: SuccessSoundType) {
    audioController.setSuccessSoundPreference(type);
  }
}

export const sounds = new SoundFx();
export { audioController };
