import React, { Component } from "react";
import { WebView } from "react-native-webview";

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

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "keyup":
        this.props.keyup(data.inputValue);
        break;
      case "capsLock":
        this.props.updateCapsLockState(data.capsLockOn);
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
</style>
<script>



// https://stackoverflow.com/questions/5203407/how-to-detect-if-multiple-keys-are-pressed-at-once-using-javascript
function Input(el){
    var parent = el,
        map = {},
        intervals = {};

    function ev_kdown(ev)
    {
        map[ev.key] = true;
        //ev.preventDefault();
        return;
    }

    function ev_kup(ev)
    {
        map[ev.key] = false;
        //ev.preventDefault();
        return;
    }

    function key_down(key)
    {
        return map[key];
    }

    function keys_down_array(array)
    {
        return typeof array.find( key => !key_down(key) ) === "undefined";
    }

    function keys_down_arguments(...args)
    {
        return keys_down_array(args);
    }

    function clear()
    {
        map = {};
    }

    function watch_loop(keylist, callback)
    {
      return function(){
        if(keys_down_array(keylist)){
          callback(map);
        }
      }
    }

    function watch(name, callback, ...keylist)
    {
        intervals[name] = setInterval(watch_loop(keylist, callback), 1000/24);
    }

    function unwatch(name)
    {
        clearInterval(intervals[name]);
        delete intervals[name];
    }

    function detach()
    {
        parent.removeEventListener("keydown", ev_kdown);
        parent.removeEventListener("keyup", ev_kup);
    }

    function attach()
    {
        parent.addEventListener("keydown", ev_kdown);
        parent.addEventListener("keyup", ev_kup);
    }

    function Input()
    {
        attach();

        return {
            key_down:  key_down,
            keys_down: keys_down_arguments,
            watch:     watch,
            unwatch:   unwatch,
            clear:     clear,
            detach:    detach
        };
    }

    return Input();
}

function loadKeymaps(keymapStr){
  var search = Input(document.getElementById("search"));
  var keymapObj = JSON.parse(keymapStr);
  Object.keys(keymapObj).forEach((action) => {
    keymapObj[action].forEach((h, index) => {
      search.watch(action+index, function(map){
        window.ReactNativeWebView.postMessage(JSON.stringify({name: action+index, postFor: "action"}));
      }, ...h.keys);
    })
  });
}

</script>
`;
