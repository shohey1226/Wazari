import React, { Component } from "react";
import { NativeModules, NativeEventEmitter } from "react-native";
import { WebView } from "react-native-webview";
import RNFS from "react-native-fs";
import { isEqual } from "lodash";
const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface IState {
  downKeys: any;
  isCapsLockOn: boolean;
}

interface Props {
  modifiers: any;
  browserKeymap: any;
  updateCapsLockState: (any) => void;
}

// Use webview input
class WVInput extends Component<Props, IState, any> {
  webref: WebView | null = null;
  down: any = {};

  constructor(props) {
    super(props);
    this.state = {
      downKeys: {},
      isCapsLockOn: props.isCapsLockOn
    };
    sub = null;
  }

  componentDidMount() {
    const { modifiers, browserKeymap } = this.props;
    this.sub = DAVKeyManagerEmitter.addListener("modKeyPress", data => {
      console.log("ModsFromNative", data);
      switch (data.name) {
        case "mods-down":
          if (data.flags === 262144) {
            console.log("--- mods-down");
            this._handleControl();
          } else {
            this._handleCapsLockDown(true);
          }
          break;
        case "mods-up":
          this._handleCapsLockDown(false);
          break;
      }
    });
  }
  componentWillUnmount() {
    this.sub.remove();
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  // RN JS(Webview) -> RN -> Native(iOS) -> RN handling both keydown/up
  _handleCapsLockDown(isDown) {
    if (isDown) {
      this.down["CapsLock"] = true;
      this.handleKeys();
    } else {
      this.down["CapsLock"] && delete this.down["CapsLock"];
    }
  }

  // UIKeycommand(Native) to RN and use down object to detect simaltanous keys.
  _handleControl() {
    this.down["Control"] = true;
    this.handleKeys();
    // looks like Control up is called on physical device
    __DEV__ === true &&
      setTimeout(() => {
        console.log("simulate Control keyup with setTimout");
        this.down["Control"] && delete this.down["Control"];
      }, 300);
  }

  handleKeys() {
    const { modifiers, browserKeymap } = this.props;
    const pressedKeys = Object.keys(this.down);

    // handle Enter and Esc
    if (pressedKeys.indexOf("Escape") !== -1) {
      this.props.closeSearch();
      return;
    } else if (pressedKeys.indexOf("Enter") !== -1) {
      return;
    }

    let m = {
      capslockKey: false,
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false
    };

    m[modifiers.capslockKey] = pressedKeys.indexOf("CapsLock") !== -1;
    m["shiftKey"] = pressedKeys.indexOf("Shift") !== -1;
    m[modifiers.altKey] = pressedKeys.indexOf("Alt") !== -1;
    m[modifiers.ctrlKey] = pressedKeys.indexOf("Control") !== -1;
    m[modifiers.metaKey] = pressedKeys.indexOf("Meta") !== -1;

    console.log("modifiers in handleKeys()", modifiers);
    console.log("mods in handleKeys()", m);

    this.props.updateAction(JSON.stringify(this.down));

    pressedKeys
      .filter(k => k.length === 1)
      .forEach(key => {
        Object.keys(browserKeymap).forEach(action => {
          const keymap = browserKeymap[action];
          // always comparing to lowercase of the input key
          if (
            isEqual(keymap.modifiers, m) &&
            keymap.key === key.toLowerCase()
          ) {
            this.props.updateAction(
              `action: ${action} - ${JSON.stringify(this.down)}`
            );
            this.handleAction(action);
            // once it's executed then clear it
            this.down = {};
          }
        });
      });
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

  handleCapsLock(type, keyEvent) {
    const { modifiers } = this.props;
    if (modifiers["capslockKey"] !== "capslockKey") {
      let mods = 0;
      if (type == "keyup") {
        mods = 0;
      } else {
        mods = this.toUIKitFlags(keyEvent);
      }
      console.log("mods", mods);
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
    }
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    let _down;
    switch (data.postFor) {
      case "keydown":
        this.down[data.keyEvent.key] = true;
        console.log("keydown", this.down);
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLock("keydown", data.keyEvent);
        } else {
          this.handleKeys();
        }
        this.handleSoftwareCapsLock(data.keyEvent);
        break;

      case "keyup":
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLock("keyup", data.keyEvent);
        } else if (data.keyEvent.key === "Meta") {
          // Meta+key doesn't fire key up event..
          this.down = {};
        }
        this.down[data.keyEvent.key] && delete this.down[data.keyEvent.key];
        console.log("keyup", this.down);
        break;

      case "pressedKeys":
        this.props.updateAction(JSON.stringify(data.keys));
        break;
      case "capslock":
        DAVKeyManager.setCapslock(data.mods);
        break;
      case "actions":
        this.props.performAction(data.name);
        break;
    }
  }

  onLoadEnd() {
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').focus()`);
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
