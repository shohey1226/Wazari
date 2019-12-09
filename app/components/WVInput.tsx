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
var search = document.getElementById('search')
search.addEventListener('keydown', function(e){
  var keyObj = {
    key: e.key,
    keyCode: e.keyCode,
    code: e.code,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    metaKey: e.metaKey,
  }  
  window.ReactNativeWebView.postMessage(JSON.stringify({keyEvent: keyObj, postFor: "keydown"}))
});

search.addEventListener('keyup', function(e){
  window.ReactNativeWebView.postMessage(JSON.stringify({inputValue: this.value, postFor: "keyup"}))  
});


search.addEventListener('keypress', function(e){
  if(e.target.value && (e.keyCode >= 97 && e.keyCode <= 122 && e.shiftKey || e.keyCode >= 65 && e.keyCode <= 90 && !e.shiftKey)) {
    window.ReactNativeWebView.postMessage(JSON.stringify({capsLockOn: true, postFor: "capsLock"}))  
  }else{
    window.ReactNativeWebView.postMessage(JSON.stringify({capsLockOn: false, postFor: "capsLock"}))  
  }
});

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
      case "keydown":    
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
