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
    console.log(DAVKeyManagerEmitter);
    this.sub = DAVKeyManagerEmitter.addListener("capslockKeyPress", data => {
      console.log("CapslockFromNative", data);
      switch (data.name) {
        case "mods-down":
          _handleCapsLockDown(false);
          break;
        case "mods-up":
          _handleCapsLockDown(false);
          break;
      }

      //this.webref && this.webref.injectJavaScript(`onKB("${data.name}")`);
    });
    console.log(this.sub);
  }
  componentWillUnmount() {
    this.sub.remove();
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  // setupKeymap(modifiers, browserKeymap) {
  //   // https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
  //   const allowed = [
  //     "home",
  //     "end",
  //     "deletePreviousChar",
  //     "deleteNextChar",
  //     "moveBackOneChar",
  //     "moveForwardOneChar",
  //     "deleteLine"
  //   ];

  //   const keymap = Object.keys(browserKeymap)
  //     .filter(action => allowed.includes(action))
  //     .reduce((obj, action) => {
  //       const usedModifiers: Array<any> = Object.keys(
  //         browserKeymap[action].modifiers
  //       )
  //         // only get true modifiers. e.g. ctrlKey: true
  //         .filter(m => browserKeymap[action].modifiers[m]);

  //       console.log(usedModifiers);
  //       let replacedModifiers = usedModifiers.map(m => {
  //         let modifierKeys: Array<string> = [];
  //         Object.keys(modifiers).forEach(mf => {
  //           if (modifiers[mf] === m) {
  //             modifierKeys.push(mf);
  //           }
  //         });
  //         return modifierKeys;
  //       });

  //       console.log(replacedModifiers);
  //       this._allPossibleCases(replacedModifiers).forEach(modStr => {
  //         let mods = modStr.split(",").map(m => {
  //           switch (m) {
  //             case "ctrlKey":
  //               return "Control";
  //             case "capslockKey":
  //               return "CapsLock";
  //             case "shiftKey":
  //               return "Shift";
  //             case "altKey":
  //               return "Alt";
  //             case "metaKey":
  //               return "Meta";
  //           }
  //         });
  //         console.log(mods);
  //         if (!obj[action]) obj[action] = [];
  //         obj[action].push({
  //           keys: [browserKeymap[action].key, ...mods]
  //         });
  //       });
  //       return obj;
  //     }, {});
  //   console.log(keymap);
  //   const keymapStr = JSON.stringify(keymap);
  //   setTimeout(() => {
  //     this.webref &&
  //       this.webref.injectJavaScript(`loadKeymaps('${keymapStr}')`);
  //   }, 1000);
  // }

  // // https://stackoverflow.com/questions/4331092/finding-all-combinations-cartesian-product-of-javascript-array-values
  // _allPossibleCases(arr) {
  //   if (arr.length == 1) {
  //     return arr[0];
  //   } else {
  //     var result = [];
  //     var allCasesOfRest = this._allPossibleCases(arr.slice(1)); // recur with the rest of array
  //     for (var i = 0; i < allCasesOfRest.length; i++) {
  //       for (var j = 0; j < arr[0].length; j++) {
  //         result.push(arr[0][j] + "," + allCasesOfRest[i]);
  //       }
  //     }
  //     return result;
  //   }
  // }

  _handleCapsLockDown(isDown) {
    let _down = Object.assign({}, this.state.downKeys);
    if (isDown) {
      _down["CapsLoack"] = true;
      this.setState({ downKeys: _down });
      this.handleKeys();
    } else {
      delete _down["CapsLock"];
      this.setState({ downKeys: _down });
    }
  }

  handleKeys() {
    const { modifiers, browserKeymap } = this.props;
    console.log("modifiers", modifiers);

    let pressedKeys = Object.keys(this.state.downKeys).filter(
      k => this.state.downKeys[k] === true
    );
    console.log(pressedKeys);
    this.props.updateAction(pressedKeys.join(","));
    let _modifiers = {
      shiftKey: false,
      ctrlKey: false,
      capslockKey: false,
      altKey: false,
      metakey: false
    };
    Object.keys(modifiers).forEach(m => {
      let name = "";
      switch (m) {
        case "ctrlKey":
          name = "Control";
          break;
        case "capslockKey":
          name = "CapsLock";
          break;
        case "shiftKey":
          name = "Shift";
        case "altKey":
          name = "Alt";
          break;
        case "metaKey":
          name = "Meta";
          break;
      }
      _modifiers[modifiers[m]] = pressedKeys.indexOf(name) !== -1;
    });

    console.log("new mods", _modifiers);
    pressedKeys
      .filter(k => k.length === 1)
      .forEach(k => {
        Object.keys(browserKeymap).forEach(action => {
          if (
            isEqual(browserKeymap[action], {
              key: k,
              modifiers: _modifiers
            })
          ) {
            console.log(action);
            this.props.updateAction(action + ": " + pressedKeys.join(","));
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

    function toUIKitFlags(e) {
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
  }

  handleCapsLock(type, keyEvent) {
    const { modifiers } = this.props;
    if (modifiers["capslockKey"] !== "capslockKey") {
      let mods = 0;
      if (type == "keyup") {
        mods = 0;
      } else {
        mods = toUIKitFlags(keyEvent);
      }
      console.log("mods", mods);
      DAVKeyManager.setCapslock(mods);
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

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    let _down;
    switch (data.postFor) {
      case "keydown":
        _down = Object.assign({}, this.state.downKeys);
        _down[data.keyEvent.key] = true;
        this.setState({ downKeys: _down });
        console.log("keydown", _down);
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
        }
        _down = Object.assign({}, this.state.downKeys);
        delete _down[data.keyEvent.key];
        this.setState({ downKeys: _down });
        console.log("keyup", _down);
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
    const { modifiers, browserKeymap } = this.props;
    const keymapStr = JSON.stringify({
      modifiers: modifiers,
      keymap: browserKeymap
    });
    this.webref && this.webref.injectJavaScript(`loadKeymaps('${keymapStr}')`);
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
