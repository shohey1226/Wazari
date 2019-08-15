import { createSelectorCreator, defaultMemoize } from "reselect";
import { isEqual } from "lodash";

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

const appKeymapSelector = state => state.keymap.get("app").toJS();
export const selectAppKeymap = createDeepEqualSelector(
  [appKeymapSelector],
  keymap => {
    return keymap;
  }
);

const browserKeymapSelector = state => state.keymap.get("browser").toJS();
export const selectBrowserKeymap = createDeepEqualSelector(
  [browserKeymapSelector],
  keymap => {
    return keymap;
  }
);

// const terminalKeymapSelector = state => state.keymap.get("terminal").toJS();
// export const selectTerminalKeymap = createDeepEqualSelector(
//   [terminalKeymapSelector],
//   keymap => {
//     return keymap;
//   }
// );

const modifiersSelector = state => state.keymap.get("modifiers").toJS();
export const selectModifiers = createDeepEqualSelector(
  [modifiersSelector],
  modifiers => {
    return modifiers;
  }
);

