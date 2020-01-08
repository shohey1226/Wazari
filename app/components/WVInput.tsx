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
  clearId: number | null;
  isCapsLockRemapped: boolean;
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
      isCapsLockOn: props.isCapsLockOn,
      clearId: null,
      isCapsLockRemapped: props.modifiers["capslockKey"] !== "capslockKey"
    };
    sub = null;
  }

  componentDidMount() {
    const { modifiers, browserKeymap } = this.props;
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
  componentWillUnmount() {
    this.sub.remove();
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  // RN JS(Webview) -> RN -> Native(iOS) -> RN handling both keydown/up
  handleCapsLockFromNative(isDown) {
    if (isDown) {
      this.down["CapsLock"] = true;
      this.handleKeys({ key: "CapsLock", type: "keydown", isFromNative: true });
    } else {
      this.down["CapsLock"] && delete this.down["CapsLock"];
    }
  }

  // UIKeycommand(Native) to RN and use down object to detect simaltanous keys.
  _handleControl() {
    this.down["Control"] = true;
    //this.handleKeys();
    // looks like Control up is called on physical device
    // __DEV__ === true &&
    //   setTimeout(() => {
    //     console.log("simulate Control keyup with setTimout");
    //     this.down["Control"] && delete this.down["Control"];
    //   }, 300);
  }

  handleKeys(keyEvent) {
    const { modifiers, browserKeymap } = this.props;
    const pressedKeys = Object.keys(this.down);
    console.log(`RN: pressedKeys: ${pressedKeys.join(",")}`);

    // handle Enter and Esc
    if (pressedKeys.indexOf("Escape") !== -1) {
      this.props.closeSearch();
      return;
    } else if (pressedKeys.indexOf("Enter") !== -1) {
      return;
    }

    // modifiers from input
    let m = {
      capslockKey: pressedKeys.indexOf("CapsLock") !== -1,
      shiftKey: pressedKeys.indexOf("Shift") !== -1,
      altKey: pressedKeys.indexOf("Alt") !== -1,
      ctrlKey: pressedKeys.indexOf("Control") !== -1,
      metaKey: pressedKeys.indexOf("Meta") !== -1
    };

    console.log("Modifiers: before applying remap", m);
    let _m = {}; // m should not be modified during transformation
    Object.keys(m).forEach(inputKey => {
      //console.log("inputKey:", inputKey, "input mods:", m[inputKey]);
      let targetMods = Object.keys(modifiers).filter(
        k => modifiers[k] === inputKey
      );
      //console.log("targetMods", targetMods);
      if (targetMods.length === 0) {
        _m[inputKey] = false;
      } else {
        let result = false;
        targetMods.forEach(k => {
          result = result || m[k];
        });
        _m[inputKey] = result;
      }
    });
    m = _m;
    console.log("Modifiers: after applyed remap", m);

    // let m = {
    //   capslockKey: false,
    //   shiftKey: false,
    //   altKey: false,
    //   ctrlKey: false,
    //   metaKey: false
    // };

    // m[modifiers.capslockKey] = pressedKeys.indexOf("CapsLock") !== -1;
    // m["shiftKey"] = pressedKeys.indexOf("Shift") !== -1;
    // m[modifiers.altKey] = pressedKeys.indexOf("Alt") !== -1;
    // m[modifiers.ctrlKey] = pressedKeys.indexOf("Control") !== -1;
    // m[modifiers.metaKey] = pressedKeys.indexOf("Meta") !== -1;

    this.props.updateAction(JSON.stringify(this.down));

    let hasAction = false;
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
            hasAction = true;

            // simulate key repeat
            // extends capslock keyup - clear and set again
            if (this.state.clearId !== null && keyEvent.isFromNative !== true) {
              clearTimeout(this.state.clearId);
              this.capsKeyup();
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
    const { modifiers } = this.props;
    // if capslock is remapped
    if (modifiers["capslockKey"] !== "capslockKey") {
      let mods = 0;
      if (type === "keyup") {
        mods = 0;
      } else {
        mods = this.toUIKitFlags(keyEvent);
        this.capsKeyup();
        this.handleKeys(keyEvent);
      }
      DAVKeyManager.setMods(mods);
      console.log(
        `RN: capslock is remapped and setMods - type: ${type} mods: ${mods}`
      );
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

  capsKeyup() {
    let clearId = setTimeout(() => {
      console.log("RN: Simulate keyup from capsLockKeydown with setTimout");
      this.webref.injectJavaScript(`capslockKeyUp()`);
      this.down["CapsLock"] && delete this.down["CapsLock"];
      this.setState({ clearId: null });
    }, 750);
    this.setState({ clearId: clearId });
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
    this.props.debug(JSON.stringify(data));
    let _down;
    switch (data.postFor) {
      case "keydown":
        this.down[data.keyEvent.key] = true;
        console.log("keydown", this.down);
        if (data.keyEvent.key === "CapsLock") {
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
    const { modifiers } = this.props;
    this.webref.injectJavaScript(`document.getElementById('search').focus()`);
    let initStr = JSON.stringify({
      isCapsLockRemapped: this.state.isCapsLockRemapped
    });
    console.log(initStr);
    this.webref.injectJavaScript(`init('${initStr}')`);
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
