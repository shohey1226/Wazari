export const UPDATE_HOME = "UPDATE_HOME";
export const UPDATE_SEARCH_ENGINE = "UPDATE_SEARCH_ENGINE";
export const ADD_EXCLUDED_PATTERN = "ADD_EXCLUDED_PATTERN";
export const REMOVE_EXCLUDED_PATTERN = "REMOVE_EXCLUDED_PATTERN";
export const UPDATE_EXCLUDED_PATTERN = "UPDATE_EXCLUDED_PATTERN";

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

export function addExcludedPattern(pattern: string) {
  return {
    type: ADD_EXCLUDED_PATTERN,
    pattern: pattern
  };
}

export function removeExcludedPattern(pattern: string) {
  return {
    type: REMOVE_EXCLUDED_PATTERN,
    pattern: pattern
  };
}

export function updateExcludedPattern(origPattern: string, newPattern: string) {
  return {
    type: UPDATE_EXCLUDED_PATTERN,
    origPattern: origPattern,
    newPattern: newPattern
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
