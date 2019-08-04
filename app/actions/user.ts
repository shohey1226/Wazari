export const UPDATE_HOME = "UPDATE_HOME";
export const UPDATE_SEARCH_ENGINE = "UPDATE_SEARCH_ENGINE";

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

// export function updateUrlForATS(index, url) {
//   return (dispatch, getState) => {
//     dispatch(_updatingUrlForATS(index, url));
//     setTimeout(() => {
//       dispatch(_completedToUpdateUrlForATS());
//     }, 1);
//   };
// }
