export const UPDATE_KEYMAP = "UPDATE_KEYMAP";
export const UPDATE_MODIFIER = "UPDATE_MODIFIER";
export const UPDATE_ACTION_MODIFIER = "UPDATE_ACTION_MODIFIER";
export const UPDATE_ACTION_KEY = "UPDATE_ACTION_KEY";
export const SET_DEFAULT = "SET_DEFAULT";

export function updateModifier(key, value) {
  return {
    type: UPDATE_MODIFIER,
    key: key,
    value: value
  };
}

export function updateActionModifier(window, action, modifier, value) {
  return {
    type: UPDATE_ACTION_MODIFIER,
    window: window,
    action: action,
    modifier: modifier,
    value: value
  };
}

export function updateActionKey(window, action, value) {
  return {
    type: UPDATE_ACTION_KEY,
    window: window,
    action: action,
    value: value
  };
}

export function setDefault() {
  return {
    type: SET_DEFAULT
  };
}
