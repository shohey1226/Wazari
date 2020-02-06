import {
  UPDATE_HOME,
  UPDATE_SEARCH_ENGINE,
  // ADD_EXCLUDED_PATTERN,
  // REMOVE_EXCLUDED_PATTERN,
  // UPDATE_EXCLUDED_PATTERN,
  UPDATE_HISTORY
} from "../actions/user";
import { Map, fromJS, Set, List } from "immutable";
import { SearchEngine } from "../components/SearchEnginePicker";

export interface UserState extends Map<any, any> {
  homeUrl: string;
  searchEngine: SearchEngine;
  // excludedPatterns: Set<string>;
  // excludedPatternHasChanged: boolean;
  history: Array<HistoryItem>;
  maxHistoryCount: number;
}

type HistoryItem = {
  url: string;
  title: string;
};

const initialState: UserState = Map({
  homeUrl: "https://www.google.com",
  searchEngine: SearchEngine.Google,
  // excludedPatterns: Set(),
  // excludedPatternHasChanged: false,
  history: List(),
  maxHistoryCount: 100
});

export default function user(state = initialState, action) {
  switch (action.type) {
    case UPDATE_HOME:
      return state.set("homeUrl", action.url);
    case UPDATE_SEARCH_ENGINE:
      return state.set("searchEngine", action.engine);
    // case ADD_EXCLUDED_PATTERN:
    //   return state
    //     .set(
    //       "excludedPatterns",
    //       state.get("excludedPatterns").add(action.pattern)
    //     )
    //     .set(
    //       "excludedPatternHasChanged",
    //       !state.get("excludedPatternHasChanged")
    //     );
    // case REMOVE_EXCLUDED_PATTERN:
    //   return state
    //     .set(
    //       "excludedPatterns",
    //       state.get("excludedPatterns").delete(action.pattern)
    //     )
    //     .set(
    //       "excludedPatternHasChanged",
    //       !state.get("excludedPatternHasChanged")
    //     );
    // case UPDATE_EXCLUDED_PATTERN:
    //   return state
    //     .set(
    //       "excludedPatterns",
    //       state.get("excludedPatterns").map(p => {
    //         if (p === action.origPattern) {
    //           return action.newPattern;
    //         } else {
    //           return p;
    //         }
    //       })
    //     )
    //     .set(
    //       "excludedPatternHasChanged",
    //       !state.get("excludedPatternHasChanged")
    //     );
    case UPDATE_HISTORY:
      return state.set("history", action.history);
    default:
      return state;
  }
}
