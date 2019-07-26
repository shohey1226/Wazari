import {
  ADD_NEW_TAB,
  SELECT_TAB,
  UPDATE_SITE,
  CLOSE_TAB,
  UPDATE_URL_FOR_ATS,
  COMPLETED_TO_UPDATE_URL_FOR_ATS
} from "../actions/ui";
import { Map, fromJS } from "immutable";

enum KeyMode {
  Direct,
  KeyEvent
}

const initialState = fromJS({
  // sites = [{ url: "xx", title: ""},{},,,]
  sites: [],
  activeTabIndex: 0,
  keyMode: KeyMode.Direct
});

export default function ui(state = initialState, action) {
  switch (action.type) {
    case ADD_NEW_TAB:
      return state
        .set("sites", state.get("sites").push(Map({ url: action.url })))
        .set("activeTabIndex", state.get("sites").size);
    case SELECT_TAB:
      return state.set("activeTabIndex", action.index);
    case CLOSE_TAB:
      return state.set("sites", state.get("sites").delete(action.index));
    case SELECT_TAB:
      return state.set("activeTabIndex", action.index);
    case UPDATE_SITE:
      let mode = KeyMode.Direct;
      if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(action.url)) {
        mode = KeyMode.KeyEvent;
      }
      return state
        .set(
          "sites",
          state.get("sites").update(action.index, site => {
            return site.set("url", action.url).set("title", action.title);
          })
        )
        .set("keyMode", mode);

    case UPDATE_URL_FOR_ATS:
      return state
        .set(
          "sites",
          state.get("sites").update(action.index, site => {
            return site.set("url", action.url);
          })
        )
        .set("isUpdatingUrlForATS", true);
    case COMPLETED_TO_UPDATE_URL_FOR_ATS:
      return state.set("isUpdatingUrlForATS", false);
    // case LOGOUT:
    //   // make it default state
    //   return Object.assign({}, state, {
    //     isSigningUp: false,
    //     isLoggingIn: false,
    //     loggedIn: false,
    //     data: {},
    //     signUpFailed: false,
    //     loginFailed: false,
    //     error: null,
    //     isLoadingState: false,
    //   });
    default:
      return state;
  }
}
