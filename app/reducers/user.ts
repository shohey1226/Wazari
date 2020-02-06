import {
  UPDATE_HOME,
  UPDATE_SEARCH_ENGINE,
  UPDATE_HISTORY
} from "../actions/user";
import { Map, fromJS, Set, List } from "immutable";
import { SearchEngine } from "../components/SearchEnginePicker";

export interface UserState extends Map<any, any> {
  homeUrl: string;
  searchEngine: SearchEngine;
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
  history: List(),
  maxHistoryCount: 100
});

export default function user(state = initialState, action) {
  switch (action.type) {
    case UPDATE_HOME:
      return state.set("homeUrl", action.url);
    case UPDATE_SEARCH_ENGINE:
      return state.set("searchEngine", action.engine);
    case UPDATE_HISTORY:
      return state.set("history", action.history);
    default:
      return state;
  }
}
