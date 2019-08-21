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
  canGoBack: boolean;
  canGoForward: boolean;
  excludedPattern: string | null;
  searchIsFocused: boolean;
  previousKeyMode: KeyMode | null;
  selectionStart: number;
  selectionEnd: number;
  searchModalIsVisiable: boolean;
}

interface Props {
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
  keySwitchOn: boolean;
}

class NavBar extends Component<Props, IState, any> {
  searchRef: TextInput | null = null;
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    const site = props.activeSite;
    this.state = {
      text: "",
      canGoBack: site && site.canGoBack ? site.canGoBack : false,
      canGoForward: site && site.canGoForward ? site.canGoForward : false,
      searchIsFocused: false,
      previousKeyMode: null,
      selectionStart: 0,
      selectionEnd: 0,
      searchModalIsVisiable: false
    };
  }

  componentDidMount() {
    const { activeSite, activeUrl } = this.props;
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNKeyEvent", this.typing),
      DAVKeyManagerEmitter.addListener("RNBrowserKeyEvent", this.handleActions),
      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions)
    );
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
      keyMode
    } = this.props;
    if (
      activeSite &&
      (activeTabIndex !== prevProp.activeTabIndex ||
        activeUrl !== prevProp.activeUrl)
    ) {
      activeSite &&
        this.setState({
          canGoBack: activeSite.canGoBack,
          canGoForward: activeSite.canGoForward
        });
    }

    if (orientation !== prevProp.orientation) {
      this.props.navigate("Home", { orientation: orientation });
    }

    if (prevProp.focusedPane !== focusedPane) {
      if (focusedPane === "search") {
        dispatch(updateMode(KeyMode.Search));
        this.setState({ previousKeyMode: keyMode });
      } else if (focusedPane === "browser") {
        dispatch(updateMode(this.state.previousKeyMode));
        this.setState({ previousKeyMode: null });
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
    this.closeSearch();
  }

  onPressToggleBack() {
    const { dispatch } = this.props;
    dispatch(toggleBack());
  }

  onPressToggleForward() {
    const { dispatch } = this.props;
    dispatch(toggleForward());
  }

  onPressAdd() {
    const { dispatch, homeUrl, sites } = this.props;
    dispatch(addNewTab(homeUrl));
    setTimeout(() => {
      dispatch(selectTab(sites.length));
    }, 50);
  }

  onPressSetting() {
    DAVKeyManager.turnOffKeymap();
    this.props.navigate({ routeName: "Setting" });
  }

  onPressSwitch() {
    const { dispatch, activeUrl, keySwitchOn } = this.props;
    const pattern = this.urlToPattern(activeUrl);
    if (keySwitchOn) {
      dispatch(addExcludedPattern(pattern));
    } else {
      dispatch(removeExcludedPattern(pattern));
    }
    dispatch(updateKeySwitch(!keySwitchOn));
  }

  urlToPattern(url) {
    /^(.*:)\/\/([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$/.test(url);
    const host = RegExp.$2;
    const port = RegExp.$3;
    const pattern = port ? `https?://${host}${port}/*` : `https?://${host}/*`;
    return pattern;
  }

  switchIcon() {
    if (this.props.keySwitchOn) {
      return (
        <MCIcon
          name="toggle-switch"
          style={{ color: "#30d158", fontSize: 22 }}
        />
      );
    } else {
      return (
        <MCIcon
          name="toggle-switch-off"
          style={{ color: "#aaa", fontSize: 22 }}
        />
      );
    }
  }

  handleActions = async event => {
    const { dispatch, keyMode } = this.props;
    if (
      keyMode === KeyMode.Search &&
      this.searchRef &&
      this.state.searchIsFocused
    ) {
      console.log(event);
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
    console.log(data);
    if (this.state.searchIsFocused && keyMode === KeyMode.Search) {
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
          this.closeSearch();
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

  handleAppActions = event => {
    const { dispatch } = this.props;
    switch (event.action) {
      case "focusOnSearch":
        this.openSearch();
        break;
    }
  };

  openSearch() {
    const { dispatch, keyMode } = this.props;
    dispatch(updateFocusedPane("search"));
    this.setState({ searchModalIsVisiable: true, searchIsFocused: true });
    this.searchRef && this.searchRef._root.focus();
  }

  closeSearch() {
    const { dispatch, keyMode } = this.props;
    this.searchRef && this.searchRef._root.blur();
    this.setState({ searchModalIsVisiable: false, searchIsFocused: false });
    dispatch(updateFocusedPane("browser"));
  }

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
      <Header searchBar rounded>
        <Button
          transparent
          light
          onPress={this.onPressToggleBack.bind(this)}
          disabled={!this.state.canGoBack}
        >
          <Icon name="ios-arrow-back" />
        </Button>
        <Button
          transparent
          light
          onPress={this.onPressToggleForward.bind(this)}
          style={{ marginRight: 20 }}
          disabled={!this.state.canGoForward}
        >
          <Icon name="ios-arrow-forward" />
        </Button>
        <Item>
          <Button
            iconLeft
            light
            onPress={() => this.openSearch()}
            style={{ height: 30, borderRadius: 15, width: "100%" }}
          >
            <Icon name="ios-search" style={{ fontSize: 15, width: 20 }} />
            <Text
              style={{ fontSize: 12, textAlign: "left", width: "100%" }}
            >{`URL or Search with ${searchEngine}`}</Text>
          </Button>
        </Item>
        <Button transparent light onPress={() => this.onPressSwitch()}>
          {this.switchIcon()}
        </Button>
        <Button transparent light onPress={() => this.onPressAdd()}>
          <Icon name="md-add" />
        </Button>
        <Button transparent light onPress={this.onPressSetting.bind(this)}>
          <Icon name="settings" />
        </Button>
        <Modal
          isVisible={this.state.searchModalIsVisiable}
          animationIn="fadeIn"
          animationOut="fadeOut"
        >
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
                onPress={() => this.closeSearch()}
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
                <Icon
                  name="ios-close"
                  style={{ paddingLeft: 0, fontSize: 30 }}
                />
              </Button>
            </Item>
            <List>{this.renderHistory()}</List>
          </Content>
        </Modal>
      </Header>
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
  const keySwitchOn = state.ui.get("keySwitchOn");
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
    keySwitchOn,
    history
  };
}

export default connect(mapStateToProps)(NavBar);
