export const UPDATE_HOME = "UPDATE_HOME";

export function updateHome(url) {
  return {
    type: UPDATE_HOME,
    url: url
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
