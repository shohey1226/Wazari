import {
  createSelectorCreator,
  defaultMemoize,
  createSelector
} from "reselect";
import { isEqual } from "lodash";

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

const sitesSelector = state => state.ui.get("sites").toJS();
export const selectSites = createDeepEqualSelector([sitesSelector], sites => {
  return sites;
});

const activeTabIndexSelector = state => state.ui.get("activeTabIndex");
export const selectActiveUrl = createSelector(
  [sitesSelector, activeTabIndexSelector],
  (sites, activeTabIndex) => {
    return sites[activeTabIndex] ? sites[activeTabIndex].url : null;
  }
);

export const selectActiveSite = createSelector(
  [sitesSelector, activeTabIndexSelector],
  (sites, activeTabIndex) => {
    return sites[activeTabIndex] ? sites[activeTabIndex] : null;
  }
);

