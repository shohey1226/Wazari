import {
  ADD_NEW_TAB,
  SELECT_TAB,
  UPDATE_SITE,
  CLOSE_TAB,
  //  UPDATE_MODE,
  TOGGLE_FORWARD,
  TOGGLE_BACK,
  UPDATE_ORIENTATION,
  UPDATE_FOUCUSED_PANE,
  //  UPDATE_KEY_SWITCH,
  TOGGLE_RELOAD,
  ADD_PANE,
  REMOVE_PANE,
  SELECT_PANE,
  UPDATE_PANE_BLUEPRINT,
  UPDATE_WORDS_FOR_PAGE_FIND,
  UPDATE_CAPSLOCK,
  TOGGLE_SOFT_CAPSLOCK,
  UPDATE_WIDTH
} from "../actions/ui";
import { Map, fromJS, List } from "immutable";
import { CapslockState } from "../types/index.d";

type Site = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  updatedAt: number;
  id: number;
};

export interface UiState extends Map<any, any> {
  backToggled: boolean;
  forwardToggled: boolean;
  reloadToggled: boolean;
  orientation: string;
  focusedPane: string;
  paneIds: Array<string>;
  widthMap: { [paneId: string]: number };
  panes: {
    [key: string]: { activeTabIndex: number | null; sites: Array<Site> };
  };
  activePaneId: string;
  paneBlueprint: any;
  wordsForPageFind: string;
  capslockState: CapslockState; // For Icon in Navbar
  isSoftCapslockOn: boolean; // soft capslock state
}

const initialState: UiState = fromJS({
  backToggled: false,
  forwardToggled: false,
  reloadToggled: false,
  focusedPane: "browser",
  paneIds: List(),
  activePaneId: null,
  paneBlueprint: {},
  panes: {},
  widthMap: {},
  wordsForPageFind: "",
  isSoftCapslockOn: false
});

export default function ui(state = initialState, action) {
  let mode;
  switch (action.type) {
    case UPDATE_WORDS_FOR_PAGE_FIND:
      return state.set("wordsForPageFind", action.words);

    // Back/Forward button on bar
    case TOGGLE_BACK:
      return state.set("backToggled", !state.get("backToggled"));
    case TOGGLE_FORWARD:
      return state.set("forwardToggled", !state.get("forwardToggled"));
    case TOGGLE_RELOAD:
      return state.set("reloadToggled", !state.get("reloadToggled"));

    case UPDATE_WIDTH:
      return state.setIn(["widthMap", action.paneId], action.width);

    case ADD_NEW_TAB:
      return state.setIn(
        ["panes", action.paneId, "sites"],
        state
          .getIn(["panes", action.paneId, "sites"])
          .push(Map({ url: action.url, id: new Date().getTime() }))
      );

    case SELECT_TAB:
      return state
        .setIn(["panes", action.paneId, "activeTabIndex"], action.index)
        .setIn(
          ["panes", action.paneId, "sites"],
          state
            .getIn(["panes", action.paneId, "sites"])
            .update(action.index, site => {
              return site.set("updatedAt", new Date().getTime());
            })
        );

    case CLOSE_TAB:
      return state
        .setIn(
          ["panes", action.paneId, "sites"],
          state.getIn(["panes", action.paneId, "sites"]).delete(action.index)
        )
        .setIn(
          ["panes", action.paneId, "activeTabIndex"],
          action.activeTabIndex
        );

    case UPDATE_SITE:
      return state.setIn(
        ["panes", action.paneId, "sites"],
        state
          .getIn(["panes", action.paneId, "sites"])
          .update(action.index, site => {
            return site
              .set("url", action.url)
              .set("title", action.title)
              .set("canGoBack", action.canGoBack)
              .set("canGoForward", action.canGoForward)
              .set("updatedAt", new Date().getTime());
          })
      );

    case UPDATE_FOUCUSED_PANE:
      return state.set("focusedPane", action.pane);

    case UPDATE_ORIENTATION:
      return state.set("orientation", action.orientation);

    case ADD_PANE:
      return state
        .set("paneIds", state.get("paneIds").push(action.paneId))
        .set("activePaneId", action.paneId)
        .setIn(["panes", action.paneId], {
          sites: List(),
          activeTabIndex: 0
        });
    case REMOVE_PANE:
      return state
        .set(
          "activePaneId",
          state.get("paneIds").indexOf(action.paneId) !== 0
            ? state
                .get("paneIds")
                .get(state.get("paneIds").indexOf(action.paneId) - 1)
            : state.get("paneIds").get(1)
        )
        .set(
          "paneIds",
          state.get("paneIds").filter(t => t !== action.paneId)
        )
        .set("panes", state.get("panes").delete(action.paneId))
        .set("widthMap", state.get("widthMap").delete(action.paneId));

    case SELECT_PANE:
      return state.set("activePaneId", action.paneId);

    case UPDATE_PANE_BLUEPRINT:
      return state.set("paneBlueprint", fromJS(action.blueprint));

    case UPDATE_CAPSLOCK:
      return state.set("capslockState", action.capslockState);

    case TOGGLE_SOFT_CAPSLOCK:
      return state.set("isSoftCapslockOn", !state.get("isSoftCapslockOn"));

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
