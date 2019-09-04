import {
  UPDATE_KEYMAP,
  UPDATE_MODIFIER,
  UPDATE_ACTION_MODIFIER,
  UPDATE_ACTION_KEY,
  SET_DEFAULT
  // UPDATE_ACE_ACTION_MODIFIER,
  // UPDATE_ACE_ACTION_KEY,
  // SET_ACE_DEFAULT
} from "../actions/keymap";
import { Map, fromJS } from "immutable";

// metaKey is command key on Mac
const defaultKeymap = {
  modifiers: {
    capslockKey: "capslockKey",
    ctrlKey: "ctrlKey",
    altKey: "altKey",
    metaKey: "metaKey"
  },
  app: {
    // fullWindow: {
    //   key: "?",
    //   modifiers: {
    //     capslockKey: false,
    //     shiftKey: false,
    //     altKey: true,
    //     ctrlKey: false,
    //     metaKey: true
    //   }
    // },
    focusOnSearch: {
      key: "i",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    addRowPane: {
      key: "'",
      modifiers: {
        capslockKey: false,
        shiftKey: true,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    addColumnPane: {
      key: "5",
      modifiers: {
        capslockKey: false,
        shiftKey: true,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    removePane: {
      key: "x",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    nextPane: {
      key: "o",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    previousPane: {
      key: ";",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    increasePaneSize: {
      key: "]",
      modifiers: {
        capslockKey: false,
        shiftKey: true,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    decreasePaneSize: {
      key: "[",
      modifiers: {
        capslockKey: false,
        shiftKey: true,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    }
  },
  browser: {
    copy: {
      key: "c",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    paste: {
      key: "v",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    // help: {
    //   key: "1",
    //   modifiers: {
    //     capslockKey: false,
    //     shiftKey: false,
    //     altKey: true,
    //     ctrlKey: false,
    //     metaKey: false
    //   }
    // },
    home: {
      key: "a",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    end: {
      key: "e",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    deletePreviousChar: {
      key: "h",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    deleteNextChar: {
      key: "d",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    moveBackOneChar: {
      key: "b",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    moveForwardOneChar: {
      key: "f",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    goBack: {
      key: "[",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    goForward: {
      key: "]",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    newTab: {
      key: "t",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    reload: {
      key: "r",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    nextTab: {
      key: "Tab",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    previousTab: {
      key: "Tab",
      modifiers: {
        capslockKey: false,
        shiftKey: true,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      }
    },
    closeTab: {
      key: "w",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    scrollDown: {
      key: "n",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    scrollUp: {
      key: "p",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    hitAHint: {
      key: "i",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    },
    zoomIn: {
      key: "+",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    zoomOut: {
      key: "_",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: true
      }
    },
    // find: {
    //   key: "f",
    //   modifiers: {
    //     capslockKey: false,
    //     shiftKey: false,
    //     altKey: false,
    //     ctrlKey: false,
    //     metaKey: true
    //   }
    // },
    deleteLine: {
      key: "k",
      modifiers: {
        capslockKey: false,
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }
    }
  }
};

const initialState = fromJS(defaultKeymap);

export default function keymap(state = initialState, action) {
  switch (action.type) {
    case UPDATE_MODIFIER:
      return state.setIn(["modifiers", action.key], action.value);
    case UPDATE_KEYMAP:
      return state
        .setIn(["entities", action.filename], action.fileContent)
        .set("filenames", state.get("filenames").push(action.filename));
    case UPDATE_ACTION_MODIFIER:
      return state.setIn(
        [action.window, action.action, "modifiers", action.modifier],
        action.value
      );
    case UPDATE_ACTION_KEY:
      return state.setIn([action.window, action.action, "key"], action.value);
    case SET_DEFAULT:
      return fromJS(defaultKeymap);
    default:
      return state;
  }
}
