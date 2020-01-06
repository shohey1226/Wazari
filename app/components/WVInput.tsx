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
}

interface Props {
  modifiers: any;
  browserKeymap: any;
  updateCapsLockState: (any) => void;
}

// Use webview input
class WVInput extends Component<Props, IState, any> {
  webref: WebView | null = null;
  down: any = {}; // to detect simaltanous keys.
  sub: any;

  constructor(props) {
    super(props);
    this.state = {
      downKeys: {},
      isCapsLockOn: props.isCapsLockOn,
      clearId: null
    };
    this.sub = null;
  }

  componentDidMount() {
    const { modifiers, browserKeymap } = this.props;
    this.sub = DAVKeyManagerEmitter.addListener("modKeyPress", data => {
      console.log("RN: ModsFromNative", data);
      switch (data.name) {
        case "mods-down":
          // keydown key of control is not firing.
          // Use UIKeycommand to simulate the keydown.
          if (data.flags === 262144) {
            this.down["Control"] = true;
          }
          break;
        case "mods-up":
          break;
      }
    });
  }
  componentWillUnmount() {
    this.sub.remove();
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
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
            if (this.state.clearId !== null) {
              clearTimeout(this.state.clearId);
              this.capsKeyup();
            }
          }
        });
      });

    if (!hasAction) {
      if (/^[A-Za-z]$/.test(keyEvent.key) && keyEvent.type === "keydown") {
        let inputKey =
          this.state.isCapsLockOn === true
            ? keyEvent.key.toUpperCase()
            : keyEvent.key.toLowerCase();

        this.webref.injectJavaScript(`updateInputValue("${inputKey}")`);
      }
    }
  }

  handleCapsLock(type, keyEvent) {
    const { modifiers } = this.props;
    // if capslock is remapped
    if (modifiers["capslockKey"] !== "capslockKey") {
      this.down["CapsLock"] = true;
      this.handleKeys(keyEvent);
      this.capsKeyup();
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

  /* 
    CapsLock behavies the below. 
    Simulate key release and key repeat with setTimeout
    1. capslock press - keydown 
    2. caplock release - no event 
    3. capslock press - keyup 
    4. capslock release - no event
  */
  capsKeyup() {
    let clearId = setTimeout(() => {
      console.log("RN: Simulate keyup from capsLockKeydown with setTimout");
      this.webref.injectJavaScript(`capslockKeyUp()`);
      this.down["CapsLock"] && delete this.down["CapsLock"];
      this.setState({ clearId: null });
    }, 700);
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
    let _down;
    switch (data.postFor) {
      case "keydown":
        this.down[data.keyEvent.key] = true;
        console.log("keydown", this.down);
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLock("keydown", data.keyEvent);
        } else {
          this.handleKeys(data.keyEvent);
        }
        this.handleSoftwareCapsLock(data.keyEvent);
        break;

      case "keyup":
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLock("keyup", data.keyEvent);
          console.log("capslock - keyup for keydown", this.down);
          break;
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
    if (this.webref) {
      this.webref.injectJavaScript(`document.getElementById('search').focus()`);
      let initStr = JSON.stringify({
        isCapsLockRemapped: modifiers["capslockKey"] !== "capslockKey"
      });
      console.log(initStr);
      this.webref.injectJavaScript(`init('${initStr}')`);
    }
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
