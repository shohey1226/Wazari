import React, { Component } from "react";
import {
  View,
  NativeModules,
  NativeEventEmitter,
  Clipboard,
  Platform
} from "react-native";
import { WebView } from "react-native-webview";
import { connect } from "react-redux";
import DeviceInfo from "react-native-device-info";
import Loader from "../components/Loader";
import Error from "../components/Error";
import sVim from "../utils/sVim";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import {
  addNewTab,
  selectTab,
  updateSite,
  closeTab,
  updateKeySwitch
} from "../actions/ui";
import { addHistory } from "../actions/user";
import { selectSites, selectActiveUrl } from "../selectors/ui";
import { KeyMode } from "../types/index.d";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  isLoadingSVim: boolean; // state to load local sVim files
  isLoadingJSInjection: boolean; // state to load injectedJS so commands can be used
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  tabNumber: number;
  keyMode: KeyMode;
  backToggled: boolean;
  forwardToggled: boolean;
  reloadToggled: boolean;
  excludedPatterns: Array<string>;
  keySwitchOn: boolean;
  activeUrl: string;
  isActive: boolean;
}

class TabWindow extends Component<Props, State, any> {
  webref: WebView | null = null;
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    this.state = {
      isLoadingSVim: true,
      isLoadingJSInjection: true,
      userAgent: DeviceInfo.isTablet()
        ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15"
        : null
    };
    this.subscriptions = [];
  }

  componentDidMount() {
    const { isActive } = this.props;
    sVim.init(() => {
      this.setState({ isLoadingSVim: false });
    });
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener(
        "RNBrowserKeyEvent",
        this.handleBrowserActions
      ),
      DAVKeyManagerEmitter.addListener("RNKeyEvent", data => {
        if (this.props.keyMode === KeyMode.Terminal) {
          this.typing(data);
        } else if (this.props.keyMode === KeyMode.Text) {
          this.textTyping(data);
        }
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  componentDidUpdate(prevProp) {
    const {
      backToggled,
      forwardToggled,
      reloadToggled,
      keyMode,
      focusedPane,
      activeUrl,
      keySwitchOn,
      isActive
    } = this.props;

    // tab is chagned
    if (prevProp.isActive !== isActive) {
      if (isActive) {
        this.focusWindow();
        if (activeUrl !== prevProp.activeUrl) {
          this.setSwitch(activeUrl);
        }
      } else {
        this.blurWindow();
      }
    }

    // toggle back and forward buttons
    if (prevProp.backToggled !== backToggled && isActive) {
      this.webref && this.webref.goBack();
    }
    if (prevProp.forwardToggled !== forwardToggled && isActive) {
      this.webref && this.webref.goForward();
    }
    if (prevProp.reloadToggled !== reloadToggled && isActive) {
      this.webref && this.webref.reload();
    }

    // focused pane is changed to browser
    if (
      isActive &&
      prevProp.focusedPane !== focusedPane &&
      focusedPane === "browser"
    ) {
      this.focusWindow();
    }
  }

  setSwitch(url) {
    const { excludedPatterns, dispatch, keyMode, keySwitchOn } = this.props;
    let switchOn = true;
    let pattern: string | null = null;
    for (let p of excludedPatterns) {
      let regex = new RegExp(p);
      if (regex.test(url)) {
        switchOn = false;
        pattern = p;
        break;
      }
    }
    keySwitchOn !== switchOn && dispatch(updateKeySwitch(switchOn));
  }

  focusWindow() {
    this.webref && this.webref.injectJavaScript(focusJS);
  }

  blurWindow() {
    this.webref &&
      this.webref.injectJavaScript(`document.activeElement.blur();`);
  }

  handleBrowserActions = async event => {
    const { dispatch, keyMode, isActive } = this.props;
    if (
      (keyMode === KeyMode.Terminal || keyMode === KeyMode.Text) &&
      this.webref &&
      isActive &&
      this.state.isLoadingJSInjection === false
    ) {
      console.log("action at tabwindow", event);
      switch (event.action) {
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
        case "goBack":
          this.webref.goBack();
          break;
        case "goForward":
          this.webref.goForward();
          break;
        case "reload":
          this.webref.reload();
          break;
        case "hitAHint":
          this.webref.injectJavaScript(`sVimHint.start()`);
          this.webref.injectJavaScript(`document.activeElement.blur();`);
          break;
        case "scrollDown":
          this.webref.injectJavaScript(`sVimTab.commands.scrollDown()`);
          break;
        case "scrollUp":
          this.webref.injectJavaScript(`sVimTab.commands.scrollUp()`);
          break;
        case "deleteLine":
          this.webref.injectJavaScript(`deleteLine()`);
          break;
        case "zoomIn":
          this.webref.injectJavaScript(`sVimTab.commands.zoomPageIn()`);
          break;
        case "zoomOut":
          this.webref.injectJavaScript(`sVimTab.commands.zoomPageOut()`);
          break;
        case "copy":
          this.webref.injectJavaScript(`copyToRN()`);
          break;
        case "paste":
          let content = await Clipboard.getString();
          this.webref.injectJavaScript(`pasteFromRN("${content}")`);
          break;
      }
    }
  };

  typing(data) {
    const { isActive } = this.props;
    if (isActive) {
      console.log("terminal input", data);
      let charCode;
      let modifiers = Object.assign({}, data.modifiers);
      switch (data.key) {
        case "Backspace":
          charCode = 8;
          break;
        case "Return":
          charCode = 13;
          break;
        case "Tab":
          charCode = 9;
          break;
        case "Esc":
          charCode = 27;
          break;
        case "Up":
          charCode = "P".charCodeAt(0);
          modifiers.ctrlKey = true;
          break;
        case "Down":
          charCode = "N".charCodeAt(0);
          modifiers.ctrlKey = true;
          break;
        case "Left":
          charCode = "B".charCodeAt(0);
          modifiers.ctrlKey = true;
          break;
        case "Right":
          charCode = "F".charCodeAt(0);
          modifiers.ctrlKey = true;
          break;
        default:
          charCode = data.key.charCodeAt(0);
      }

      // if (modifiers.ctrlKey) {
      //   charCode = data.key.toUpperCase().charCodeAt(0);
      // }

      // handle shift key to make it Uppercase
      if (modifiers.shiftKey) {
        if (data.key.match(/[a-z]/)) {
          charCode = data.key.toUpperCase().charCodeAt(0);
        }
      }

      const modifiersStr = JSON.stringify(modifiers);

      if (
        32 <= charCode &&
        charCode < 128 &&
        !modifiers.ctrlKey &&
        !modifiers.altKey &&
        !modifiers.metaKey
      ) {
        this.webref.injectJavaScript(
          `simulateKeyPress(window.term.textarea, ${charCode}, '${modifiersStr}')`
        );
      } else {
        this.webref.injectJavaScript(
          `simulateKeyDown(window.term.textarea, ${charCode}, '${modifiersStr}')`
        );
      }
    }
  }

  textTyping(data) {
    const { isActive } = this.props;

    if (isActive) {
      console.log(data);

      // handle shift key to make it Uppercase
      if (data.modifiers.shiftKey) {
        if (data.key.match(/[a-z]/)) {
          data.key = data.key.toUpperCase();
        }
      }

      // dealing with some exception
      if (data.key === "\\") {
        data.key = "\\\\";
      } else if (data.key === String.fromCharCode(39)) {
        this.webref.injectJavaScript(`typingFromRN("'")`);
        return;
      }

      switch (data.key) {
        case "Esc":
          this.webref.injectJavaScript(`document.activeElement.blur();`);
          break;
        case "Backspace":
          this.webref.injectJavaScript(`deletePreviousChar()`);
          break;
        case "Left":
          this.webref.injectJavaScript(`moveBackOneChar()`);
          break;
        case "Right":
          this.webref.injectJavaScript(`moveForwardOneChar()`);
          break;
        case "Up":
          return;
        case "Down":
          return;
        default:
          this.webref.injectJavaScript(`typingFromRN('${data.key}')`);

          // From iOS13, keyevent is not listening and need to dispatch by ourselves
          const majorVersionIOS = parseInt(Platform.Version, 10);
          if (majorVersionIOS >= 13) {
            let charCode = data.key.charCodeAt(0);
            switch (data.key) {
              case "Backspace":
                charCode = 8;
                break;
              case "Return":
                charCode = 13;
                break;
              case "Tab":
                charCode = 9;
                break;
              case "Esc":
                charCode = 27;
                break;
            }

            this.webref.injectJavaScript(
              `dispatchKeyEventForHints(${charCode})`
            );
          }
      }
    }
  }

  onLoadEnd(syntheticEvent) {
    const { nativeEvent } = syntheticEvent;
    const {
      dispatch,
      tabNumber,
      activeTabIndex,
      paneId,
      isActive
    } = this.props;
    if (isActive) {
      dispatch(
        updateSite(
          activeTabIndex,
          nativeEvent.title,
          nativeEvent.url,
          nativeEvent.canGoBack,
          nativeEvent.canGoForward,
          paneId
        )
      );
      this.focusWindow();
      dispatch(addHistory(nativeEvent.url, nativeEvent.title));
    }
  }

  onLoadStart(syntheticEvent) {
    this.setState({ isLoadingJSInjection: true });
    const { nativeEvent } = syntheticEvent;
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "jsloading":
        if (!data.isLoading) {
          this.setState({ isLoadingJSInjection: false });
        }
        break;
      case "copy":
        Clipboard.setString(data.selection);
        break;
    }
  }

  onNavigationStateChange(event) {
    //const { dispatch, activeTabIndex } = this.props;
  }

  render() {
    const { url } = this.props;
    if (this.state.isLoadingSVim) {
      return <View />;
    } else {
      return (
        <WebView
          ref={r => (this.webref = r as any)}
          source={{ uri: url }}
          keyboardDisplayRequiresUserAction={false}
          sharedCookiesEnabled={true}
          useWebKit={true}
          hideKeyboardAccessoryView={true}
          onLoadStart={this.onLoadStart.bind(this)}
          onLoadEnd={this.onLoadEnd.bind(this)}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onMessage={this.onMessage.bind(this)}
          renderLoading={() => <Loader />}
          renderError={errorName => <Error name={errorName} />}
          startInLoadingState={true}
          decelerationRate="fast"
          injectedJavaScript={injectingJs
            .replace("SVIM_PREDEFINE", sVim.sVimPredefine)
            .replace("SVIM_GLOBAL", sVim.sVimGlobal)
            .replace("SVIM_HELPER", sVim.sVimHelper)
            .replace("SVIM_TAB", sVim.sVimTab)
            .replace("SVIM_HINT", sVim.sVimHint)}
          userAgent={this.state.userAgent}
        />
      );
    }
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activePaneId = state.ui.get("activePaneId");
  const activeUrl = selectActiveUrl(state, activePaneId);
  const focusedPane = state.ui.get("focusedPane");
  const backToggled = state.ui.get("backToggled");
  const forwardToggled = state.ui.get("forwardToggled");
  const reloadToggled = state.ui.get("reloadToggled");
  const keySwitchOn = state.ui.get("keySwitchOn");
  const excludedPatterns = state.user.get("excludedPatterns").toArray();
  return {
    backToggled,
    forwardToggled,
    reloadToggled,
    keymap,
    modifiers,
    focusedPane,
    excludedPatterns,
    activeUrl,
    keySwitchOn
  };
}

export default connect(mapStateToProps)(TabWindow);

let injectingJs = `

SVIM_PREDEFINE
SVIM_HELPER
SVIM_TAB
SVIM_GLOBAL
SVIM_HINT
sVimTab.bind();

function simulateKeyPress(element, charCode, modifiers) {
  var modifierObjects = JSON.parse(modifiers);
  var event = {};  
  event.charCode = charCode  
  event.key = event.char = String.fromCharCode(charCode);
  for (var i in modifierObjects) {
    event[i] = modifierObjects[i];
  }  
  var keyEvent = new KeyboardEvent("keypress", event); 
  element.dispatchEvent(keyEvent)
}   

function simulateKeyDown(element, keyCode, modifiers) {
  var modifierObjects = JSON.parse(modifiers);
  var event = {};
  event.key = event.char = String.fromCharCode(keyCode);  
  event.keyCode = event.code = event.key.toUpperCase().charCodeAt(0);
  for (var i in modifierObjects) {
    event[i] = modifierObjects[i];
  }  
  var keyEvent = new KeyboardEvent("keydown", event); 
  element.dispatchEvent(keyEvent)
}   

function cursorToBeginning(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
  if (inp.createTextRange) {
    var part = inp.createTextRange();
    part.move("character", 0);
    part.select();
  } else if (inp.setSelectionRange) {
    inp.setSelectionRange(0, 0);
  }  
}

function cursorToEnd(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
  if (inp.createTextRange) {
    var part = inp.createTextRange();
    part.move("character", inp.value.length);
    part.select();
  } else if (inp.setSelectionRange) {
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }  
}

function deleteLine(){
  var el = document.activeElement;  
  if(!el.value){
    return
  }  
  var caretPos = el.selectionStart;  
  var content = el.value;
  el.value = content.substring(0, caretPos);
}

function deletePreviousChar(){
  var el = document.activeElement;
  if(!el.value){
    return
  }  
  var caretPosStart = el.selectionStart;    
  var caretPosEnd = el.selectionEnd;
  var content = el.value;
  if(caretPosStart > 0){
    el.value = content.substring(0, caretPosStart-1) + content.substring(caretPosEnd, content.length);
    el.setSelectionRange(caretPosStart - 1, caretPosStart - 1);
  }
}

function deleteNextChar(){
  var el = document.activeElement;
  if(!el.value){
    return
  }  
  var caretPosStart = el.selectionStart;
  var caretPosEnd = el.selectionEnd;
  var content = el.value;
  if(caretPosEnd < content.length){
    el.value = content.substring(0, caretPosStart) + content.substring(caretPosEnd+1, content.length);
    el.setSelectionRange(caretPosStart, caretPosStart);
  }
}

function moveBackOneChar(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
  var caretPos = inp.selectionStart;  
  if(caretPos > 0){
    if (inp.createTextRange) {
      var part = inp.createTextRange();
      part.move("character", caretPos-1);
      part.select();
    } else if (inp.setSelectionRange) {
      inp.setSelectionRange(caretPos-1, caretPos-1);
    }
  }
}

function moveForwardOneChar(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }
  var caretPos = inp.selectionStart;  
  if(caretPos < inp.value.length){
    if (inp.createTextRange) {
      var part = inp.createTextRange();
      part.move("character", caretPos+1);
      part.select();
    } else if (inp.setSelectionRange) {
      inp.setSelectionRange(caretPos+1, caretPos+1);
    }
  }
}

function copyToRN() {
  var selObj = window.getSelection(); 
  var selectedText = selObj.toString();
  window.ReactNativeWebView.postMessage(JSON.stringify({selection: selectedText, postFor: "copy"}));
}

function pasteFromRN(content) {
  var el = document.activeElement;   
  var value = el.value;    
  el.value = value + content;
}

function typingFromRN(key){
  var el = document.activeElement;
  var value = el.value;    
  el.value = value + key;
}

function dispatchKeyEventForHints(charCode){
  sVimTab.mode === "hint" && simulateKeyDown(document, charCode, null);
}

window.ReactNativeWebView.postMessage(JSON.stringify({isLoading: false, postFor: "jsloading"}))

true
`;

// specify 16px fontSize not to zoom in.
const focusJS = `
setTimeout(function(){
  if (/^https:\\/\\/www\\.wazaterm\\.com\\/terminals\\/\\S+/.test(window.location.href)){
    window.term.focus()
  }else{
    var input = document.createElement("input");
    input.type = "text";  
    input.style.position = "absolute";
    input.style.fontSize = "16px";
    input.style.top = window.pageYOffset + 'px';
    document.body.appendChild(input);
    input.focus();
    input.blur();
    input.setAttribute("style", "display:none");
    delete input;
  }
}, 500);
`;
