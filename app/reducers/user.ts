import { UPDATE_HOME, UPDATE_SEARCH_ENGINE } from "../actions/user";
import { Map, fromJS } from "immutable";
import { SearchEngine } from "../components/SearchEnginePicker";

export interface UserState extends Map<any, any> {
  homeUrl: string;
  searchEngine: SearchEngine;
}

const initialState: UserState = fromJS({
  homeUrl: "https://www.google.com",
  searchEngine: SearchEngine.Google
});

export default function user(state = initialState, action) {
  switch (action.type) {
    case UPDATE_HOME:
      return state.set("homeUrl", action.url);
    case UPDATE_SEARCH_ENGINE:
      return state.set("searchEngine", action.engine);
    default:
      return state;
  }
}
