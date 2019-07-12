import { combineReducers } from "redux";
// import navigation from "./navigation";
import keymap from "./keymap";
// import config from "./config";
// import browser from "./browser";
// import error from "./error";
import * as storage from "redux-storage";
import merger from "redux-storage-merger-immutablejs";

const appReducer = storage.reducer(
  combineReducers({
    // navigation,
    keymap,
    // config,
    // browser,
    // error
  }),
  merger
);

const rootReducer = (state, action) => {
  if (action.type === "RESET_ALL_SETTINGS") {
    // clear all store
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;