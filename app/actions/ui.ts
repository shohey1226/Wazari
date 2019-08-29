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
    dispatch(_selectTab(index, activePaneId));
  };
}

function _selectTab(index, paneId: number) {
  return {
    type: SELECT_TAB,
    index: index,
    paneId: paneId
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
  return {
    type: UPDATE_SITE,
    index: index,
    title: title,
    url: url,
    canGoBack: canGoBack,
    canGoForward: canGoForward,
    paneId: paneId
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
  return {
    type: ADD_PANE,
    paneId: paneId
  };
}

export function removePane(paneId: number) {
  return {
    type: REMOVE_PANE,
    paneId: paneId
  };
}

export function selectPane(paneId: number) {
  return {
    type: SELECT_PANE,
    paneId: paneId
  };
}

export function updatePaneBlueprint(blueprint: Object) {
  return {
    type: UPDATE_PANE_BLUEPRINT,
    blueprint: blueprint
  };
}
