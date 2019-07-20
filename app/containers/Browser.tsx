import React, { Component } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
  NativeModules,
  NativeEventEmitter,
  TextInput
} from "react-native";
import { connect } from "react-redux";
import {
  Button,
  Text,
  Container,
  Header,
  Tab,
  Tabs,
  ScrollableTab
} from "native-base";
import Window from "./Window";
import { selectSites } from "../selectors/ui";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { addNewTab, selectTab } from "../actions/ui";
import keymapper from "../utils/Keymapper";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

class Browser extends Component {
  constructor(props) {
    super(props);
    //this.onPressTab = this.onPressTab.bind(this);
  }

  componentDidMount() {
    const { dispatch, sites, activeTabIndex } = this.props;
    if (sites.length === 0) {
      dispatch(addNewTab("https://www.wazaterm.com"));
      dispatch(addNewTab("https://www.google.com"));
    }
    this.initKeymaps();
    //dispatch(selectTab(activeTabIndex));
    //this.tabsRef.goToPage(activeTabIndex);
  }

  initKeymaps() {
    const { keymap, modifiers } = this.props;
    DAVKeyManager.setWindow("browser");
    DAVKeyManager.turnOnKeymap();
    DAVKeyManager.setBrowserKeymap(
      keymapper.convertToNativeFormat(keymap, modifiers)
    );
  }

  componentDidUpdate(prevProp) {
    if (prevProp.activeTabIndex !== this.props.activeTabIndex) {
      // https://github.com/ptomasroos/react-native-scrollable-tab-view/issues/818
      setTimeout(() => {
        this.tabsRef.goToPage(this.props.activeTabIndex);
      }, 300);
    }
  }

  // onPressTab(index) {
  //   const { dispatch } = this.props;
  //   dispatch(selectTab(index));
  // }

  // https://qiita.com/hirocueki2/items/137400e236189a0a6b3e
  _truncate(str, len) {
    return str.length <= len ? str : str.substr(0, len) + "...";
  }

  renderTabs() {
    const { sites } = this.props;
    let tabs = [];
    for (let i = 0; i < sites.length; i++) {
      const tabTitle = sites[i].title
        ? this._truncate(sites[i].title, 12)
        : sites[i].url;
      tabs.push(
        <Tab key={`tab-${i}`} heading={tabTitle}>
          <Window url={sites[i].url} tabNumber={i} />
        </Tab>
      );
    }
    return tabs;
  }

  render() {
    const { activeTabIndex } = this.props;
    return (
      <Tabs
        ref={r => (this.tabsRef = r as any)}
        renderTabBar={() => <ScrollableTab />}
      >
        {this.renderTabs()}
      </Tabs>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activeTabIndex = state.ui.get("activeTabIndex");
  const sites = selectSites(state);
  return { sites, keymap, modifiers, activeTabIndex };
}

export default connect(mapStateToProps)(Browser);
