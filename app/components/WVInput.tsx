import React, { Component } from "react";
import { NativeModules, NativeEventEmitter, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import RNFS from "react-native-fs";
import { isEqual } from "lodash";
const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface IState {
  isCapsLockOn: boolean;
  isCapsLockRemapped: boolean;
  debugLines: Array<string>;
  words: string;
}

interface Props {
  modifiers: any;
  browserKeymap: any;
  updateCapsLockState: (any) => void;
  closeSearch: () => void;
  onEndEditing: (string) => void;
  updateWords: (string) => void;
  text: string;
}

// Use webview input
class WVInput extends Component<Props, IState, any> {
  webref: WebView | null = null;
  down: any = {};
  sub: any = null;
  isNativeCapslock: boolean = false;
  lastKeyTimestamp: number | null = null;

  constructor(props) {
    super(props);
    this.state = {
      debugLines: [],
      words: "",
      isCapsLockOn: props.isCapsLockOn,
      isCapsLockRemapped: props.modifiers["capslockKey"] !== "capslockKey"
    };
  }

  componentDidMount() {
    this.sub = DAVKeyManagerEmitter.addListener("modKeyPress", data => {
      console.log("RN: ModsFromNative", data);
      switch (data.name) {
        case "mods-down":
          if (data.flags === 262144) {
            this._handleControl();
          } else {
            this.handleCapsLockFromNative(true);
          }
          break;
        case "mods-up":
          //this.handleCapsLockFromNative(false);
          break;
      }
    });
  }

  componentDidUpdate(prevProp, prevState) {
    const { text, isActive } = this.props;
    const { words } = this.state;
    if (prevProp.text !== text) {
      this.webref && this.webref.injectJavaScript(`updateText("${text}")`);
    }

    if (prevState.words !== words) {
      this.props.updateWords(words);
    }
  }

  componentWillUnmount() {
    this.sub.remove();
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  // RN JS(Webview) -> RN -> Native(iOS) -> RN handling both keydown/up
  handleCapsLockFromNative(isDown) {
    if (isDown) {
      this.down["CapsLock"] = true;
      this.isNativeCapslock = true;
      this.handleKeys({
        key: "CapsLock",
        type: "keydown",
        modifiers: {
          shiftKey: false,
          metaKey: false,
          altKey: false,
          ctrlKey: false
        }
      });
    } else {
      this.down["CapsLock"] && delete this.down["CapsLock"];
    }
  }

  // UIKeycommand(Native) to RN and use down object to detect simaltanous keys.
  _handleControl() {
    this.down["Control"] = true;
  }

  handleKeys(keyEvent) {
    const { modifiers, browserKeymap } = this.props;

    console.log("down", this.down);
    const pressedKeys = Object.keys(this.down);

    if (this.down["Enter"]) {
      this.webref.injectJavaScript(`processEnter()`);
      return;
    }
    // handle Enter and Esc
    else if (this.down["Escape"]) {
      this.props.closeSearch();
      return;
    }

    // customized modifiers
    const origMods = keyEvent.modifiers;
    let newMods = Object.assign({}, origMods);
    Object.keys(origMods).forEach(k => {
      if (modifiers[k]) {
        newMods[k] = newMods[k] || origMods[modifiers[k]];
      }
    });

    // capslock handling
    if (this.state.isCapsLockRemapped) {
      newMods["capslockKey"] = false;
      Object.keys(modifiers).forEach(m => {
        if (modifiers[m] === "capslockKey") {
          newMods["capslockKey"] = newMods["capslockKey"] || newMods[m];
        }
      });
      // if rempapped, capslockKey is never becoming "on"
      newMods[modifiers.capslockKey] =
        newMods[modifiers.capslockKey] || "CapsLock" in this.down;
    } else {
      newMods["capslockKey"] = "CapsLock" in this.down;
    }

    let hasAction = false;
    pressedKeys
      .filter(k => k.length === 1)
      .forEach(key => {
        Object.keys(browserKeymap).forEach(action => {
          const keymap = browserKeymap[action];
          console.log(
            "origMods and newMods and keymap",
            origMods,
            newMods,
            keymap.modifiers
          );
          // always comparing to lowercase of the input key
          if (
            isEqual(keymap.modifiers, newMods) &&
            keymap.key === key.toLowerCase()
          ) {
            console.log("executing actin: ", action);
            this.handleAction(action);
            hasAction = true;

            // handle keyup
            if (
              this.state.isCapsLockRemapped &&
              this.down["CapsLock"] &&
              this.isNativeCapslock === false
            ) {
              if (/^[dhjklobfnpwxy]$/.test(key.toLowerCase())) {
                const now = new Date().getTime();
                if (
                  this.lastKeyTimestamp &&
                  now - this.lastKeyTimestamp > 500
                ) {
                  delete this.down["CapsLock"]; // keyup
                }
                this.lastKeyTimestamp = now;
              } else {
                delete this.down["CapsLock"]; // keyup
              }
            }
          }
        });
      });

    if (!hasAction && this.state.isCapsLockRemapped) {
      if (/^[A-Za-z]$/.test(keyEvent.key) && keyEvent.type === "keydown") {
        let inputKey =
          this.state.isCapsLockOn === true ||
          pressedKeys.indexOf("Shift") !== -1
            ? keyEvent.key.toUpperCase()
            : keyEvent.key.toLowerCase();

        this.webref.injectJavaScript(`updateInputValue("${inputKey}")`);
      }
    }
  }

  toUIKitFlags(e) {
    // https://github.com/blinksh/blink/blob/847298f9a1bc99848989fbbf5d3afd7cef51449f/KB/JS/src/UIKeyModifierFlags.ts
    const UIKeyModifierAlphaShift = 1 << 16; // This bit indicates CapsLock
    const UIKeyModifierShift = 1 << 17;
    const UIKeyModifierControl = 1 << 18;
    const UIKeyModifierAlternate = 1 << 19;
    const UIKeyModifierCommand = 1 << 20;
    const UIKeyModifierNumericPad = 1 << 21;

    let res = 0;
    if (e.shiftKey) {
      res |= UIKeyModifierShift;
    }
    if (e.ctrlKey) {
      res |= UIKeyModifierControl;
    }
    if (e.altKey) {
      res |= UIKeyModifierAlternate;
    }
    if (e.metaKey) {
      res |= UIKeyModifierCommand;
    }
    res |= UIKeyModifierAlphaShift;
    return res;
  }

  // handle capslock comes from JS
  handleCapsLockFromJS(type, keyEvent) {
    if (this.state.isCapsLockRemapped) {
      let mods = 0;
      if (type === "keyup") {
        mods = 0;
      } else {
        mods = this.toUIKitFlags(keyEvent);
        this.handleKeys(keyEvent);
      }
      DAVKeyManager.setMods(mods);
    }
  }

  handleSoftwareCapsLock(keyEvent) {
    const { modifiers, updateCapsLockState } = this.props;
    Object.keys(modifiers)
      .filter(m => modifiers[m] === "capslockKey")
      .forEach(m => {
        if (keyEvent[m] === true) {
          updateCapsLockState(!this.state.isCapsLockOn);
          this.setState({ isCapsLockOn: !this.state.isCapsLockOn });
        }
      });
  }

  handleAction(action) {
    switch (action) {
      case "home":
        this.webref.injectJavaScript(`cursorToBeginning()`);
        break;
      case "end":
        this.webref.injectJavaScript(`cursorToEnd()`);
        break;
      case "deletePreviousChar":
        this.webref.injectJavaScript(`deletePreviousChar()`);
        break;
      case "deleteNextChar":
        this.webref.injectJavaScript(`deleteNextChar()`);
        break;
      case "moveBackOneChar":
        this.webref.injectJavaScript(`moveBackOneChar()`);
        break;
      case "moveForwardOneChar":
        this.webref.injectJavaScript(`moveForwardOneChar()`);
        break;
      case "moveDownOneLine":
        this.props.nextHistoryItem();
        break;
      case "deleteLine":
        this.webref.injectJavaScript(`deleteLine()`);
        break;
      case "moveUpOneLine":
        this.props.previousHistoryItem();
        break;
    }
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    this._handleDebug(JSON.stringify(data));
    switch (data.postFor) {
      case "keydown":
        this.down[data.keyEvent.key] = true;

        console.log("keydown", this.down);
        if (data.keyEvent.key === "CapsLock") {
          this.isNativeCapslock = false;
          this.lastKeyTimestamp = new Date().getTime(); // need first press
          this.handleCapsLockFromJS("keydown", data.keyEvent);
        } else {
          this.handleKeys(data.keyEvent);
        }
        this.handleSoftwareCapsLock(data.keyEvent);
        break;

      case "keyup":
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLockFromJS("keyup", data.keyEvent);
          console.log("capslock - keyup for keydown", this.down);
        } else if (data.keyEvent.key === "Meta") {
          // Meta+key doesn't fire key up event..
          this.down = {};
        }
        this.down[data.keyEvent.key] && delete this.down[data.keyEvent.key];
        break;
      case "capslock":
        DAVKeyManager.setCapslock(data.mods);
        break;
      case "inputValue":
        this.setState({ words: data.words });
        break;
      case "enterValue":
        this.setState({ words: "" });
        this.props.onEndEditing(data.words);
        break;
    }
  }

  onLoadEnd() {
    const { modifiers } = this.props;
    this.webref.injectJavaScript(`document.getElementById('search').focus()`);
    let initStr = JSON.stringify({
      isCapsLockRemapped: this.state.isCapsLockRemapped
    });
    console.log(initStr);
    this.webref.injectJavaScript(`init('${initStr}')`);
  }

  _handleDebug(line: string) {
    let lines = this.state.debugLines;
    const now = new Date();
    lines.unshift(`${now.getTime()}: ${line}`);
    this.setState({ debugLines: lines });
  }

  renderDebugInfo() {
    return (
      <View style={{ width: "60%", height: 200, backgroundColor: "#333" }}>
        {this.state.debugLines.slice(0, 15).map((l, i) => (
          <Text
            key={`debug-line-${i}`}
            style={{ fontSize: 10, color: "white" }}
          >
            {l}
          </Text>
        ))}
      </View>
    );
  }

  render() {
    return (
      <WebView
        ref={r => (this.webref = r as any)}
        originWhitelist={["*"]}
        source={{ uri: `file://${RNFS.MainBundlePath}/search.html` }}
        onLoadEnd={this.onLoadEnd.bind(this)}
        onMessage={this.onMessage.bind(this)}
      />
    );
  }
}

export default WVInput;
