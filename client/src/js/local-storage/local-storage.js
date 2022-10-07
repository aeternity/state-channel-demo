/**
 * @typedef { import("../../types").StoredState } StoredState
 */

export function resetApp() {
  window.location.search = '';
  localStorage.removeItem('gameState');
  window.location.reload();
}

/**
 * @returns {StoredState}
 */
export function getSavedState() {
  try {
    const state = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (Object.keys(state).length === 0) return null;
    if (!state.keypair || state.contractCreationChannelRound == null) {
      throw new Error('Corrupted localstorage.');
    }
    return state;
  } catch (e) {
    localStorage.removeItem('gameState');
    alert('Corrupted localStorage. App will reset.');
    resetApp();
  }
}

/**
 * @param {StoredState} state
 */
export function storeGameState(state) {
  try {
    localStorage.setItem('gameState', JSON.stringify(state));
  } catch (e) {
    console.info('Error saving state to local storage', e);
  }
}
