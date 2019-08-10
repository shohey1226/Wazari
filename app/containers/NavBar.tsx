import React, { Component } from "react";
import { View, NativeModules, NativeEventEmitter } from "react-native";
import { connect } from "react-redux";
import { Button, Icon, Header, Item, Input, Left } from "native-base";
import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { selectSites } from "../selectors/ui";
import { updateMode } from "../actions/ui";
import { addExcludedPattern, removeExcludedPattern } from "../actions/user";
import { SearchEngine } from "../components/SearchEnginePicker";
import { KeyMode } from "../types/index.d";

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
  switchOn: boolean;
  excludedPattern: string | null;
  searchIsFocused: boolean;
  previousKeyMode: KeyMode | null;
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  sites: any;
  searchEngine: SearchEngine;
  homeUrl: string;
  excludedPatterns: Array<string>;
  excludedPatternHasChanged: boolean;
  keyMode: KeyMode;
}

class NavBar extends Component<Props, IState, any> {
  searchRef: Input;

  constructor(props) {
    super(props);
    const site = props.sites[props.activeTabIndex];
    this.state = {
      text: "",
      canGoBack: site && site.canGoBack ? site.canGoBack : false,
      canGoForward: site && site.canGoForward ? site.canGoForward : false,
      switchOn: true,
      searchIsFocused: false,
      previousKeyMode: null
    };
  }

  componentDidMount() {
    const { sites, activeTabIndex } = this.props;
    const site = sites[activeTabIndex];
    site && this.setSwitch(site.url);
    let self = this;
    DAVKeyManagerEmitter.addListener("RNKeyEvent", data => {
      if (this.state.searchIsFocused) {
        if (this.props.keyMode === KeyMode.Search) {
          this.typing(data);
        }
      }
    });
  }

  componentDidUpdate(prevProp) {
    const {
      activeTabIndex,
      sites,
      excludedPatterns,
      excludedPatternHasChanged
    } = this.props;
    const site = sites[activeTabIndex];
    const prevSite = prevProp.sites[prevProp.activeTabIndex];
    if (
      site &&
      (activeTabIndex !== prevProp.activeTabIndex || site.url !== prevSite.url)
    ) {
      this.setState({
        canGoBack: site.canGoBack,
        canGoForward: site.canGoForward
      });
      this.setSwitch(site.url);
    }

    if (
      site &&
      excludedPatternHasChanged !== prevProp.excludedPatternHasChanged
    ) {
      this.setSwitch(site.url);
    }
  }

  onEndEditing() {
    const { dispatch, activeTabIndex, sites, searchEngine } = this.props;
    if (/^http/.test(this.state.text)) {
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
    this.setState({ text: "" });
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
    const { dispatch, homeUrl } = this.props;
    dispatch(addNewTab(homeUrl));
  }

  onPressSetting() {
    DAVKeyManager.turnOffKeymap();
    this.props.navigate({ routeName: "Setting" });
  }

  onPressSwitch() {
    const { dispatch, sites, activeTabIndex } = this.props;
    const site = sites[activeTabIndex];
    if (this.state.switchOn) {
      dispatch(updateMode(KeyMode.Browser));
      dispatch(addExcludedPattern(this.urlToPattern(site.url)));
    } else {
      this.state.excludedPattern &&
        dispatch(removeExcludedPattern(this.state.excludedPattern));
      dispatch(updateMode(KeyMode.Text));
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
    if (this.state.switchOn) {
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

  setSwitch(url) {
    const { excludedPatterns } = this.props;
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
    if (this.state.switchOn !== switchOn) {
      this.setState({ switchOn: switchOn, excludedPattern: pattern });
    }
  }

  typing(data) {
    console.log(data);
  }

  onFocusSearch() {
    const { dispatch, keyMode } = this.props;
    this.setState({ searchIsFocused: true, previousKeyMode: keyMode });
    this.props.dispatch(updateMode(KeyMode.Search));
  }

  onBlurSearch() {
    const { dispatch } = this.props;
    this.state.previousKeyMode &&
      this.props.dispatch(updateMode(this.state.previousKeyMode));
    this.setState({ searchIsFocused: false, previousKeyMode: null });
  }

  render() {
    const { searchEngine } = this.props;
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
          <Icon name="ios-search" />
          <Input
            ref={r => (this.searchRef = r as any)}
            placeholder={`URL or Search with ${searchEngine}`}
            onChangeText={text => this.setState({ text })}
            value={this.state.text}
            autoCorrect={false}
            onEndEditing={this.onEndEditing.bind(this)}
            textContentType="URL"
            autoCapitalize="none"
            style={{ fontSize: 12 }}
            onFocus={this.onFocusSearch.bind(this)}
            onBlur={this.onBlurSearch.bind(this)}
          />
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
      </Header>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activeTabIndex = state.ui.get("activeTabIndex");
  const sites = selectSites(state);
  const searchEngine = state.user.get("searchEngine");
  const homeUrl = state.user.get("homeUrl");
  const excludedPatterns = state.user.get("excludedPatterns").toArray();
  const excludedPatternHasChanged = state.user.get("excludedPatternHasChanged");
  const keyMode = state.ui.get("keyMode");
  return {
    keymap,
    modifiers,
    activeTabIndex,
    sites,
    searchEngine,
    homeUrl,
    excludedPatterns,
    excludedPatternHasChanged,
    keyMode
  };
}

export default connect(mapStateToProps)(NavBar);
