import React, { Component } from "react";
import { NativeModules, NativeEventEmitter, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { isEqual } from "lodash";
const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface IState {
  downKeys: any;
  isCapsLockOn: boolean;
  clearId: number | null;
  isCapsLockRemapped: boolean;
  debugLines: Array<string>;
}

interface Props {
  url: string;
  modifiers: any;
  browserKeymap: any;
  updateCapsLockState: (any) => void;
}

// Use webview input
class WVTerm extends Component<Props, IState, any> {
  webref: WebView | null = null;
  down: any = {};
  capsLockPressed: boolean = false;
  prevKey: string | null = null;
  isNativeCapslock: boolean = false; // comes from iOS native, not JS
  lastKeyTimestamp: number | null = null;

  constructor(props) {
    super(props);
    this.state = {
      downKeys: {},
      isCapsLockOn: props.isCapsLockOn,
      clearId: null,
      isCapsLockRemapped: props.modifiers["capslockKey"] !== "capslockKey",
      debugLines: []
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
            //this._handleControl();
          } else {
            this.handleCapsLockFromNative(true);
          }
          break;
        case "mods-up":
          //this.handleCapsLockFromNative(false);
          break;
      }
    });
    console.log("calling wvterm");
  }
  componentWillUnmount() {
    this.sub.remove();
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  componentDidUpdate(prevProp) {
    const { reloadToggled, isActive } = this.props;
    if (prevProp.reloadToggled !== reloadToggled && isActive) {
      this.webref && this.webref.reload();
    }
  }

  // RN JS(Webview) -> RN -> Native(iOS) -> RN handling both keydown/up
  handleCapsLockFromNative(isDown) {
    //this.capsLockPressed = true;
    this.down["CapsLock"] = true;
    this.isNativeCapslock = true;

    // if (isDown) {
    //   console.log("simulate capslock key");
    //   this.webref.injectJavaScript(
    //     `simulateKeyDown(window.term.textarea, 20, '{}')`
    //   );
    // } else {
    //   this.down["CapsLock"] && delete this.down["CapsLock"];
    // }
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
    if (this.state.isCapsLockRemapped) {
      let mods = 0;
      if (type === "keyup") {
        mods = 0;
      } else {
        mods = this.toUIKitFlags(keyEvent);
        //this.capsKeyup();
        //this.handleKeys(keyEvent);
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
    this.down["CapsLock"] && delete this.down["CapsLock"];
    // console.log("RN: Simulate keyup from capsLockKeydown with setTimout");
    // if (this.state.clearId) {
    //   clearTimeout(this.state.clearId);
    // }
    // let clearId = setTimeout(() => {
    //   this.down["CapsLock"] && delete this.down["CapsLock"];
    //   this.setState({ clearId: null });
    // }, 750);

    // this.setState({ clearId: clearId });
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
    const { modifiers } = this.props;
    this._handleDebug(event.nativeEvent.data);
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "keydown":
        let charCode = data.keyEvent.charCode;
        let keyCode = data.keyEvent.keyCode;
        let key = data.keyEvent.key;
        let type = data.keyEvent.type;
        const repeat = data.keyEvent.repeat;

        // For simultaneous key press
        this.down[key] = keyCode;

        // add hack only JS keydown
        if (key === "CapsLock") {
          this.isNativeCapslock = false;
          this.lastKeyTimestamp = new Date().getTime(); // need first press
        }

        // HW keyboard send keyCode 229 when it's key repeat
        // Need to overwrite with key
        if (repeat === true && keyCode === 229) {
          keyCode = key.charCodeAt(0);
        }

        // customized modifiers
        const origMods = data.keyEvent.modifiers;
        let newMods = Object.assign({}, origMods);
        Object.keys(origMods).forEach(k => {
          if (modifiers[k]) {
            newMods[k] = newMods[k] || origMods[modifiers[k]];
          }
        });

        // handle software capslock
        if (newMods.shiftKey || this.state.isCapsLockOn) {
          if (key.match(/^[a-z]$/)) {
            key = key.toUpperCase();
            charCode = key.charCodeAt(0);
          }
        } else {
          if (key.match(/^[A-Z]$/)) {
            key = key.toLowerCase();
            charCode = key.charCodeAt(0);
          }
        }

        // Some keys needs to be handled
        if (key === " ") {
          // space is handled by keypress
          keyCode = 0;
          charCode = 32;
          type = "keypress";
        } else if (key === "'") {
          // unable to pass over single quote through stringified json.
          // pass over singlequote string and handled in JS side.
          key = "singlequote";
        } else if (key === "\\") {
          // escape for JS
          key = "\\\\";
        } else if (key === '"') {
          // escape for JS
          key = '\\"';
        }

        console.log("DOWN: ", JSON.stringify(this.down));

        if (this.state.isCapsLockRemapped && this.down["CapsLock"]) {
          newMods[modifiers.capslockKey] = true;

          const pressedKeys = Object.keys(this.down);
          pressedKeys.forEach(k => {
            // ascii 32 to 126
            if (/^[ -~]$/.test(k)) {
              let event = Object.assign(
                {
                  type: type,
                  key: key,
                  keyCode: this.down[k],
                  repeat: repeat
                },
                newMods
              );
              let eventStr = JSON.stringify(event);

              // keyup handling
              // handle capslock 1st keydown before simulating key
              if (this.isNativeCapslock === false) {
                if (/^[dhjklobfnpwxy]$/.test(k.toLowerCase())) {
                  const now = new Date().getTime();
                  if (
                    this.lastKeyTimestamp &&
                    now - this.lastKeyTimestamp > 600
                  ) {
                    delete this.down["CapsLock"]; // keyup
                    this.lastKeyTimestamp = null;
                  }
                  this.lastKeyTimestamp = now;
                } else {
                  delete this.down["CapsLock"]; // keyup
                }
              }

              this.webref.injectJavaScript(
                `simulateKey(window.term.textarea, '${eventStr}')`
              );
              // if (/^![bfnpwxy]$/.test(k)) {
              //   delete this.down["CapsLock"]; // keyup
              // }
            }
          });
          this.handleCapsLockFromJS("keydown", data.keyEvent);
        } else {
          let event = Object.assign(
            {
              type: type,
              key: key,
              keyCode: keyCode,
              charCode: charCode,
              repeat: repeat
            },
            newMods
          );
          let eventStr = JSON.stringify(event);
          this.webref.injectJavaScript(
            `simulateKey(window.term.textarea, '${eventStr}')`
          );
        }
        break;

      case "keyup":
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLockFromJS("keyup", data.keyEvent);
        }
        this.down[data.keyEvent.key] && delete this.down[data.keyEvent.key];
        break;
    }
  }

  _handleDebug(line: string) {
    let lines = this.state.debugLines;
    const now = new Date();
    lines.unshift(`${now.getTime()}: ${line}`);
    this.setState({ debugLines: lines });
  }

  renderDebugInfo() {
    return (
      <View style={{ height: 150 }}>
        {this.state.debugLines.slice(0, 15).map((l, i) => (
          <Text key={`debug-line-${i}`} style={{ fontSize: 10 }}>
            {l}
          </Text>
        ))}
      </View>
    );
  }

  onLoadEnd() {
    const { modifiers } = this.props;
    this.webref.injectJavaScript(`window.term.focus();`);
    let initStr = JSON.stringify({
      isCapsLockRemapped: this.state.isCapsLockRemapped
    });
    console.log(initStr);
    this.webref.injectJavaScript(`initFromRN('${initStr}')`);
  }

  render() {
    const { url } = this.props;
    return (
      <View style={{ flex: 1 }}>
        {this.renderDebugInfo()}
        <WebView
          ref={r => (this.webref = r as any)}
          injectedJavaScript={injectingJs}
          originWhitelist={["*"]}
          source={{ uri: url }}
          onLoadEnd={this.onLoadEnd.bind(this)}
          onMessage={this.onMessage.bind(this)}
        />
      </View>
    );
  }
}

export default WVTerm;

const injectingJs: string = `


function simulateKey(element, eventStr) {
  var event = JSON.parse(eventStr);
  if(event.key === "singlequote"){
    event.key = "'";
  }
  var keyEvent = new KeyboardEvent(event.type, event); 
  element.dispatchEvent(keyEvent)
}   

// function simulateKeyPress(element, key, charCode, modifiers) {
//   var modifierObjects = JSON.parse(modifiers);
//   var event = {};  
//   event.charCode = charCode  
//   event.key = key;
//   for (var i in modifierObjects) {
//     event[i] = modifierObjects[i];
//   }
//   var keyEvent = new KeyboardEvent("keypress", event); 
//   element.dispatchEvent(keyEvent)
// }   

// function simulateKeyDown(element, key, keyCode, modifiers) {
//   var modifierObjects = JSON.parse(modifiers);
//   var event = {};
//   event.key = key;
//   event.keyCode = keyCode;
//   for (var i in modifierObjects) {
//     event[i] = modifierObjects[i];
//   }  
//   var keyEvent = new KeyboardEvent("keydown", event); 
//   element.dispatchEvent(keyEvent)
// }   

// Disable tab key
document.addEventListener('keydown', (e)=>{
  if(e.keyCode === 9){
    e.preventDefault();
  }
})

var isCapsLockRemapped = false;

function initFromRN(initStr){
  
  var initObj = JSON.parse(initStr);
  isCapsLockRemapped = initObj.isCapsLockRemapped;

  window.term.attachCustomKeyEventHandler((e) => {
    if(e.isTrusted === false){
      return true;
    }

    if(isCapsLockRemapped === true){
      window.ReactNativeWebView &&
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            keyEvent: {
              key: e.key,
              type: e.type,
              modifiers: {
                shiftKey: e.shiftKey,
                metaKey: e.metaKey,
                altKey: e.altKey,
                ctrlKey: e.ctrlKey
              },
              repeat: e.repeat,
              charCode: e.charCode,
              keyCode: e.keyCode,
              isTrusted: e.isTrusted
            },
            postFor: e.type
          })
        );    
      return false;
   }

  });

  window.document.addEventListener("keyup", (e) => {
    window.ReactNativeWebView &&
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          keyEvent: {
            key: e.key,
            type: e.type,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            repeat: e.repeat
          },
          postFor: e.type
        })
      );    
  });

}

true;


`;
