import { combineReducers } from "redux";
// import navigation from "./navigation";
import keymap from "./keymap";
import ui from "./ui";
// import config from "./config";

// import error from "./error";

const appReducer = combineReducers({
  // navigation,
  keymap,
  // config,
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
