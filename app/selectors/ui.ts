import { createSelectorCreator, defaultMemoize } from "reselect";
import { isEqual } from "lodash";

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

const sitesSelector = state => state.ui.get("sites").toJS();
export const selectSites = createDeepEqualSelector([sitesSelector], sites => {
  return sites;
});
