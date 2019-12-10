import React, { Component } from "react";
import { WebView } from "react-native-webview";

const HTML = `
<div id="container">
  <input type="text" id="search">
</div>
<style>
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

var search = Input(document.getElementById("search"));
search.watch("escape", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "escape", postFor: "action"}));
}, "Escape");
search.watch("home", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "home", postFor: "action"}));
}, "CapsLock", "m");
search.watch("CapsLock", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "CapsLock", postFor: "action"}));
}, "CapsLock");
search.watch("Control", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "Control", postFor: "action"}));
}, "Control");
search.watch("Meta", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "Meta", postFor: "action"}));
}, "Meta");
search.watch("Alt", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "Alt", postFor: "action"}));
}, "Alt");
search.watch("alt+l", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "alt+l", postFor: "action"}));
}, "Alt", "l");
search.watch("control+l", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "control+l", postFor: "action"}));
}, "Control", "l");
search.watch("meta+l", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "meta+l", postFor: "action"}));
}, "Meta", "l");
search.watch("c", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "c", postFor: "action"}));
}, "c");
search.watch("d", function(map){
  window.ReactNativeWebView.postMessage(JSON.stringify({name: "d", postFor: "action"}));
}, "d");


</script>
`



// Use webview input
class WVInput extends Component {
  webref: WebView | null = null;

  componentDidMount(){
  }
  componentWillUnmount(){
    this.webref && this.webref.injectJavaScript(`document.getElementById('search').blur()`);
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "keyup":
        this.props.keyup(data.inputValue)
        break;
      case "capsLock":
        this.props.updateCapsLockState(data.capsLockOn)      
        break;
      case "action":
        this.props.updateAction(data.name);
        break;
    }
  }

  onLoadEnd(){
    this.focusWindow();
  }

  focusWindow() {
    this.webref && this.webref.injectJavaScript(`document.getElementById('search').focus()`);
  }

  render() {
    return (
      <WebView
        ref={r => (this.webref = r as any)}
        originWhitelist={['*']}
        source={{ html: HTML }}
        onLoadEnd={this.onLoadEnd.bind(this)}
        onMessage={this.onMessage.bind(this)}
      />
    )
  }
}

export default WVInput;
