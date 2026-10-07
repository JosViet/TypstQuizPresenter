export interface FullscreenRecoveryState {
  presentationMode: boolean;
  standalone: boolean;
  fullscreenWasActive: boolean;
  hasFullscreenElement: boolean;
  visible: boolean;
}

export function shouldOfferFullscreenRecovery(state: FullscreenRecoveryState): boolean {
  return state.presentationMode
    && !state.standalone
    && state.fullscreenWasActive
    && !state.hasFullscreenElement
    && state.visible;
}
