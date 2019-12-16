import React, { Component } from "react";
import { WebView } from "react-native-webview";

// Use webview input
class WVInput extends Component {
  webref: WebView | null = null;

  componentDidMount() {
    const { modifiers, browserKeymap } = this.props;
    //this.setupKeymap(modifiers, browserKeymap);
  }
  componentWillUnmount() {
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

  handleKeys(keys) {
    this.props.updateAction(keys.join(","));
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "pressedKeys":
        this.props.updateAction(JSON.stringify(data.keys));
        break;
      case "capsLockState":
        this.props.updateCapsLockState(data.isCapsLockOn);
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
        source={{ html: HTML }}
        onLoadEnd={this.onLoadEnd.bind(this)}
        onMessage={this.onMessage.bind(this)}
      />
    );
  }
}

export default WVInput;

const HTML = `
<div id="container">
  <input type="text" id="search">
  <div id="output"></div>
</div>
<style>
input[type="text"] {
  border: 1px solid red;
  border-radius:10px;
}
input[type="text"]:focus {
  outline: none
}
#container {
}
#search{
  padding: 10px 0;
  border: none;
  font-size: 20px;
  line-height: 20px;
  width: 100%;
}
#output {
  font-size: 10px;
}
</style>
<script>

var down = new Set(); // For simultaneous key press
var IsCapsLockOn = false;
var output = document.getElementById("output");

function setUpCapsLock(isCapsLockOn){
  IsCapsLockOn = isCapsLockOn;
}

function onKeydown(e) {
  output.innerText += e.key + " " + e.type + " " + e.keyCode + "|";
  down.add(e.key);
  if(e.key === "CapsLock"){
    handleCapsLock(e);
  }else if(e.key === "Enter"){
    window.ReactNativeWebView.postMessage(JSON.stringify({name: "DoneEdit", postFor: "actions"}));
  }else if(e.key === "Escape"){
    window.ReactNativeWebView.postMessage(JSON.stringify({name: "Close", postFor: "actions"}));    
  }else{    
    sendKeys();
  }
}

function onKeyup(e) {
  down.delete(e.key);
  output.innerText += e.key + " " + e.type + " " + e.keyCode + "|";  
  output.innerText += JSON.stringify(Array.from(down));
  if(e.key === "CapsLock"){
    handleCapsLock(e);
  }  
}

function handleCapsLock(e){
  down.delete("CapsLock");
  window.ReactNativeWebView.postMessage(JSON.stringify({isCapsLockOn: !IsCapsLockOn, postFor: "capsLockState"}));
  Array.from(down).filter(k => /^\\S$/.test(k)).map(k =>{
    let pressedKeys = {
      key: k,
      modifiers: {
        ctrlKey: down.has("Control"),
        altKey: down.has("Alt"),
        shiftKey: down.has("Shift"),
        capslockKey: true,
        metaKey: down.has("Meta")
      }
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({keys: pressedKeys, postFor: "pressedKeys"}));
  });
}

function sendKeys() {
  if(down.size > 1){
    Array.from(down).filter(k => /^\\S$/.test(k)).map(k =>{
      let pressedKeys = {
        key: k,
        modifiers: {
          ctrlKey: down.has("Control"),
          altKey: down.has("Alt"),
          shiftKey: down.has("Shift"),
          capslockKey: false,
          metaKey: down.has("Meta")
        }
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({keys: pressedKeys, postFor: "pressedKeys"}));
    })
    down.clear();
  }
}

var inputField = document.getElementById('search')
inputField.setAttribute('autocorrection', false);
inputField.setAttribute('spellcheck', 'false');
inputField.setAttribute('autocomplete', 'off');
inputField.setAttribute('autocorrect', 'off');
inputField.setAttribute('autocapitalize', 'none');
inputField.addEventListener('keydown', onKeydown, false);
inputField.addEventListener('keyup', onKeyup, false);

true;

</script>
`;
