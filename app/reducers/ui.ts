import {
  ADD_NEW_TAB,
  SELECT_TAB,
  UPDATE_SITE,
  CLOSE_TAB,
  UPDATE_MODE,
  TOGGLE_FORWARD,
  TOGGLE_BACK,
  UPDATE_ORIENTATION,
  UPDATE_FOUCUSED_PANE
} from "../actions/ui";
import { Map, fromJS } from "immutable";
import { KeyMode } from "../types/index.d";

type Site = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
};

export interface UiState extends Map<any, any> {
  sites: Array<Site>;
  activeTabIndex: number | null;
  keyMode: KeyMode;
  backToggled: boolean;
  forwardToggled: boolean;
  orientation: string;
  focusedPane: string;
}

const initialState: UiState = fromJS({
  sites: [],
  activeTabIndex: 0,
  keyMode: KeyMode.Text,
  backToggled: false,
  forwardToggled: false,
  foucsedPane: "browser"
});

export default function ui(state = initialState, action) {
  let mode;
  switch (action.type) {
    // Back/Forward button on bar
    case TOGGLE_BACK:
      return state.set("backToggled", !state.get("backToggled"));
    case TOGGLE_FORWARD:
      return state.set("forwardToggled", !state.get("forwardToggled"));

    case ADD_NEW_TAB:
      return state
        .set("sites", state.get("sites").push(Map({ url: action.url })))
        .set("activeTabIndex", state.get("sites").size);
    case SELECT_TAB:
      mode = KeyMode.Text;
      if (
        /^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(
          state.get("sites").getIn([action.index, "url"])
        )
      ) {
        mode = KeyMode.Terminal;
      }
      return state.set("activeTabIndex", action.index).set("keyMode", mode);
    case CLOSE_TAB:
      return state
        .set("sites", state.get("sites").delete(action.index))
        .set("activeTabIndex", action.focusedIndex);
    case SELECT_TAB:
      return state.set("activeTabIndex", action.index);
    case UPDATE_SITE:
      mode = KeyMode.Text;
      if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(action.url)) {
        mode = KeyMode.Terminal;
      }
      return state
        .set(
          "sites",
          state.get("sites").update(action.index, site => {
            return site
              .set("url", action.url)
              .set("title", action.title)
              .set("canGoBack", action.canGoBack)
              .set("canGoForward", action.canGoForward);
          })
        )
        .set("keyMode", mode);

    case UPDATE_MODE:
      return state.set("keyMode", action.mode);

    case UPDATE_FOUCUSED_PANE:
      return state.set("focusedPane", action.pane);

    case UPDATE_ORIENTATION:
      return state.set("orientation", action.orientation);

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
