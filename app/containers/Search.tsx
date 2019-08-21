import React, { Component } from "react";
import {
  View,
  NativeModules,
  NativeEventEmitter,
  TextInput
} from "react-native";
import { connect } from "react-redux";
import DeviceInfo from "react-native-device-info";
import {
  Button,
  Icon,
  Header,
  Item,
  Input,
  Left,
  Text,
  List,
  ListItem,
  Content
} from "native-base";
import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import {
  selectActiveUrl,
  selectActiveSite,
  selectSites
} from "../selectors/ui";
import { updateMode, updateFocusedPane, updateKeySwitch } from "../actions/ui";
import { addExcludedPattern, removeExcludedPattern } from "../actions/user";
import { SearchEngine } from "../components/SearchEnginePicker";
import { KeyMode } from "../types/index.d";
import Modal from "react-native-modal";

import {
  addNewTab,
  selectTab,
  updateSite,
  toggleBack,
  toggleForward
} from "../actions/ui";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface IState {
  text: string;
  previousKeyMode: KeyMode | null;
  selectionStart: number;
  selectionEnd: number;
}

interface Props {
  searchIsFocused: boolean;
  dispatch: (any) => void;
  activeTabIndex: number;
  searchEngine: SearchEngine;
  homeUrl: string;
  keyMode: KeyMode;
  orientation: string;
  activeUrl: string | null;
  activeSite: any | null;
  focusedPane: string;
  sites: any;
  history: Array<any>;
}

class Search extends Component<Props, IState, any> {
  searchRef: TextInput | null = null;
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    const site = props.activeSite;
    this.state = {
      text: "",
      previousKeyMode: null,
      selectionStart: 0,
      selectionEnd: 0
    };
  }

  componentDidMount() {
    const { activeSite, activeUrl } = this.props;
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNKeyEvent", this.typing),
      DAVKeyManagerEmitter.addListener("RNBrowserKeyEvent", this.handleActions)
    );
    this.props.searchIsFocused === true &&
      this.searchRef &&
      this.searchRef._root.focus();
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  componentDidUpdate(prevProp, prevState) {
    const {
      dispatch,
      activeTabIndex,
      orientation,
      activeUrl,
      activeSite,
      focusedPane,
      keyMode,
      searchIsFocused
    } = this.props;

    if (searchIsFocused !== prevProp.searchIsFocused) {
      if (searchIsFocused === true) {
        this.searchRef && this.searchRef._root.focus();
      } else {
        this.searchRef && this.searchRef._root.blur();
      }
    }

    // console.log("prev", prevState.selectionStart);
    // console.log("current", this.state.selectionStart);
  }

  onEndEditing() {
    const { dispatch, activeTabIndex, searchEngine, sites } = this.props;
    const trimmedText = this.state.text.replace(/^\s+|\s+$/g, "");
    if (trimmedText === "") {
      this.searchRef && this.searchRef._root.blur();
      return;
    } else if (/^http/.test(this.state.text)) {
      dispatch(addNewTab(this.state.text));
    } else {
      if (searchEngine === SearchEngine.Google) {
        dispatch(
          addNewTab(`https://www.google.com/search?q=${this.state.text}`)
        );
      } else if (searchEngine === SearchEngine.DuckDuckGo) {
        dispatch(addNewTab(`https://duckduckgo.com/?q=${this.state.text}`));
      }
    }
    setTimeout(() => {
      dispatch(selectTab(sites.length));
    }, 50);
    this.setState({ text: "" });
    this.props.closeSearch();
  }

  urlToPattern(url) {
    /^(.*:)\/\/([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$/.test(url);
    const host = RegExp.$2;
    const port = RegExp.$3;
    const pattern = port ? `https?://${host}${port}/*` : `https?://${host}/*`;
    return pattern;
  }

  handleActions = async event => {
    const { dispatch, keyMode } = this.props;
    if (
      keyMode === KeyMode.Search &&
      this.searchRef &&
      this.props.searchIsFocused
    ) {
      switch (event.action) {
        case "home":
          this.searchRef.setNativeProps({ selection: { start: 0, end: 0 } });
          this.setState({
            selectionStart: 0,
            selectionEnd: 0
          });
          break;
        case "end":
          this.searchRef.setNativeProps({
            selection: {
              start: this.state.text.length,
              end: this.state.text.length
            }
          });
          this.setState({
            selectionStart: this.state.text.length,
            selectionEnd: this.state.text.length
          });
          break;
        case "deletePreviousChar":
          if (0 < this.state.selectionStart) {
            const first = this.state.text.slice(
              0,
              this.state.selectionStart - 1
            );
            const second = this.state.text.slice(
              this.state.selectionStart,
              this.state.text.length
            );
            this.setState({
              text: first + second,
              selectionStart: this.state.selectionStart - 1,
              selectionEnd: this.state.selectionEnd - 1
            });
          }
          break;
        case "deleteNextChar":
          if (this.state.text.length > this.state.selectionStart) {
            const first = this.state.text.slice(0, this.state.selectionStart);
            const second = this.state.text.slice(
              this.state.selectionStart + 1,
              this.state.text.length
            );
            this.setState({
              text: first + second
            });
            setTimeout(() => {
              this.searchRef.setNativeProps({
                selection: {
                  start: this.state.selectionStart,
                  end: this.state.selectionEnd
                }
              });
            }, 50);
          }

          break;
        case "moveBackOneChar":
          this.searchRef.setNativeProps({
            selection: {
              start: this.state.selectionStart - 1,
              end: this.state.selectionEnd - 1
            }
          });
          this.setState({
            selectionStart: this.state.selectionStart - 1,
            selectionEnd: this.state.selectionEnd - 1
          });
          break;
        case "moveForwardOneChar":
          if (this.state.text.length > this.state.selectionStart) {
            this.searchRef.setNativeProps({
              selection: {
                start: this.state.selectionStart + 1,
                end: this.state.selectionEnd + 1
              }
            });
            this.setState({
              selectionStart: this.state.selectionStart + 1,
              selectionEnd: this.state.selectionEnd + 1
            });
          }
          break;
        case "deleteLine":
          const newText = this.state.text.slice(0, this.state.selectionStart);
          // For some reason, need setTimeout..
          setTimeout(() => {
            this.searchRef.setNativeProps({
              selection: {
                start: this.state.selectionStart,
                end: this.state.selectionEnd
              }
            });
          }, 50);
          this.setState({
            text: newText
          });
          break;
        case "copy":
          break;
        case "paste":
          break;
      }
    }
  };

  typing = data => {
    const { dispatch, keyMode } = this.props;
    if (this.props.searchIsFocused && keyMode === KeyMode.Search) {
      // handle shift key to make it Uppercase
      if (data.modifiers.shiftKey) {
        if (data.key.match(/[a-z]/)) {
          data.key = data.key.toUpperCase();
        }
      }

      let text = this.state.text;
      switch (data.key) {
        case "Backspace":
          this.setState({
            text: text.slice(0, -1),
            selectionStart: text.length - 1,
            selectionEnd: text.length - 1
          });
          return;
        case "Up":
          return;
        case "Down":
          return;
        case "Left":
          this.handleActions({ action: "moveBackOneChar" });
          return;
        case "Right":
          this.handleActions({ action: "moveForwardOneChar" });
          return;
        case "Esc":
          this.props.closeSearch();
          return;
      }
      let newText = this.state.text + data.key;
      this.setState({
        text: newText,
        selectionStart: newText.length,
        selectionEnd: newText.length
      });
    }
  };

  renderHistory() {
    const { history } = this.props;
    return history.map((item, i) => {
      return (
        <ListItem key={`history-${i}`}>
          <Text>
            {item.url} - {item.title}
          </Text>
        </ListItem>
      );
    });
  }

  render() {
    const { searchEngine, orientation, keyMode } = this.props;
    if (
      orientation === "LANDSCAPE" &&
      DeviceInfo.getDeviceType() === "Handset"
    ) {
      return null;
    }
    return (
      <Content
        style={{
          backgroundColor: "white"
        }}
      >
        <Item>
          <Icon name="ios-search" style={{ paddingLeft: 10 }} />
          <Input
            ref={r => (this.searchRef = r as any)}
            placeholder={`URL or Search with ${searchEngine}`}
            onChangeText={text => this.setState({ text })}
            value={this.state.text}
            autoCorrect={false}
            onEndEditing={this.onEndEditing.bind(this)}
            textContentType="URL"
            autoCapitalize="none"
            style={{ fontSize: 16 }}
          />
          <Button
            dark
            transparent
            onPress={() => this.props.closeSearch()}
            style={{ margin: 10 }}
          >
            <Text
              style={{
                paddingRight: 0,
                paddingLeft: 10,
                fontSize: 12,
                color: "#999"
              }}
            >
              ESC
            </Text>
            <Icon name="ios-close" style={{ paddingLeft: 0, fontSize: 30 }} />
          </Button>
        </Item>
        <List>{this.renderHistory()}</List>
      </Content>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activeTabIndex = state.ui.get("activeTabIndex");
  const activeUrl = selectActiveUrl(state);
  const sites = selectSites(state);
  const activeSite = selectActiveSite(state);
  const searchEngine = state.user.get("searchEngine");
  const history = state.user.get("history").toJS();
  const homeUrl = state.user.get("homeUrl");
  const keyMode = state.ui.get("keyMode");
  const orientation = state.ui.get("orientation");
  const focusedPane = state.ui.get("focusedPane");

  return {
    keymap,
    modifiers,
    activeTabIndex,
    searchEngine,
    homeUrl,
    keyMode,
    orientation,
    activeUrl,
    activeSite,
    sites,
    focusedPane,
    history
  };
}

export default connect(mapStateToProps)(Search);
