export const ADD_NEW_TAB = "ADD_NEW_TAB";
export const SELECT_TAB = "SELECT_TAB";
export const UPDATE_SITE = "UPDATE_SITE";
export const CLOSE_TAB = "CLOSE_TAB";
export const COMPLETED_TO_UPDATE_URL_FOR_ATS =
  "COMPLETED_TO_UPDATE_URL_FOR_ATS";
export const UPDATE_URL_FOR_ATS = "UPDATE_URL_FOR_ATS";
export const TOGGLE_FORWARD = "TOGGLE_FORWARD";
export const TOGGLE_BACK = "TOGGLE_BACK";
export const UPDATE_BACK_FORWARD = "UPDATE_BACK_FORWARD";

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

export function addNewTab(url) {
  return {
    type: ADD_NEW_TAB,
    url: url
  };
}

export function closeTab(index: number, focusedIndex: number | null) {
  return {
    type: CLOSE_TAB,
    index: index,
    focusedIndex: focusedIndex
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

export function updateUrlForATS(index, url) {
  return (dispatch, getState) => {
    dispatch(_updatingUrlForATS(index, url));
    setTimeout(() => {
      dispatch(_completedToUpdateUrlForATS());
    }, 1);
  };
}

function _updatingUrlForATS(index, url) {
  return {
    type: UPDATE_URL_FOR_ATS,
    index: index,
    url: url
  };
}

function _completedToUpdateUrlForATS() {
  return {
    type: COMPLETED_TO_UPDATE_URL_FOR_ATS
  };
}
