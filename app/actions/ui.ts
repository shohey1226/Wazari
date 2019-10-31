import { KeyMode } from "../types/index.d";

export const ADD_NEW_TAB = "ADD_NEW_TAB";
export const SELECT_TAB = "SELECT_TAB";
export const UPDATE_SITE = "UPDATE_SITE";
export const CLOSE_TAB = "CLOSE_TAB";
export const TOGGLE_FORWARD = "TOGGLE_FORWARD";
export const TOGGLE_BACK = "TOGGLE_BACK";
export const TOGGLE_RELOAD = "TOGGLE_RELOAD";
export const UPDATE_BACK_FORWARD = "UPDATE_BACK_FORWARD";
export const UPDATE_MODE = "UPDATE_MODE";
export const UPDATE_ORIENTATION = "UPDATE_ORIENTATION";
export const UPDATE_FOUCUSED_PANE = "UPDATE_FOUCUSED_PANE";
export const UPDATE_KEY_SWITCH = "UPDATE_KEY_SWITCH";
export const ADD_PANE = "ADD_PANE";
export const REMOVE_PANE = "REMOVE_PANE";
export const SELECT_PANE = "SELECT_PANE";
export const UPDATE_PANE_BLUEPRINT = "UPDATE_PANE_BLUEPRINT";
export const UPDATE_WORDS_FOR_PAGE_FIND = "UPDATE_WORDS_FOR_PAGE_FIND";

export function updateWordsForPageFind(words: string) {
  return {
    type: UPDATE_WORDS_FOR_PAGE_FIND,
    words: words
  };
}

export function toggleForward() {
  return {
    type: TOGGLE_FORWARD
  };
}

export function toggleBack() {
  return {
    type: TOGGLE_BACK
  };
}

export function toggleReload() {
  return {
    type: TOGGLE_RELOAD
  };
}

export function addNewTab(url) {
  return (dispatch, getState) => {
    const activePaneId = getState().ui.get("activePaneId");
    dispatch(_addNewTab(url, activePaneId));
  };
}

function _addNewTab(url: string, paneId: number) {
  return {
    type: ADD_NEW_TAB,
    url: url,
    paneId: paneId
  };
}

export function closeTab(index: number, paneId: number) {
  return {
    type: CLOSE_TAB,
    index: index,
    paneId: paneId
  };
}

export function selectTab(index) {
  return (dispatch, getState) => {
    const activePaneId = getState().ui.get("activePaneId");
    const { mode, keySwitchOn } = _getModeAndSwitch(
      activePaneId,
      index,
      getState()
    );
    dispatch(_selectTab(index, activePaneId, mode, keySwitchOn));
  };
}

function _selectTab(
  index,
  paneId: number,
  mode: KeyMode,
  keySwitchOn: boolean
) {
  return {
    type: SELECT_TAB,
    index: index,
    paneId: paneId,
    mode: mode,
    keySwitchOn: keySwitchOn
  };
}

function _getModeAndSwitch(
  activePaneId,
  index,
  state
): { mode: KeyMode; keySwitchOn: boolean } {
  const excludedPatterns = state.user.get("excludedPatterns").toArray();
  const url = state.ui
    .getIn(["panes", activePaneId, "sites"])
    .getIn([index, "url"]);
  const keySwitchOn = _isSwitchOn(url, excludedPatterns);
  let mode = KeyMode.Text;
  if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(url)) {
    mode = KeyMode.Terminal;
  } else if (!keySwitchOn) {
    mode = KeyMode.Browser;
  }
  return { mode: mode, keySwitchOn: keySwitchOn };
}

function _isSwitchOn(url: string, excludedPatterns: Array<string>): boolean {
  // wazaterm -
  if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(url)) {
    return true;
  }
  let switchOn = true;
  let pattern: string | null = null;
  for (let p of excludedPatterns) {
    let regex = new RegExp(p);
    if (regex.test(url)) {
      switchOn = false;
      pattern = p;
      break;
    }
  }
  return switchOn;
}

export function updateModeAndSwitch() {
  return (dispatch, getState) => {
    const activePaneId = getState().ui.get("activePaneId");
    const activeTabIndex = getState().ui.getIn([
      "panes",
      activePaneId,
      "activeTabIndex"
    ]);
    const { mode, keySwitchOn } = _getModeAndSwitch(
      activePaneId,
      activeTabIndex,
      getState()
    );
    dispatch(updateMode(mode));
    dispatch(updateKeySwitch(keySwitchOn));
  };
}

export function updateSite(
  index: number,
  title: string,
  url: string,
  canGoBack: boolean,
  canGoForward: boolean,
  paneId: number
) {
  return (dispatch, getState) => {
    const activePaneId = getState().ui.get("activePaneId");
    const { mode, keySwitchOn } = _getModeAndSwitch(
      activePaneId,
      index,
      getState()
    );
    dispatch(
      _updateSite(
        index,
        title,
        url,
        canGoBack,
        canGoForward,
        paneId,
        mode,
        keySwitchOn
      )
    );
  };
}

function _updateSite(
  index: number,
  title: string,
  url: string,
  canGoBack: boolean,
  canGoForward: boolean,
  paneId: number,
  mode: KeyMode,
  keySwitchOn: boolean
) {
  return {
    type: UPDATE_SITE,
    index: index,
    title: title,
    url: url,
    canGoBack: canGoBack,
    canGoForward: canGoForward,
    paneId: paneId,
    mode: mode,
    keySwitchOn: keySwitchOn
  };
}

export function updateMode(mode: KeyMode) {
  return {
    type: UPDATE_MODE,
    mode: mode
  };
}

export function updateKeySwitch(switchState: boolean) {
  return {
    type: UPDATE_KEY_SWITCH,
    switchState: switchState
  };
}

export function updateOrientation(orientation: string) {
  return {
    type: UPDATE_ORIENTATION,
    orientation: orientation
  };
}

export function updateFocusedPane(pane: string) {
  return {
    type: UPDATE_FOUCUSED_PANE,
    pane: pane
  };
}

export function addPane(paneId: number) {
  return (dispatch, getState) => {
    if (isValidPanes(getState().ui)) {
      dispatch(_addPane(paneId));
    } else {
      console.log("pane state is not valid");
    }
  };
}

function _addPane(paneId: number) {
  return {
    type: ADD_PANE,
    paneId: paneId
  };
}

export function removePane(paneId: number) {
  return (dispatch, getState) => {
    if (isValidPanes(getState().ui)) {
      dispatch(_removePane(paneId));
    } else {
      console.log("pane state is not valid");
    }
  };
}

function _removePane(paneId: number) {
  return {
    type: REMOVE_PANE,
    paneId: paneId
  };
}

export function selectPane(paneId: number) {
  return (dispatch, getState) => {
    if (isValidPanes(getState().ui)) {
      const index = getState().ui.getIn(["panes", paneId, "activeTabIndex"]);
      const { mode, keySwitchOn } = _getModeAndSwitch(
        paneId,
        index,
        getState()
      );
      dispatch(_selectPane(paneId, mode, keySwitchOn));
    } else {
      console.log("pane state is not valid");
    }
  };
}

function _selectPane(paneId: number, mode, keySwitchOn) {
  return {
    type: SELECT_PANE,
    paneId: paneId,
    mode: mode,
    keySwitchOn: keySwitchOn
  };
}

export function updatePaneBlueprint(blueprint: Object) {
  return {
    type: UPDATE_PANE_BLUEPRINT,
    blueprint: blueprint
  };
}

function isValidPanes(uiState): boolean {
  const paneIds = uiState.get("paneIds").toArray();
  const panes = uiState.get("panes").toJS();
  const activePaneId = uiState.get("activePaneId");

  if (activePaneId === null) {
    return true;
  }

  if (paneIds.indexOf(activePaneId) === -1) {
    return false;
  }

  paneIds.forEach(paneId => {
    if (!(paneId in panes)) {
      return false;
    }
  });

  return true;
}
