import React, { Component } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
  NativeModules,
  NativeEventEmitter,
  Keyboard
} from "react-native";
import { connect } from "react-redux";
import { Button, Text, Container, Header, Icon } from "native-base";
import ScrollableTabView from "react-native-scrollable-tab-view";
import TabBar from "react-native-underline-tabbar";
import { isEqual } from "lodash";
import Favicon from "../components/Favicon";
import WVTerm from "../components/WVTerm";
import DeviceInfo from "react-native-device-info";
import TabWindow from "./TabWindow";
import { selectSites } from "../selectors/ui";
import { selectAppKeymap, selectModifiers } from "../selectors/keymap";
import { addNewTab, selectTab, closeTab } from "../actions/ui";
import keymapper from "../utils/Keymapper";
import { KeyMode } from "../types/index.d";
import Tab from "./Tab";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  activeIndex: number;
  isActivePane: boolean;
  siteIds: Array<number>;
}

type Site = {
  url: string;
  title: string;
  id: number;
};

interface Props {
  dispatch: (any) => void;
  sites: Array<Site>;
  activeTabIndex: number;
  keymap: any;
  modifiers: any;
  keyMode: KeyMode;
  orientation: string;
  homeUrl: string;
  keySwitchOn: boolean;
  paneId: any;
}

/* Browser is whole browser controls each windows(tabs) */
class Browser extends Component<Props, State> {
  tabsRef: Tabs | null = null;
  keyboardDidShowListener: any;
  keyboardDidHideListener: any;
  subscriptions: Array<any> = [];
  // tabViews are used for cache purpose to avoid loading when tab is changed.
  tabViews: any = {};

  constructor(props) {
    super(props);
    this.state = {
      activeIndex: props.activeTabIndex,
      isActivePane: props.paneId === props.activePaneId,
      siteIds: []
    };
    //this.onPressTab = this.onPressTab.bind(this);
  }

  componentDidMount() {
    const {
      dispatch,
      sites,
      activeTabIndex,
      homeUrl,
      keyMode,
      modifiers,
      keymap
    } = this.props;

    if (sites.length === 0) {
      dispatch(addNewTab(homeUrl));
    }

    this.setIOSMode(keyMode);

    DAVKeyManager.setAppKeymap(
      keymapper.convertToNativeFormat(keymap, modifiers)
    );

    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions)
    );

    this.buildTabs();

    if (activeTabIndex) {
      setTimeout(() => {
        this.tabsRef.goToPage(activeTabIndex);
      }, 500);
    }
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  /*
  +----------+----------+-------------------+
  | RN mode  | iOS mode |    iOS Keymap     |
  +----------+----------+-------------------+
  | search   | text     | app+browser+input |
  | text     | text     | app+browser+input |
  | direct   | n/a      | n/a turned-off    |
  | terminal | input    | app+input         |
  | browser  | browser  | app+browser       |
  +----------+----------+-------------------+
  */

  setIOSMode(keyMode: KeyMode): void {
    switch (keyMode) {
      // case KeyMode.Text:
      //   DAVKeyManager.turnOnKeymap();
      //   DAVKeyManager.setMode("text");
      //   break;
      // case KeyMode.Terminal:
      //   DAVKeyManager.turnOnKeymap();
      //   DAVKeyManager.setMode("input");
      //   break;
      case KeyMode.Direct:
        //DAVKeyManager.turnOffKeymap();
        break;
      case KeyMode.Browser:
        //DAVKeyManager.turnOnKeymap();
        DAVKeyManager.setMode("browser");
        break;
      case KeyMode.Search:
        //DAVKeyManager.turnOnKeymap();
        DAVKeyManager.setMode("text");
        break;
    }
  }

  componentDidUpdate(prevProp: Props) {
    const {
      activeTabIndex,
      sites,
      keyMode,
      keySwitchOn,
      dispatch,
      activePaneId,
      paneId,
      paneIds
    } = this.props;

    if (prevProp.activeTabIndex !== activeTabIndex) {
      if (this.state.activeIndex !== activeTabIndex) {
        this.tabsRef.goToPage(activeTabIndex);
      }
    }

    // Set iOS keymap!!!
    if (prevProp.keyMode !== keyMode) {
      this.setIOSMode(keyMode);
    }

    if (prevProp.activePaneId !== activePaneId) {
      this.setState({ isActivePane: paneId === activePaneId });
    }

    // Manage tabViews with site.id
    if (!isEqual(sites, prevProp.sites)) {
      if (sites.length > prevProp.sites.length) {
        const prevSiteIds = prevProp.sites.map(ps => ps.id);
        sites
          .filter(s => !prevSiteIds.includes(s.id))
          .forEach(s => this.addTabView(s));
      } else if (sites.length < prevProp.sites.length) {
        const siteIds = sites.map(ps => ps.id);
        prevProp.sites
          .filter(ps => !siteIds.includes(ps.id))
          .forEach(ps => this.removeTabView(ps));
      }
    }
  }

  addTabView(s) {
    this.tabViews[s.id] = (
      <TabWindow
        key={`tab-${s.id}`}
        tabLabel={{
          label: "",
          id: s.id,
          onPressButton: () => this.pressCloseTab(s.id),
          url: s.url
        }}
        url={s.url}
        tabId={s.id}
        {...this.props}
      />
    );

    let siteIds = this.state.siteIds.slice();
    siteIds.push(s.id);
    this.setState({ siteIds: siteIds });
  }

  removeTabView(s) {
    this.tabViews[s.id] && delete this.tabViews[s.id];
    let siteIds = this.state.siteIds.slice();
    siteIds.splice(siteIds.indexOf(s.id), 1);
    this.setState({ siteIds: siteIds });
  }

  handleAppActions = async event => {
    const {
      dispatch,
      activeTabIndex,
      keyMode,
      homeUrl,
      sites,
      activePaneId
    } = this.props;
    if (
      this.state.isActivePane &&
      (keyMode === KeyMode.Terminal ||
        keyMode === KeyMode.Text ||
        keyMode === KeyMode.Browser)
    ) {
      console.log("action at browser", event);
      switch (event.action) {
        case "newTab":
          dispatch(addNewTab(homeUrl));
          setTimeout(() => {
            dispatch(selectTab(sites.length));
          }, 50);
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
        case "closeTab":
          const _id = this.state.siteIds[activeTabIndex];
          this.pressCloseTab(_id);
          break;
      }
    }
  };

  pressCloseTab(tabId: number) {
    const { dispatch, sites, activeTabIndex, paneId } = this.props;
    const index = this.state.siteIds.indexOf(tabId);
    dispatch(closeTab(index, paneId, activeTabIndex));
    if (index === activeTabIndex) {
      if (sites.length > index + 1) {
        dispatch(selectTab(index));
      } else {
        setTimeout(() => {
          dispatch(selectTab(index - 1));
        }, 50);
      }
    }
  }

  // onPressTab(index) {
  //   const { dispatch } = this.props;
  //   dispatch(selectTab(index));
  // }
  onChangeTab(tab) {
    const { dispatch, activeTabIndex } = this.props;
    console.log(tab, activeTabIndex);
    if (activeTabIndex !== tab.i) {
      dispatch(selectTab(tab.i));
    }
    this.setState({ activeIndex: tab.i });
  }

  buildTabs() {
    const { keyMode, sites, paneId } = this.props;
    for (let i = 0; i < sites.length; i++) {
      const _id = sites[i].id;
      const _url = sites[i].url;
      this.tabViews[_id] = (
        <TabWindow
          key={`tab-${_id}`}
          tabLabel={{
            label: "",
            id: _id,
            onPressButton: () => this.pressCloseTab(_id)
          }}
          url={_url}
          tabId={_id}
          paneId={paneId}
          {...this.props}
        />
      );
    }
    this.setState({ siteIds: sites.map(s => s.id) });
  }

  renderTabs() {
    return this.state.siteIds.map(id => {
      return this.tabViews[id];
    });
  }

  render() {
    const { activeTabIndex, orientation, sites, paneIds, paneId } = this.props;

    let height =
      sites.length < 2 ||
      (orientation === "LANDSCAPE" && DeviceInfo.getDeviceType() === "Handset")
        ? 0
        : 40;

    return (
      <ScrollableTabView
        ref={r => (this.tabsRef = r as any)}
        renderTabBar={() => (
          <TabBar
            underlineColor="#30d158"
            underlineHeight={4}
            tabBarStyle={{
              backgroundColor: "#222",
              marginTop: 0,
              height: height,
              borderBottomWidth: 0.5
            }}
            renderTab={(
              tab,
              page,
              isTabActive,
              onPressHandler,
              onTabLayout
            ) => (
              <Tab
                paneId={paneId}
                key={page}
                tab={tab}
                page={page}
                isTabActive={isTabActive}
                onPressHandler={onPressHandler}
                onTabLayout={onTabLayout}
              />
            )}
          />
        )}
        onChangeTab={this.onChangeTab.bind(this)}
        scrollWithoutAnimation={true}
        locked={true}
      >
        {this.renderTabs()}
      </ScrollableTabView>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectAppKeymap(state);
  const modifiers = selectModifiers(state);
  const activePaneId = state.ui.get("activePaneId");
  const paneIds = state.ui.get("paneIds").toArray();
  const activeTabIndex = state.ui.getIn([
    "panes",
    ownProps.paneId,
    "activeTabIndex"
  ]);
  const sites = selectSites(state, ownProps.paneId);
  const keyMode = state.ui.get("keyMode");
  const orientation = state.ui.get("orientation");
  const homeUrl = state.user.get("homeUrl");
  const keySwitchOn = state.ui.get("keySwitchOn");

  return {
    sites,
    keymap,
    modifiers,
    activeTabIndex,
    keyMode,
    orientation,
    homeUrl,
    keySwitchOn,
    activePaneId,
    paneIds
  };
}

export default connect(mapStateToProps)(Browser);
