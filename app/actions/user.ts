export const UPDATE_HOME = "UPDATE_HOME";
export const UPDATE_SEARCH_ENGINE = "UPDATE_SEARCH_ENGINE";
export const UPDATE_HISTORY = "UPDATE_HISTORY";

import { List } from "immutable";

export function updateHome(url: string) {
  return {
    type: UPDATE_HOME,
    url: url
  };
}

export function updateSearchEngine(engine: string) {
  return {
    type: UPDATE_SEARCH_ENGINE,
    engine: engine
  };
}

export function addHistory(url: string, title: string) {
  return (dispatch, getState) => {
    const maxHistoryCount = getState().user.get("maxHistoryCount");
    let history = getState().user.get("history");
    const index = history.findIndex(h => h.url === url);
    if (index === -1) {
      // not found
      dispatch(
        _updateHistory(
          history.unshift({ url: url, title: title }).slice(0, maxHistoryCount)
        )
      );
    } else {
      // found - move to top
      const item = history.get(index);
      dispatch(
        _updateHistory(
          history
            .delete(index)
            .unshift(item)
            .slice(0, maxHistoryCount)
        )
      );
    }
  };
}

function _updateHistory(history) {
  return {
    type: UPDATE_HISTORY,
    history: history
  };
}

// export function updateUrlForATS(index, url) {
//   return (dispatch, getState) => {
//     dispatch(_updatingUrlForATS(index, url));
//     setTimeout(() => {
//       dispatch(_completedToUpdateUrlForATS());
//     }, 1);
//   };
// }
