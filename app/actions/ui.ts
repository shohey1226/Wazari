import { CapslockState } from "../types/index.d";

export const ADD_NEW_TAB = "ADD_NEW_TAB";
export const SELECT_TAB = "SELECT_TAB";
export const UPDATE_SITE = "UPDATE_SITE";
export const CLOSE_TAB = "CLOSE_TAB";
export const TOGGLE_FORWARD = "TOGGLE_FORWARD";
export const TOGGLE_BACK = "TOGGLE_BACK";
export const TOGGLE_RELOAD = "TOGGLE_RELOAD";
export const UPDATE_BACK_FORWARD = "UPDATE_BACK_FORWARD";
export const UPDATE_ORIENTATION = "UPDATE_ORIENTATION";
export const UPDATE_FOUCUSED_PANE = "UPDATE_FOUCUSED_PANE";
export const ADD_PANE = "ADD_PANE";
export const REMOVE_PANE = "REMOVE_PANE";
export const SELECT_PANE = "SELECT_PANE";
export const UPDATE_PANE_BLUEPRINT = "UPDATE_PANE_BLUEPRINT";
export const UPDATE_WORDS_FOR_PAGE_FIND = "UPDATE_WORDS_FOR_PAGE_FIND";
export const UPDATE_CAPSLOCK = "UPDATE_CAPSLOCK";
export const TOGGLE_SOFT_CAPSLOCK = "TOGGLE_SOFT_CAPSLOCK";

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

export function closeTab(
  index: number,
  paneId: number,
  activeTabIndex: number
) {
  let nextActiveTabIndex = 0;
  if (activeTabIndex === index) {
    if (index > 0) {
      nextActiveTabIndex = index - 1;
    } else {
      nextActiveTabIndex = 0;
    }
  } else {
    if (index > activeTabIndex) {
      nextActiveTabIndex = activeTabIndex;
    } else {
      nextActiveTabIndex = activeTabIndex - 1;
    }
  }
  return {
    type: CLOSE_TAB,
    index: index,
    paneId: paneId,
    activeTabIndex: nextActiveTabIndex
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
  return (dispatch, getState) => {
    dispatch(_updateSite(index, title, url, canGoBack, canGoForward, paneId));
  };
}

function _updateSite(
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
      dispatch(_selectPane(paneId));
    } else {
      console.log("pane state is not valid");
    }
  };
}

function _selectPane(paneId: number) {
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

export function updateCapslock(capslockState: CapslockState) {
  return {
    type: UPDATE_CAPSLOCK,
    capslockState: capslockState
  };
}

export function toggleSoftCapslock() {
  return {
    type: TOGGLE_SOFT_CAPSLOCK
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
