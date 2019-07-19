import React, { Component } from "react";
import { View, NativeModules, NativeEventEmitter } from "react-native";
import { WebView } from "react-native-webview";
import { connect } from "react-redux";
import sVim from "../utils/sVim";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface IState {
  isLoading: boolean;
  isActive: boolean;
}

class Window extends Component<{}, IState, any> {
  webref: WebView | null = null;

  constructor(props) {
    super(props);
    this.state = { isLoading: true, isActive: false };
    this.subscriptions = [];
  }

  componentDidMount() {
    sVim.init(() => {
      this.setState({ isLoading: false });
    });
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener(
        "RNBrowserKeyEvent",
        this.handleBrowserActions
      )
    );

    // setTimeout(() => {
    //   this.webref !== null && this.webref.injectJavaScript(`sVimHint.start()`);
    // }, 3000);
  }

  componentDidUpdate(prevProp) {
    if (prevProp.activeTabIndex !== this.props.activeTabIndex)
      if (this.props.tabNumber === this.props.activeTabIndex) {
        this.setState({ isActive: true });
        this.webref.injectJavaScript(focusJS);
      } else {
        this.setState({ isActive: false });
      }
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
    if (this.state.isActive) {
      switch (event.action) {
        case "goBack":
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].goBack();
          break;
        case "goForward":
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].goForward();
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
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].reload();
          break;
        case "lockScroll":
          this.setState({ scrollEnabled: !this.state.scrollEnabled });
          this.rebuildBrowser(activeTabIndex, isFullScreen);
          break;
        case "hitAHint":
          // this.props.activeTabIndex === this.props.tabNumber &&
          //   console.log(this.props.tabNumber, this.props.activeTabIndex);
          this.webref !== null &&
            this.webref.injectJavaScript(`sVimHint.start()`);
          break;
        case "scrollDown":
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].evaluateJavaScript(
              "receivedScrollDownFromReactNative()"
            );
          break;
        case "scrollUp":
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].evaluateJavaScript(
              "receivedScrollUpFromReactNative()"
            );
          break;
        case "find":
          if (this.state.isSearchVisiable === true) {
            this._backToNormal();
            this._browserRefs[activeTabIndex] &&
              this._browserRefs[activeTabIndex].evaluateJavaScript(
                `receivedFocusFromReactNative()`
              );
          } else {
            this.setState({ isSearchVisiable: true });
            this.refs.search.focus();
          }
          break;
        case "deleteLine":
          this._browserRefs[activeTabIndex] &&
            this._browserRefs[activeTabIndex].evaluateJavaScript(
              "receivedDeleteLineFromReactNative()"
            );
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

  render() {
    const { url } = this.props;
    if (this.state.isLoading) {
      return <View />;
    } else {
      return (
        <WebView
          ref={r => (this.webref = r as any)}
          source={{ uri: url }}
          keyboardDisplayRequiresUser={false}
          hideKeyboardAccessoryView={true}
          injectedJavaScript={injectingJs
            .replace("SVIM_PREDEFINE", sVim.sVimPredefine)
            .replace("SVIM_GLOBAL", sVim.sVimGlobal)
            .replace("SVIM_HELPER", sVim.sVimHelper)
            .replace("SVIM_TAB", sVim.sVimTab)
            .replace("SVIM_HINT", sVim.sVimHint)}
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
  // const sites = selectSites(state);
  // const {
  //   fontSize: fontSize,
  //   isSecured: isSecured,
  //   browserWidth: browserWidth,
  //   homePage: homePage
  // } = selectCurrentConfig(state);
  return {
    // activeWindow,
    // isHelp,
    keymap,
    modifiers,
    // sites,
    activeTabIndex
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

export default connect(mapStateToProps)(Window);

let injectingJs = `
SVIM_PREDEFINE
SVIM_HELPER
SVIM_TAB
SVIM_GLOBAL
SVIM_HINT
sVimTab.bind();

window.receivedHitAHintFromReactNative = function() {
  sVimHint.start();
}
window.receivedScrollDownFromReactNative = function() {
  sVimTab.commands.scrollDown();
}
window.receivedScrollUpFromReactNative = function() {
  sVimTab.commands.scrollUp();
}
true
`;

const focusJS = `
setTimeout(function(){
  var input = document.createElement("input");
  input.type = "text";
  input.style.position = "absolute";
  input.style.top = window.pageYOffset + screen.height*BROWSER_SCALE + 'px';
  document.body.appendChild(input);
  input.focus();
  input.blur();
  input.setAttribute("style", "display:none");
  delete input;
}, 5);
`;
