import React, { Component } from "react";
import {
  View,
  NativeModules,
  NativeEventEmitter,
  TextInput,
  Clipboard
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
import Search from "./Search";
import { KeyMode } from "../types/index.d";
import Modal from "react-native-modal";

import {
  addNewTab,
  selectTab,
  toggleBack,
  toggleForward,
  toggleReload
} from "../actions/ui";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface IState {
  text: string;
  canGoBack: boolean;
  canGoForward: boolean;
  excludedPattern: string | null;
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
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    const site = props.activeSite;
    this.state = {
      text: "",
      canGoBack: site && site.canGoBack ? site.canGoBack : false,
      canGoForward: site && site.canGoForward ? site.canGoForward : false,
      previousKeyMode: null,
      selectionStart: 0,
      selectionEnd: 0,
      searchModalIsVisiable: false
    };
  }

  componentDidMount() {
    this.subscriptions.push(
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
        this.setState({ previousKeyMode: KeyMode.Browser });
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

  onPressToggleReload() {
    const { dispatch } = this.props;
    dispatch(toggleReload());
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
  }

  urlToPattern(url) {
    /^(.*:)\/\/([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$/.test(url);
    const host = RegExp.$2;
    const port = RegExp.$3;
    const pattern = port ? `https?://${host}${port}/*` : `https?://${host}/*`;
    return pattern;
  }

  switchIcon() {
    const { activeUrl } = this.props;
    if (this.props.keySwitchOn) {
      if (/^https:\/\/www\.wazaterm\.com\/terminals\/\S+/.test(activeUrl)) {
        return (
          <MCIcon
            name="toggle-switch"
            style={{ color: "#ffd60a", fontSize: 22 }}
          />
        );
      } else {
        return (
          <MCIcon
            name="toggle-switch"
            style={{ color: "#30d158", fontSize: 22 }}
          />
        );
      }
    } else {
      return (
        <MCIcon
          name="toggle-switch-off"
          style={{ color: "#aaa", fontSize: 22 }}
        />
      );
    }
  }

  handleAppActions = event => {
    const { dispatch } = this.props;
    console.log(event);
    switch (event.action) {
      case "focusOnSearch":
        this.openSearch();
        break;
      case "toggleWazariInput":
        this.onPressSwitch();
        break;
    }
  };

  openSearch() {
    const { dispatch, keyMode } = this.props;
    dispatch(updateFocusedPane("search"));
    this.setState({ searchModalIsVisiable: true });
  }

  closeSearch() {
    const { dispatch, keyMode } = this.props;
    this.setState({ searchModalIsVisiable: false });
    dispatch(updateFocusedPane("browser"));
  }

  render() {
    const { searchEngine, orientation, keyMode, activeUrl } = this.props;
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
          disabled={!this.state.canGoForward}
        >
          <Icon name="ios-arrow-forward" />
        </Button>
        <Button
          transparent
          light
          onPress={this.onPressToggleReload.bind(this)}
          style={{ marginRight: 10 }}
        >
          <Icon name="md-refresh" />
        </Button>
        <Item>
          <Button
            iconLeft
            dark
            transparent
            onPress={() => this.openSearch()}
            style={{
              height: 30,
              borderRadius: 15,
              flex: 1,
              justifyContent: "flex-start"
            }}
          >
            <Icon
              name="ios-search"
              style={{ minWidth: 20, fontSize: 15, width: 20 }}
            />
            <Text
              style={{
                paddingLeft: 0,
                paddingRight: 0,
                fontSize: 9,
                textAlign: "left",
                flex: 0.99,
                color: "#333",
                fontWeight: 600
              }}
            >
              Search or URL {` - ${activeUrl}`}
            </Text>
            <Button
              transparent
              style={{
                marginRight: 5,
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                width: 20,
                height: 19,
                borderRadius: 0
              }}
              onPress={() => Clipboard.setString(activeUrl)}
            >
              <Icon
                name="md-copy"
                style={{
                  paddingTop: 0,
                  minWidth: 20,
                  fontSize: 15,
                  width: 20,
                  marginLeft: 8,
                  marginRight: 3,
                  alignSelf: "flex-end",
                  color: "#333",
                  fontWeight: 600
                }}
              />
            </Button>
          </Button>
        </Item>
        <Button
          transparent
          light
          onPress={() => this.onPressSwitch()}
          style={{ marginLeft: 5 }}
        >
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
          <Search
            searchIsFocused={this.state.searchModalIsVisiable}
            closeSearch={this.closeSearch.bind(this)}
            openSearch={this.openSearch.bind(this)}
            {...this.props}
          />
        </Modal>
      </Header>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activeTabIndex = state.ui.getIn([
    "panes",
    ownProps.paneId,
    "activeTabIndex"
  ]);
  const activePaneId = state.ui.get("activePaneId");
  const sites = selectSites(state, activePaneId);
  const activeSite = selectActiveSite(state, activePaneId);
  const activeUrl = selectActiveUrl(state, activePaneId);
  const searchEngine = state.user.get("searchEngine");
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
    keySwitchOn
  };
}

export default connect(mapStateToProps)(NavBar);
