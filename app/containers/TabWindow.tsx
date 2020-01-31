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
  updateKeySwitch,
  updateWordsForPageFind
} from "../actions/ui";
import { addHistory } from "../actions/user";
import { selectSites, selectActiveUrl } from "../selectors/ui";
import { KeyMode } from "../types/index.d";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  isLoadingSVim: boolean; // state to load local sVim files
  isLoadingJSInjection: boolean; // state to load injectedJS so commands can be used
  width: number;
  progress: number;
  userAgent: string | null;
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  keyMode: KeyMode;
  backToggled: boolean;
  forwardToggled: boolean;
  reloadToggled: boolean;
  excludedPatterns: Array<string>;
  keySwitchOn: boolean;
  activeUrl: string;
  isActive: boolean;
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15";

class TabWindow extends Component<Props, State, any> {
  webref: WebView | null = null;
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    let { height, width } = Dimensions.get("window");
    this.state = {
      isLoadingSVim: true,
      isLoadingJSInjection: true,
      width: width,
      progress: 0,
      userAgent: DeviceInfo.isTablet() ? USER_AGENT : null
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

      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions)

      // DAVKeyManagerEmitter.addListener("RNKeyEvent", data => {
      //   if (this.props.keyMode === KeyMode.Terminal) {
      //     //this.typing(data);
      //   } else if (this.props.keyMode === KeyMode.Text) {
      //     //this.textTyping(data);
      //   }
      // })
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
      keyMode,
      focusedPane,
      activeUrl,
      keySwitchOn,
      isActive,
      activePaneId,
      wordsForPageFind
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
        case "moveUpOneLine":
          this.webref.injectJavaScript(`moveUpOneLine()`);
          break;
        case "moveDownOneLine":
          this.webref.injectJavaScript(`moveDownOneLine()`);
          break;
        // case "goBack":
        //   this.webref.goBack();
        //   break;
        // case "goForward":
        //   this.webref.goForward();
        //   break;
        // case "reload":
        //   this.webref.reload();
        //   break;
        // case "hitAHint":
        //   this.webref.injectJavaScript(`sVimHint.start()`);
        //   this.webref.injectJavaScript(`document.activeElement.blur();`);
        //   break;
        // case "hitAHintOpeningNewTab":
        //   this.webref.injectJavaScript(`hitAHintOpeningNewTab()`);
        //   this.webref.injectJavaScript(`document.activeElement.blur();`);
        //   break;
        case "deleteLine":
          this.webref.injectJavaScript(`deleteLine()`);
          break;
        // case "zoomIn":
        //   this.webref.injectJavaScript(`sVimTab.commands.zoomPageIn()`);
        //   break;
        // case "zoomOut":
        //   this.webref.injectJavaScript(`sVimTab.commands.zoomPageOut()`);
        //   break;
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

  handleAppActions = async event => {
    const { dispatch, keyMode, isActive } = this.props;
    if (
      keyMode === KeyMode.Text &&
      this.webref &&
      isActive &&
      this.state.isLoadingJSInjection === false
    ) {
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
          this.webref.injectJavaScript(`sVimTab.commands.zoomPageIn()`);
          break;
        case "zoomOut":
          this.webref.injectJavaScript(`sVimTab.commands.zoomPageOut()`);
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
          this.webref.injectJavaScript(`moveUpOneLine()`);
          return;
        case "Down":
          this.webref.injectJavaScript(`moveDownOneLine()`);
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
      activeTabIndex,
      paneId,
      isActive,
      modifiers
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
      console.log(JSON.stringify(modifiers));
      this.webref.injectJavaScript(
        `loadModifers(${JSON.stringify(modifiers)})`
      );
      this.setState({ url: nativeEvent.url });
    }
  }

  onLoadStart(syntheticEvent) {
    this.setState({ isLoadingJSInjection: true });
    //const { nativeEvent } = syntheticEvent;
  }

  onMessage(event) {
    const { dispatch, sites } = this.props;
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
    }
  }

  onNavigationStateChange(event) {
    //const { dispatch, activeTabIndex } = this.props;
  }

  renderTerminal() {
    const { tabId } = this.props;
    if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(this.state.url)) {
      return (
        <WVTerm
          key={`tab-${tabId}`}
          tabLabel={{
            label: "",
            id: tabId,
            onPressButton: () => this.pressCloseTab(tabId),
            url: this.state.url
          }}
          url={this.state.url}
          tabId={tabId}
          {...this.props}
        />
      );
    } else {
      return null;
    }
  }

  render() {
    const { url, keyMode, tabId } = this.props;
    const progressCustomStyles = {
      borderRadius: 0
    };
    if (this.state.isLoadingSVim) {
      return <View />;
    } else {
      return (
        <View style={{ flex: 1 }}>
          {this.state.isLoadingJSInjection ? (
            <ProgressBarAnimated
              {...progressCustomStyles}
              height={3}
              borderWidth={0}
              value={this.state.progress}
              width={this.state.width}
            />
          ) : null}
          {this.renderTerminal() || (
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
          )}
        </View>
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
  const keyMode = state.ui.get("keyMode");
  const wordsForPageFind = state.ui.get("wordsForPageFind");
  const sites = selectSites(state, ownProps.paneId);
  const activeTabIndex = state.ui.getIn([
    "panes",
    ownProps.paneId,
    "activeTabIndex"
  ]);
  const _isActivePane = activePaneId === ownProps.paneId;
  console.log(sites, activeTabIndex);
  const isActive = sites[activeTabIndex].id === ownProps.tabId && _isActivePane;
  console.log(ownProps.tabId, isActive);

  return {
    backToggled,
    forwardToggled,
    reloadToggled,
    keymap,
    modifiers,
    focusedPane,
    excludedPatterns,
    activeUrl,
    keySwitchOn,
    activePaneId,
    wordsForPageFind,
    isActive,
    activeTabIndex,
    keyMode
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

function typingFromRN(key){
  var el = document.activeElement;
  var startPosition = el.selectionStart;
  var value = el.value;

  el.value = value.slice(0, startPosition) + key + value.slice(startPosition);
  if (el.createTextRange) {
    var part = el.createTextRange();
    part.move("character", startPosition+1);
    part.select();
  } else if (el.setSelectionRange) {
    el.setSelectionRange(startPosition+1, startPosition+1);
  }

}

function dispatchKeyEventForHints(charCode){
  sVimTab.mode === "hint" && simulateKeyDown(document, charCode, null);
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

var termSelectionHandler = null;


var modifiers = {};
function loadModifers(modifiersStr){
  modifiers = JSON.parse(modifiersStr);
}

function onKeyDown(e){
  e.preventDefault();
  //e.stopPropagation();  
  var event = new KeyboardEvent("keydown", e);
  for (var i in modifiers) {
    event[modifiers[i]] = e[i];
  }
  window.term.textarea.dispatchEvent(event);
}

function onKeyPress(e){
  e.preventDefault();
  e.stopPropagation();
  var event = new KeyboardEvent("keypress", e);
  for (var i in modifiers) {
    event[modifiers[i]] = e[i];
  }  
  window.term.textarea.dispatchEvent(event);
}

setTimeout(function(){
  if(window.term && !termSelectionHandler){
    termSelectionHandler = window.term.onSelectionChange(function(){
      var selectedText = window.term.getSelection()
      window.ReactNativeWebView.postMessage(JSON.stringify({selection: selectedText, postFor: "copy"}));
    })
  }

  // testing
  if(window.term){
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keypress", onKeyPress, false);
  }

}, 800);

window.ReactNativeWebView.postMessage(JSON.stringify({isLoading: false, postFor: "jsloading"}))

true;
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
