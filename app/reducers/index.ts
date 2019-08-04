import { combineReducers } from "redux";
import keymap from "./keymap";
import ui from "./ui";
import user from "./user";
// import error from "./error";

const appReducer = combineReducers({
  user,
  keymap,
  ui
  // error
});

const rootReducer = (state, action) => {
  if (action.type === "RESET_ALL_SETTINGS") {
    // clear all store
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
