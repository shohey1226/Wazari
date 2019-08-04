import { UPDATE_HOME } from "../actions/user";
import { Map, fromJS } from "immutable";

export interface UserState extends Map<any, any> {
  homeUrl: string;
  searchEngine: string;
}

const initialState: UserState = fromJS({
  homeUrl: "https://www.google.com",
  searchEngine: "google"
});

export default function user(state = initialState, action) {
  switch (action.type) {
    case UPDATE_HOME:
      return state.set("homeUrl", action.url);
    default:
      return state;
  }
}
