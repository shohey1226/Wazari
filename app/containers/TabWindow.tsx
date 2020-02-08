import React, { Component } from "react";
import {
  View,
  NativeModules,
  NativeEventEmitter,
  Clipboard,
  Platform,
  Dimensions,
  AppState
} from "react-native";
import { WebView } from "react-native-webview";
import { connect } from "react-redux";
import DeviceInfo from "react-native-device-info";
import ProgressBarAnimated from "react-native-progress-bar-animated";
import { isEqual } from "lodash";
import Loader from "../components/Loader";
import Error from "../components/Error";
import WVTerm from "../components/WVTerm";
import sVim from "../utils/sVim";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import {
  addNewTab,
  selectTab,
  updateSite,
  closeTab,
  updateWordsForPageFind,
  updateCapslock,
  toggleSoftCapslock,
  updateWidth
} from "../actions/ui";
import { addHistory } from "../actions/user";
import { selectSites, selectActiveUrl } from "../selectors/ui";
import { CapslockState } from "../types/index.d";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  isLoadingSVim: boolean; // state to load local sVim files
  isLoadingJSInjection: boolean; // state to load injectedJS so commands can be used
  width: number;
  progress: number;
  userAgent: string | null;
  isCapsLockRemapped: boolean;
  nextAppState: string;
  capslockState: CapslockState;
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  backToggled: boolean;
  forwardToggled: boolean;
  reloadToggled: boolean;
  activeUrl: string;
  isActive: boolean;
  isCapsLockOn: boolean;
  isSoftCapslockOn: boolean;
  paneId: string;
  currentWidth: number;
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1";

class TabWindow extends Component<Props, State, any> {
  webref: WebView | null = null;
  subscriptions: Array<any> = [];
  down: any = {};
  isNativeCapslock: boolean = false;
  lastKeyTimestamp: number | null = null;

  constructor(props) {
    super(props);
    let { height, width } = Dimensions.get("window");
    let _ua: string = USER_AGENT;
    if (props.currentWidth && props.currentWidth < 415) {
      _ua = IPHONE_UA;
    }
    this.state = {
      isLoadingSVim: true,
      isLoadingJSInjection: true,
      width: width,
      progress: 0,
      userAgent: _ua,
      isCapsLockRemapped: props.modifiers["capslockKey"] !== "capslockKey",
      isCapsLockOn: false
    };
    this.subscriptions = [];
  }

  componentDidMount() {
    const { isActive, dispatch, isSoftCapslockOn, capslockState } = this.props;
    sVim.init(() => {
      this.setState({ isLoadingSVim: false });
    });
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions),
      DAVKeyManagerEmitter.addListener("modKeyPress", data => {
        console.log("RN: ModsFromNative", data);
        switch (data.name) {
          case "mods-down":
            if (data.flags === 262144) {
              // UIKeycommand(Native) to RN and use down object to detect simaltanous keys.
              // handle control key. Looks it's not required after UIKeycommand is set..
              this.down["Control"] = true;
              this.handleKeys({
                key: "Control",
                type: "keydown",
                modifiers: {
                  shiftKey: false,
                  metaKey: false,
                  altKey: false,
                  ctrlKey: true
                }
              });
            } else {
              this.handleCapsLockFromNative(true);
            }
            break;
          case "mods-up":
            //this.handleCapsLockFromNative(false);
            break;
        }
      })
    );

    AppState.addEventListener("change", this._handleAppStateChange);
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => {
      subscription.remove();
    });
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = nextAppState => {
    const { isActive } = this.props;
    // pass over app state to WVTerm
    this.setState({ nextAppState: nextAppState });

    if (nextAppState === "active") {
      if (isActive) {
        this.focusWindow();
      } else {
        this.blurWindow();
      }
    }
  };

  componentDidUpdate(prevProp) {
    const {
      dispatch,
      backToggled,
      forwardToggled,
      reloadToggled,
      focusedPane,
      activeUrl,
      isActive,
      activePaneId,
      wordsForPageFind,
      isSoftCapslockOn,
      currentWidth
    } = this.props;

    // tab is chagned
    if (
      prevProp.isActive !== isActive ||
      prevProp.activePaneId !== activePaneId
    ) {
      if (isActive) {
        this.focusWindow();
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

    if (
      isActive &&
      wordsForPageFind !== "" &&
      wordsForPageFind !== prevProp.wordsForPageFind
    ) {
      this.webref.injectJavaScript(`findInPage("${wordsForPageFind}")`);
      dispatch(updateWordsForPageFind(""));
      this.focusWindow();
    }
  }

  // RN JS(Webview) -> RN -> Native(iOS) -> RN handling both keydown/up
  handleCapsLockFromNative(isDown) {
    if (isDown) {
      this.down["CapsLock"] = true;
      this.isNativeCapslock = true;
      this.handleKeys({
        key: "CapsLock",
        type: "keydown",
        modifiers: {
          shiftKey: false,
          metaKey: false,
          altKey: false,
          ctrlKey: false
        }
      });
    } else {
      this.down["CapsLock"] && delete this.down["CapsLock"];
    }
  }

  handleKeys(keyEvent) {
    const { modifiers, browserKeymap, isSoftCapslockOn, dispatch } = this.props;

    console.log("down", this.down);

    const pressedKeys = Object.keys(this.down);
    const _isCapslockRemappedFrom =
      Object.values(modifiers).indexOf("capslockKey") > -1;
    const modMap = {
      ctrlKey: "Control",
      altKey: "Alt",
      shiftKey: "Shift",
      metaKey: "Meta"
    };

    // customized modifiers
    const origMods = keyEvent.modifiers;
    let newMods = Object.assign({}, origMods);
    Object.keys(origMods).forEach(k => {
      if (modifiers[k]) {
        newMods[k] = newMods[k] || origMods[modifiers[k]];
      }
    });

    // capslock handling
    newMods["capslockKey"] = false;
    if (this.state.isCapsLockRemapped) {
      // if rempapped, capslockKey is never becoming "on"
      newMods[modifiers.capslockKey] =
        newMods[modifiers.capslockKey] || "CapsLock" in this.down;
    } else {
      newMods["capslockKey"] = "CapsLock" in this.down;
    }

    if (_isCapslockRemappedFrom) {
      if (keyEvent.type === "keydown") {
        Object.keys(modifiers).forEach(m => {
          if (modifiers[m] === "capslockKey" && modMap[m] in this.down) {
            dispatch(toggleSoftCapslock());
          }
        });
      }
    }

    let hasAction = false;
    pressedKeys
      .filter(k => k.length === 1)
      .forEach(key => {
        Object.keys(browserKeymap).forEach(action => {
          const keymap = browserKeymap[action];
          // console.log(
          //   "origMods and newMods and keymap",
          //   origMods,
          //   newMods,
          //   keymap.modifiers
          // );
          // always comparing to lowercase of the input key
          if (
            isEqual(keymap.modifiers, newMods) &&
            keymap.key === key.toLowerCase()
          ) {
            //console.log("executing actin: ", action);
            this.handleAction(action);
            hasAction = true;

            // handle keyup
            if (
              this.state.isCapsLockRemapped &&
              this.down["CapsLock"] &&
              this.isNativeCapslock === false
            ) {
              if (/^[dhjklobfnpwxy]$/.test(key.toLowerCase())) {
                const now = new Date().getTime();
                if (
                  this.lastKeyTimestamp &&
                  now - this.lastKeyTimestamp > 500
                ) {
                  delete this.down["CapsLock"]; // keyup
                }
                this.lastKeyTimestamp = now;
              } else {
                delete this.down["CapsLock"]; // keyup
              }
            }
          }
        });
      });

    if (!hasAction && this.state.isCapsLockRemapped) {
      if (/^[A-Za-z]$/.test(keyEvent.key) && keyEvent.type === "keydown") {
        let inputKey =
          isSoftCapslockOn === true || this.down["Shift"] === true
            ? keyEvent.key.toUpperCase()
            : keyEvent.key.toLowerCase();

        this.webref.injectJavaScript(`updateInputValue("${inputKey}")`);
      }
    }
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
    if (this.state.isCapsLockRemapped) {
      let mods = 0;
      if (type === "keyup") {
        mods = 0;
      } else {
        mods = this.toUIKitFlags(keyEvent);
        this.handleKeys(keyEvent);
      }
      DAVKeyManager.setMods(mods);
    }
  }

  handleSoftwareCapsLock(keyEvent) {
    // const { modifiers, updateCapsLockState } = this.props;
    // Object.keys(modifiers)
    //   .filter(m => modifiers[m] === "capslockKey")
    //   .forEach(m => {
    //     if (keyEvent[m] === true) {
    //       updateCapsLockState(!this.state.isCapsLockOn);
    //       this.setState({ isCapsLockOn: !this.state.isCapsLockOn });
    //     }
    //   });
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
      case "deleteLine":
        this.webref.injectJavaScript(`deleteLine()`);
        break;
      case "copy":
        this.webref.injectJavaScript(`copyToRN()`);
        break;
      case "paste":
        this._getContent();
        break;
    }
  }

  async _getContent() {
    var content = await Clipboard.getString();
    this.webref && this.webref.injectJavaScript(`pasteFromRN("${content}")`);
  }

  focusWindow() {
    const { isSoftCapslockOn, dispatch, capslockState } = this.props;

    this.webref && this.webref.injectJavaScript(focusJS);
    this.down = {};

    const _capsState =
      isSoftCapslockOn === true ? CapslockState.SoftOn : CapslockState.SoftOff;
    if (capslockState !== _capsState) {
      dispatch(updateCapslock(_capsState));
    }
  }

  blurWindow() {
    const { dispatch, isSoftCapslockOn } = this.props;
    this.down = {};
    this.webref &&
      this.webref.injectJavaScript(`document.activeElement.blur();`);

    const _capsState =
      isSoftCapslockOn === true ? CapslockState.SoftOn : CapslockState.SoftOff;
    dispatch(updateCapslock(_capsState));
  }

  handleAppActions = async event => {
    const { dispatch, isActive } = this.props;
    if (this.webref && isActive && this.state.isLoadingJSInjection === false) {
      switch (event.action) {
        case "hitAHint":
          this.webref.injectJavaScript(`sVimHint.start()`);
          this.webref.injectJavaScript(`document.activeElement.blur();`);
          break;
        case "hitAHintOpeningNewTab":
          this.webref.injectJavaScript(`hitAHintOpeningNewTab()`);
          this.webref.injectJavaScript(`document.activeElement.blur();`);
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
        case "zoomIn":
          break;
        case "zoomOut":
          this.webref.injectJavaScript(`sVimTab.commands.zoomPageOut()`);
          break;
      }
    }
  };

  toggleCapslock() {
    const { dispatch } = this.props;
    dispatch(toggleSoftCapslock());
  }

  onLoadEnd(syntheticEvent) {
    const { nativeEvent } = syntheticEvent;
    const {
      dispatch,
      activeTabIndex,
      paneId,
      isActive,
      modifiers
    } = this.props;

    if (isActive && nativeEvent.url) {
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
      this.webref.injectJavaScript(
        `loadModifers(${JSON.stringify(modifiers)})`
      );
    }

    let initStr = JSON.stringify({
      isCapsLockRemapped: this.state.isCapsLockRemapped
    });
    console.log(initStr);
    this.webref.injectJavaScript(`init('${initStr}')`);
  }

  onLoadStart(syntheticEvent) {
    this.setState({ isLoadingJSInjection: true });
    //const { nativeEvent } = syntheticEvent;
  }

  onJSLoaded() {
    this.setState({ isLoadingJSInjection: false });
  }

  onMessage(event) {
    const { dispatch, sites, capslockState, isSoftCapslockOn } = this.props;
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    switch (data.postFor) {
      case "jsloading":
        if (!data.isLoading) {
          this.setState({ isLoadingJSInjection: false });
        }
        break;
      case "copy":
        if (data.selection && data.selection !== "") {
          Clipboard.setString(data.selection);
        }
        break;
      case "openNewTab":
        dispatch(addNewTab(data.url));
        setTimeout(() => {
          dispatch(selectTab(sites.length));
        }, 500);
        break;
      case "keydown":
        this.down[data.keyEvent.key] = true;

        console.log("keydown", this.down);
        if (data.keyEvent.key === "CapsLock") {
          this.isNativeCapslock = false;
          this.lastKeyTimestamp = new Date().getTime(); // need first press
          this.handleCapsLockFromJS("keydown", data.keyEvent);
        } else {
          this.handleKeys(data.keyEvent);
        }
        this.handleSoftwareCapsLock(data.keyEvent);
        break;

      case "keyup":
        if (data.keyEvent.key === "CapsLock") {
          this.handleCapsLockFromJS("keyup", data.keyEvent);
          console.log("capslock - keyup for keydown", this.down);
        } else if (data.keyEvent.key === "Meta") {
          // Meta+key doesn't fire key up event..
          this.down = {};
        }
        this.down[data.keyEvent.key] && delete this.down[data.keyEvent.key];
        break;

      case "capslock":
        if (
          data.key === "Enter" ||
          data.key === "Escape" ||
          data.key === "Tab"
        ) {
          // revert capslock from state
          const _capsState =
            isSoftCapslockOn === true
              ? CapslockState.SoftOn
              : CapslockState.SoftOff;
          dispatch(updateCapslock(_capsState));
        } else {
          if (data.isCapslockOn) {
            capslockState !== CapslockState.hardOn &&
              dispatch(updateCapslock(CapslockState.hardOn));
          } else {
            capslockState !== CapslockState.hardOff &&
              dispatch(updateCapslock(CapslockState.hardOff));
          }
        }
        break;
    }
  }

  onNavigationStateChange(event) {
    //const { dispatch, activeTabIndex } = this.props;
  }

  renderBody() {
    const { tabId, url } = this.props;
    //console.log("renderTerminal url", url);
    if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+$/.test(url)) {
      return (
        <WVTerm
          key={`tab-${tabId}`}
          tabLabel={{
            label: "",
            id: tabId,
            onPressButton: () => this.pressCloseTab(tabId)
          }}
          url={url}
          tabId={tabId}
          nextAppState={this.state.nextAppState}
          toggleSoftCapslock={this.toggleCapslock.bind(this)}
          {...this.props}
          onLoadStart={this.onLoadStart.bind(this)}
          onJSLoaded={this.onJSLoaded.bind(this)}
          onLoadProgress={({ nativeEvent }) => {
            this.setState({ progress: nativeEvent.progress * 100 });
          }}
        />
      );
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
          onLoadProgress={({ nativeEvent }) => {
            this.setState({ progress: nativeEvent.progress * 100 });
          }}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onMessage={this.onMessage.bind(this)}
          renderLoading={() => <Loader />}
          renderError={errorName => <Error name={errorName} />}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
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

  onChangeLayout(event) {
    const { dispatch, paneId, currentWidth } = this.props;
    let { x, y, width, height } = event.nativeEvent.layout;
    if (currentWidth !== width) {
      dispatch(updateWidth(paneId, width));
    }
  }

  render() {
    const { url, tabId } = this.props;
    const progressCustomStyles = {
      borderRadius: 0
    };
    if (this.state.isLoadingSVim) {
      return <View />;
    } else {
      return (
        <View style={{ flex: 1 }} onLayout={this.onChangeLayout.bind(this)}>
          {this.state.isLoadingJSInjection ? (
            <ProgressBarAnimated
              {...progressCustomStyles}
              height={3}
              borderWidth={0}
              value={this.state.progress}
              width={this.state.width}
            />
          ) : null}
          {this.renderBody()}
        </View>
      );
    }
  }
}

function mapStateToProps(state, ownProps) {
  const browserKeymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activePaneId = state.ui.get("activePaneId");
  const activeUrl = selectActiveUrl(state, activePaneId);
  const focusedPane = state.ui.get("focusedPane");
  const backToggled = state.ui.get("backToggled");
  const forwardToggled = state.ui.get("forwardToggled");
  const reloadToggled = state.ui.get("reloadToggled");
  const wordsForPageFind = state.ui.get("wordsForPageFind");
  const capslockState = state.ui.get("capslockState");
  const isSoftCapslockOn = state.ui.get("isSoftCapslockOn");
  const sites = selectSites(state, ownProps.paneId);
  const activeTabIndex = state.ui.getIn([
    "panes",
    ownProps.paneId,
    "activeTabIndex"
  ]);
  const _isActivePane = activePaneId === ownProps.paneId;
  //console.log(sites, activeTabIndex);
  const isActive = sites[activeTabIndex].id === ownProps.tabId && _isActivePane;
  // maybe there is better way to deal with this.
  let url = ownProps.url;
  for (let i = 0; i < sites.length; i++) {
    if (sites[i].id === ownProps.tabId) {
      url = sites[i].url;
      break;
    }
  }

  const widthMap = state.ui.get("widthMap");
  const currentWidth = widthMap ? widthMap.get(ownProps.paneId) : null;

  return {
    backToggled,
    forwardToggled,
    reloadToggled,
    browserKeymap,
    modifiers,
    focusedPane,
    activeUrl,
    activePaneId,
    wordsForPageFind,
    isActive,
    activeTabIndex,
    url,
    capslockState,
    isSoftCapslockOn,
    currentWidth
  };
}

export default connect(mapStateToProps)(TabWindow);

let injectingJs = `

// https://github.com/react-native-community/react-native-webview/issues/447
var viewPortTag=document.createElement('meta');
viewPortTag.id="viewport";
viewPortTag.name = "viewport";
viewPortTag.content = "width=device-width, initial-scale=1;";
document.getElementsByTagName('head')[0].appendChild(viewPortTag);

SVIM_PREDEFINE
SVIM_HELPER
SVIM_TAB
SVIM_GLOBAL
SVIM_HINT
sVimTab.bind();

function cursorToBeginning(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
  var pos = inp.value.lastIndexOf('\\n', inp.selectionStart-1)
  if (inp.setSelectionRange) {
    inp.setSelectionRange(pos+1, pos+1);
  }  
}

function cursorToEnd(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
 var pos = inp.value.indexOf('\\n', inp.selectionStart)  
 if(pos === -1){
   pos = inp.value.length;
 }
 if (inp.setSelectionRange) {
    inp.setSelectionRange(pos, pos);
  }  
}

function deleteLine(){
  var el = document.activeElement;  
  if(!el.value){
    return
  }
  var endPos = el.value.indexOf('\\n', el.selectionStart);  
  if(endPos === -1){
    endPos = el.value.length;
  }
  var caretPos = el.selectionStart;  
  var content = el.value;
  var words = content.substring(caretPos, endPos);
  if(words){
    window.ReactNativeWebView.postMessage(JSON.stringify({selection: words, postFor: "copy"}));    
  }
  el.value = content.substring(0, caretPos) + content.substring(endPos, content.length);
  el.setSelectionRange(caretPos, caretPos);
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

function moveUpOneLine(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
  var pos = inp.value.lastIndexOf('\\n', inp.selectionStart);
  if(pos === -1){
    return
  }
  var upPos = inp.value.lastIndexOf('\\n', pos-1);  
  var countInLine = inp.selectionStart - pos;
  if((pos-upPos) < countInLine){
    countInLine = pos-upPos;
  }
  inp.setSelectionRange(upPos+countInLine, upPos+countInLine);
}

function moveDownOneLine(){
  var inp = document.activeElement;
  if(!inp.value){
    return
  }  
  var endLinePos = inp.value.indexOf('\\n',inp.selectionStart);  
  if(endLinePos === -1){
    // no next line
    return;
  }
  // -1 for just before new line  
  var pos = inp.value.lastIndexOf('\\n', inp.selectionStart-1); 

  var countInLine = pos === -1 ? inp.selectionStart+1 : inp.selectionStart - pos;

  var nextLineEndPos = inp.value.indexOf('\\n',endLinePos+1); 
  if(nextLineEndPos === -1){
    nextLineEndPos = inp.value.length;
  }
  if((nextLineEndPos-endLinePos) < countInLine){
    countInLine = nextLineEndPos-endLinePos;
  }else if(countInLine === 0){ // no word in current line which you need to add the next line
    countInLine += nextLineEndPos-endLinePos;
  }
  inp.setSelectionRange(endLinePos+countInLine, endLinePos+countInLine);  
}

function copyToRN() {
  var selObj = window.getSelection(); 
  var selectedText = selObj.toString();
  window.ReactNativeWebView.postMessage(JSON.stringify({selection: selectedText, postFor: "copy"}));
}

function pasteFromRN(words) {
  if(window.term){
    window.term.textarea.value = words;    
  }else{
    var el = document.activeElement;   
    if(!el){
      return
    }  
    var content = el.value;      
    var caretPos= el.selectionStart;
    el.value =content.substring(0, caretPos) + words + content.substring(caretPos, content.length);
    el.setSelectionRange(caretPos+words.length, caretPos+words.length);  
  }
}

function hitAHintOpeningNewTab(){
  var openUrl = function(url){
    window.ReactNativeWebView.postMessage(JSON.stringify({url: url, postFor: "openNewTab"}));
  };
  sVimHint.start(openUrl);
}

function findInPage(text){
  if (text == null || text.length == 0) return;

  var spans = document.getElementsByClassName("labnol");
  if (spans) {
    for (var i = 0; i < spans.length; i++) {
      spans[i].style.backgroundColor = "transparent";
    }
  }    
  
  /* Search Code is courtesy Jesse Ruderman */
  function searchWithinNode(node, te, len) {
    var pos, skip, spannode, middlebit, endbit, middleclone;
    skip = 0;
    if (node.nodeType == 3) {
      pos = node.data.toLowerCase().indexOf(te);
      if (pos >= 0) {
        spannode = document.createElement("span");
        spannode.setAttribute("class", "labnol");
        spannode.style.backgroundColor = "yellow";
        middlebit = node.splitText(pos);
        endbit = middlebit.splitText(len);
        middleclone = middlebit.cloneNode(true);
        spannode.appendChild(middleclone);
        middlebit.parentNode.replaceChild(spannode, middlebit);
        skip = 1;
      }
    } else if (node.nodeType == 1 && node.childNodes && node.tagName.toUpperCase() != "SCRIPT" && node.tagName.toUpperCase != "STYLE") {
      for (var child = 0; child < node.childNodes.length; ++child) {
        child = child + searchWithinNode(node.childNodes[child], te, len);
      }
    }
    return skip;
  }
  searchWithinNode(document.body, text.toLowerCase(), text.length);  
}



////////////////////////////////////////

// revamp 2020
var isCapsLockOn = false;
var isCapsLockRemapped = false;
var down = false;
var isLoaded = false;

function init(initStr) {
  let initObj = JSON.parse(initStr);
  isCapsLockRemapped = initObj.isCapsLockRemapped;
}

function onKeyPress(e) {

  let key = e.key;
  let el = document.activeElement;  

  // only handle on input text or textarea - not content editable
  if(el.type === "text" || el.type === "textarea"){
    // ok
  }else{
    if(e.type === "keydown" && el.isContentEditable){
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ isCapslockOn: e.getModifierState("CapsLock"), key: key, postFor: "capslock" })
      );    
    }
    return true;
  }

  // IME: https://developer.mozilla.org/ja/docs/Web/API/Document/keydown_event
  if (e.isComposing || (e.keyCode === 229 && e.repeat === false)) {
    return true;
  }

  // for some reason, it comes with charcode 710. It looks ^ but it's not
  if (key.charCodeAt(0) === 710 && key.length === 2) {
    key = key.substr(1);
    // updateInputValue(key);
    // e.preventDefault();
    // e.stopPropagation();
  }

  // Handle alt-code. RN only needs to know the code but not key, like ©,å,,,.
  if (e.altKey) {
    // the both which and keyCode are deprecated but it's handy.
    let code = event.which || event.keyCode;
    key = String.fromCharCode(code);
  }
  window.ReactNativeWebView &&
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        keyEvent: {
          key: key,
          type: e.type,
          modifiers: {
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey
          }
        },
        postFor: e.type
      })
    );

  if (isCapsLockRemapped) {
    down[e.key] = new Date().getTime();

    // Need to handle input depending on software capslock
    if (/^[A-Za-z]$/.test(key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (e.type === "keyup" && /^[ -~]|Enter$/.test(key)) {
    sendTextValue(el.value);
  }
}

function sendTextValue(value) {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ words: value, postFor: "inputValue" })
  );
}

function updateInputValue(key) {
  var el = document.activeElement;
  var startPosition = el.selectionStart;
  var value = el.value;

  el.value = value.slice(0, startPosition) + key + value.slice(startPosition);
  if (el.createTextRange) {
    var part = el.createTextRange();
    part.move("character", startPosition + 1);
    part.select();
  } else if (el.setSelectionRange) {
    el.setSelectionRange(startPosition + 1, startPosition + 1);
  }
  //sendTextValue(el.value);
}

if(isLoaded === false){
  window.document.addEventListener("keydown", onKeyPress, false);
  window.document.addEventListener("keyup", onKeyPress, false);
  isLoaded = true;
}

window.ReactNativeWebView.postMessage(JSON.stringify({isLoading: false, postFor: "jsloading"}))
true;
`;

// specify 16px fontSize not to zoom in.
const focusJS = `
setTimeout(function(){
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
}, 500);
`;
