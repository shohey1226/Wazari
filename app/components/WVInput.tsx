import React, { Component } from "react";
import { WebView } from "react-native-webview";
import RNFS from "react-native-fs";

// Use webview input
class WVInput extends Component {
  webref: WebView | null = null;

  componentDidMount() {
    const { modifiers, browserKeymap } = this.props;
    this.setupKeymap(modifiers, browserKeymap);
  }
  componentWillUnmount() {
    this.webref &&
      this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  setupKeymap(modifiers, browserKeymap) {
    // https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
    const allowed = [
      "home",
      "end",
      "deletePreviousChar",
      "deleteNextChar",
      "moveBackOneChar",
      "moveForwardOneChar",
      "deleteLine"
    ];

    const keymap = Object.keys(browserKeymap)
      .filter(action => allowed.includes(action))
      .reduce((obj, action) => {
        const usedModifiers: Array<any> = Object.keys(
          browserKeymap[action].modifiers
        )
          // only get true modifiers. e.g. ctrlKey: true
          .filter(m => browserKeymap[action].modifiers[m]);

        console.log(usedModifiers);
        let replacedModifiers = usedModifiers.map(m => {
          let modifierKeys: Array<string> = [];
          Object.keys(modifiers).forEach(mf => {
            if (modifiers[mf] === m) {
              modifierKeys.push(mf);
            }
          });
          return modifierKeys;
        });

        console.log(replacedModifiers);
        this._allPossibleCases(replacedModifiers).forEach(modStr => {
          let mods = modStr.split(",").map(m => {
            switch (m) {
              case "ctrlKey":
                return "Control";
              case "capslockKey":
                return "CapsLock";
              case "shiftKey":
                return "Shift";
              case "altKey":
                return "Alt";
              case "metaKey":
                return "Meta";
            }
          });
          console.log(mods);
          if (!obj[action]) obj[action] = [];
          obj[action].push({
            keys: [browserKeymap[action].key, ...mods]
          });
        });
        return obj;
      }, {});
    console.log(keymap);
    const keymapStr = JSON.stringify(keymap);
    setTimeout(() => {
      this.webref &&
        this.webref.injectJavaScript(`loadKeymaps('${keymapStr}')`);
    }, 1000);
  }

  // https://stackoverflow.com/questions/4331092/finding-all-combinations-cartesian-product-of-javascript-array-values
  _allPossibleCases(arr) {
    if (arr.length == 1) {
      return arr[0];
    } else {
      var result = [];
      var allCasesOfRest = this._allPossibleCases(arr.slice(1)); // recur with the rest of array
      for (var i = 0; i < allCasesOfRest.length; i++) {
        for (var j = 0; j < arr[0].length; j++) {
          result.push(arr[0][j] + "," + allCasesOfRest[i]);
        }
      }
      return result;
    }
  }

  handleKeys(keys) {
    this.props.updateAction(keys.join(","));
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "pressedKeys":
        this.handleKeys(data.keys);
        break;
      case "action":
        this.props.updateAction(data.name);
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
        source={{ uri: "https://jsfiddle.net/shohey1226/ja2yzd3k/show" }}
        onLoadEnd={this.onLoadEnd.bind(this)}
        onMessage={this.onMessage.bind(this)}
        keyboardDisplayRequiresUserAction={false}
        sharedCookiesEnabled={true}
        useWebKit={true}
        hideKeyboardAccessoryView={true}
        allowsBackForwardNavigationGestures={true}
        decelerationRate="fast"
        userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15"
      />
    );
  }
}

export default WVInput;
