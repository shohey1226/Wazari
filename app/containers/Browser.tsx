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
  ScrollableTab,
  TabHeading,
  Icon
} from "native-base";
import TabWindow from "./TabWindow";
import { selectSites } from "../selectors/ui";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { addNewTab, selectTab, closeTab } from "../actions/ui";
import keymapper from "../utils/Keymapper";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

enum KeyMode {
  Direct,
  KeyEvent
}

interface State {
  activeIndex: number;
}

type Site = {
  url: string;
  title: string;
};

interface Props {
  dispatch: (any) => void;
  sites: Array<Site>;
  activeTabIndex: number;
  keymap: any;
  modifiers: any;
  keyMode: KeyMode;
}

/* Browser is whole browser controls each windows(tabs) */
class Browser extends Component<Props, State> {
  tabsRef: Tabs | null = null;

  constructor(props) {
    super(props);
    this.state = { activeIndex: props.activeTabIndex };
    //this.onPressTab = this.onPressTab.bind(this);
  }

  componentDidMount() {
    const { dispatch, sites, activeTabIndex } = this.props;
    if (sites.length === 0) {
      dispatch(addNewTab("https://www.wazaterm.com"));
      dispatch(addNewTab("https://www.google.com"));
    }
    this.initKeymaps();
  }

  initKeymaps() {
    const { keymap, modifiers } = this.props;
    DAVKeyManager.setWindow("browser");
    DAVKeyManager.turnOnKeymap();
    DAVKeyManager.setBrowserKeymap(
      keymapper.convertToNativeFormat(keymap, modifiers)
    );
  }

  componentDidUpdate(prevProp: Props) {
    const { activeTabIndex, sites, keyMode } = this.props;

    if (prevProp.activeTabIndex !== activeTabIndex) {
      if (this.state.activeIndex !== activeTabIndex) {
        // https://github.com/ptomasroos/react-native-scrollable-tab-view/issues/818
        setTimeout(() => {
          this.tabsRef.goToPage(activeTabIndex);
        }, 300);
      }
    }
    if (prevProp.keyMode !== keyMode) {
      if (keyMode === KeyMode.Direct) {
        DAVKeyManager.setWindow("browser");
      } else {
        DAVKeyManager.setWindow("terminal");
      }
    }
  }

  // https://qiita.com/hirocueki2/items/137400e236189a0a6b3e
  _truncate(str, len) {
    return str.length <= len ? str : str.substr(0, len) + "...";
  }

  pressCloseTab(i) {
    const { dispatch, sites } = this.props;
    let newSites = sites.slice();
    newSites.splice(i, 1);
    const focusedIndex = newSites.length > 0 ? newSites.length - 1 : null;
    dispatch(closeTab(i, focusedIndex));
  }

  // onPressTab(index) {
  //   const { dispatch } = this.props;
  //   dispatch(selectTab(index));
  // }
  onChangeTab(tab) {
    const { dispatch } = this.props;
    //console.log(tab);
    this.setState({ activeIndex: tab.i });
    dispatch(selectTab(tab.i));
  }

  renderTabs() {
    const { sites } = this.props;
    let tabs = [];
    for (let i = 0; i < sites.length; i++) {
      const tabTitle = sites[i].title
        ? this._truncate(sites[i].title, 12)
        : sites[i].url;
      tabs.push(
        <Tab
          key={`tab-${i}`}
          heading={
            <TabHeading style={{ paddingLeft: 10, paddingRight: 10 }}>
              <Text style={{ fontSize: 12, marginLeft: 1 }}>{tabTitle}</Text>
              <Button
                transparent
                light
                onPress={() => this.pressCloseTab(i)}
                style={{ marginTop: 3 }}
              >
                <Icon
                  name="md-close"
                  style={{ marginLeft: 5, marginRight: 1 }}
                />
              </Button>
            </TabHeading>
          }
        >
          <TabWindow url={sites[i].url} tabNumber={i} />
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
        renderTabBar={() => (
          <ScrollableTab style={{ backgroundColor: "#222" }} />
        )}
        onChangeTab={this.onChangeTab.bind(this)}
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
  const keyMode = state.ui.get("keyMode");

  return {
    sites,
    keymap,
    modifiers,
    activeTabIndex,
    keyMode
  };
}

export default connect(mapStateToProps)(Browser);
