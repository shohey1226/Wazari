import {
  ADD_NEW_TAB,
  SELECT_TAB,
  UPDATE_SITE,
  CLOSE_TAB,
  UPDATE_MODE,
  TOGGLE_FORWARD,
  TOGGLE_BACK,
  UPDATE_ORIENTATION,
  UPDATE_FOUCUSED_PANE,
  UPDATE_KEY_SWITCH,
  TOGGLE_RELOAD,
  ADD_TILE,
  REMOVE_TILE,
  SELECT_TILE,
  UPDATE_TILE_BLUEPRINT
} from "../actions/ui";
import { Map, fromJS, List } from "immutable";
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
  reloadToggled: boolean;
  orientation: string;
  focusedPane: string;
  keySwitchOn: boolean;
  tileIds: Array<number>;
  activeTileId: number;
  tileBlueprint: any;
}

const initialState: UiState = fromJS({
  sites: [],
  activeTabIndex: 0,
  keyMode: KeyMode.Text,
  backToggled: false,
  forwardToggled: false,
  reloadToggled: false,
  focusedPane: "browser",
  keySwitchOn: true,
  tileIds: List(),
  activeTileId: 0,
  tileBlueprint: {}
});

export default function ui(state = initialState, action) {
  let mode;
  switch (action.type) {
    // Back/Forward button on bar
    case TOGGLE_BACK:
      return state.set("backToggled", !state.get("backToggled"));
    case TOGGLE_FORWARD:
      return state.set("forwardToggled", !state.get("forwardToggled"));
    case TOGGLE_RELOAD:
      return state.set("reloadToggled", !state.get("reloadToggled"));

    case ADD_NEW_TAB:
      return state.set(
        "sites",
        state.get("sites").push(Map({ url: action.url }))
      );

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
      return state.set("sites", state.get("sites").delete(action.index));

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

    case UPDATE_KEY_SWITCH:
      return state.set("keySwitchOn", action.switchState);

    case UPDATE_FOUCUSED_PANE:
      return state.set("focusedPane", action.pane);

    case UPDATE_ORIENTATION:
      return state.set("orientation", action.orientation);

    case ADD_TILE:
      return state
        .set("tileIds", state.get("tileIds").push(action.tileId))
        .set("activeTileId", action.tileId);
    case REMOVE_TILE:
      return state
        .set(
          "activeTileId",
          state.get("tileIds").indexOf(action.tileId) - 1 > 0
            ? state
                .get("tileIds")
                .get(state.get("tileIds").indexOf(action.tileId) - 1)
            : state.get("tileIds").get(0)
        )
        .set("tileIds", state.get("tileIds").filter(t => t !== action.tileId));
    case SELECT_TILE:
      return state.set("activeTileId", action.tileId);
    case UPDATE_TILE_BLUEPRINT:
      return state.set("tileBlueprint", Map(action.blueprint));

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
