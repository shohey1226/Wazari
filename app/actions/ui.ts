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
export const ADD_TILE = "ADD_TILE";
export const REMOVE_TILE = "REMOVE_TILE";
export const SELECT_TILE = "SELECT_TILE";
export const UPDATE_TILE_BLUEPRINT = "UPDATE_TILE_BLUEPRINT";

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
  return {
    type: ADD_NEW_TAB,
    url: url
  };
}

export function closeTab(index: number) {
  return {
    type: CLOSE_TAB,
    index: index
  };
}

export function selectTab(index) {
  return {
    type: SELECT_TAB,
    index: index
  };
}

export function updateSite(
  index: number,
  title: string,
  url: string,
  canGoBack: boolean,
  canGoForward: boolean
) {
  return {
    type: UPDATE_SITE,
    index: index,
    title: title,
    url: url,
    canGoBack: canGoBack,
    canGoForward: canGoForward
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

export function addTile(paneId: number) {
  return {
    type: ADD_TILE,
    paneId: paneId
  };
}

export function removeTile(paneId: number) {
  return {
    type: REMOVE_TILE,
    paneId: paneId
  };
}

export function selectTile(paneId: number) {
  return {
    type: SELECT_TILE,
    paneId: paneId
  };
}

export function updateTileBlueprint(blueprint: Object) {
  return {
    type: UPDATE_TILE_BLUEPRINT,
    blueprint: blueprint
  };
}

