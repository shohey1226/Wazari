import React, { Component } from "react";
import { View, NativeModules, NativeEventEmitter } from "react-native";
import { WebView } from "react-native-webview";
import { connect } from "react-redux";
import DeviceInfo from "react-native-device-info";
import sVim from "../utils/sVim";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { addNewTab, selectTab, updateSite, closeTab } from "../actions/ui";
import { selectSites } from "../selectors/ui";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  isLoadingSVim: boolean; // state to load local sVim files
  isLoadingJSInjection: boolean; // state to load injectedJS so commands can be used
  isActive: boolean; // active Tab and focused
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  tabNumber: number;
}

class TabWindow extends Component<Props, State, any> {
  webref: WebView | null = null;
  conditionalProps: object = {};
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    this.state = {
      isLoadingSVim: true,
      isActive: false,
      isLoadingJSInjection: true
    };
    this.subscriptions = [];
    if (DeviceInfo.isTablet()) {
      this.conditionalProps.userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15";
    }
  }

  componentDidMount() {
    sVim.init(() => {
      this.setState({ isLoadingSVim: false });
    });
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener(
        "RNBrowserKeyEvent",
        this.handleBrowserActions
      ),
      DAVKeyManagerEmitter.addListener("RNKeyEvent", data => {
        if (this.state.isActive) {
          this.typing(data);
        }
      })
    );
  }

  componentDidUpdate(prevProp) {
    const { backToggled, forwardToggled } = this.props;
    if (prevProp.activeTabIndex !== this.props.activeTabIndex) {
      if (this.props.tabNumber === this.props.activeTabIndex) {
        this.focusWindow();
      } else {
        this.blurWindow();
      }
    }

    if (prevProp.backToggled !== backToggled && this.state.isActive) {
      this.webref.goBack();
    }
    if (prevProp.forwardToggled !== forwardToggled && this.state.isActive) {
      this.webref.goForward();
    }
  }

  focusWindow() {
    this.setState({ isActive: true });
    this.webref && this.webref.injectJavaScript(focusJS);
  }

  blurWindow() {
    this.setState({ isActive: false });
    this.webref &&
      this.webref.injectJavaScript(`document.activeElement.blur();`);
  }

  handleBrowserActions = event => {
    const {
      dispatch,
      activeTabIndex,
      sites,
      isFullScreen,
      browserWidth,
      homePage
    } = this.props;
    if (
      this.webref &&
      this.state.isActive &&
      this.state.isLoadingJSInjection === false
    ) {
      switch (event.action) {
        case "home":
          this.webref.injectJavaScript(`cursorToBeginning()`);
          break;
        case "end":
          this.webref.injectJavaScript(`cursorToEnd()`);
          break;
        case "goBack":
          this.webref.goBack();
          break;
        case "goForward":
          this.webref.goForward();
          break;
        case "newTab":
          dispatch(addNewTab(homePage));
          break;
        case "nextTab":
          let nextIndex =
            activeTabIndex + 1 < sites.length ? activeTabIndex + 1 : 0;
          dispatch(selectTab(nextIndex));
          break;
        case "previousTab":
          let prevIndex =
            0 <= activeTabIndex - 1 ? activeTabIndex - 1 : sites.length - 1;
          dispatch(selectTab(prevIndex));
          break;
        case "reload":
          this.webref.reload();
          break;
        // case "lockScroll":
        //   this.setState({ scrollEnabled: !this.state.scrollEnabled });
        //   break;
        case "hitAHint":
          this.webref.injectJavaScript(`sVimHint.start()`);
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
          dispatch(updateBrowserWidth(parseInt(browserWidth * 0.8)));
          this.rebuildBrowser(activeTabIndex, isFullScreen);
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].reload();
          break;
        case "zoomOut":
          dispatch(updateBrowserWidth(parseInt(browserWidth * 1.2)));
          this.rebuildBrowser(activeTabIndex, isFullScreen);
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].reload();
          break;
        case "closeTab":
          dispatch(closeTab(activeTabIndex));
          let newSites = sites.slice();
          newSites.splice(activeTabIndex, 1);
          if (newSites.length > 0) {
            let focusedIndex = newSites.length - 1;
            dispatch(selectTab(focusedIndex));
          }
          break;
      }
    }
  };

  typing(data) {
    //console.log(data);
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

  onLoadEnd(syntheticEvent) {
    const { nativeEvent } = syntheticEvent;
    const { dispatch, tabNumber, activeTabIndex } = this.props;
    if (tabNumber === activeTabIndex) {
      this.focusWindow();
      dispatch(
        updateSite(
          activeTabIndex,
          nativeEvent.title,
          nativeEvent.url,
          nativeEvent.canGoBack,
          nativeEvent.canGoForward
        )
      );
    }
  }

  onLoadStart(syntheticEvent) {
    this.setState({ isLoadingJSInjection: true });
    const { nativeEvent } = syntheticEvent;
    const { dispatch, tabNumber, activeTabIndex } = this.props;
    if (tabNumber === activeTabIndex) {
      //console.log(this.webref.props.injectedJavaScript);
    }
  }

  onMessage(event) {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    if (!data.isLoading) {
      this.setState({ isLoadingJSInjection: false });
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
          injectedJavaScript={injectingJs
            .replace("SVIM_PREDEFINE", sVim.sVimPredefine)
            .replace("SVIM_GLOBAL", sVim.sVimGlobal)
            .replace("SVIM_HELPER", sVim.sVimHelper)
            .replace("SVIM_TAB", sVim.sVimTab)
            .replace("SVIM_HINT", sVim.sVimHint)}
          {...this.conditionalProps}
        />
      );
    }
  }
}

function mapStateToProps(state, ownProps) {
  // const activeWindow = state.navigation.get("activeWindow");
  // const isFullScreen = state.navigation.get("isFullScreen");
  // const isLandscape = state.navigation.get("isLandscape");
  // const appState = state.navigation.get("appState");
  // const isHelp = state.navigation.get("isHelp");
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activeTabIndex = state.ui.get("activeTabIndex");
  // const isUpdatingUrlForATS = state.browser.get("isUpdatingUrlForATS");
  const sites = selectSites(state);
  const keyMode = state.ui.get("keyMode");
  const backToggled = state.ui.get("backToggled");
  const forwardToggled = state.ui.get("forwardToggled");
  // const {
  //   fontSize: fontSize,
  //   isSecured: isSecured,
  //   browserWidth: browserWidth,
  //   homePage: homePage
  // } = selectCurrentConfig(state);
  return {
    // activeWindow,
    // isHelp,
    backToggled,
    forwardToggled,
    keymap,
    modifiers,
    sites,
    activeTabIndex,
    keyMode
    // fontSize,
    // isFullScreen,
    // isSecured,
    // isUpdatingUrlForATS,
    // appState,
    // browserWidth,
    // isLandscape,
    // homePage
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
  var caretPos = el.selectionStart;  
  var content = el.value;
  el.value = content.substring(0, caretPos);
}


window.ReactNativeWebView.postMessage(JSON.stringify({isLoading: false}))

true
`;

const focusJS = `
setTimeout(function(){
  var input = document.createElement("input");
  input.type = "text";  
  input.style.position = "absolute";
  input.style.top = window.pageYOffset + 'px';
  document.body.appendChild(input);
  input.focus();
  input.blur();
  input.setAttribute("style", "display:none");
  delete input;
}, 500);
`;
