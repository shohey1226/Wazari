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
import { addNewTab, selectTab, closeTab, updateCapslock } from "../actions/ui";
import keymapper from "../utils/Keymapper";
import { CapslockState } from "../types/index.d";
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
  orientation: string;
  homeUrl: string;
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
      modifiers,
      keymap
    } = this.props;

    if (sites.length === 0) {
      dispatch(addNewTab(homeUrl));
    }

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

  componentDidUpdate(prevProp: Props) {
    const {
      activeTabIndex,
      sites,
      dispatch,
      activePaneId,
      paneId,
      paneIds,
      isSoftCapslockOn
    } = this.props;

    if (prevProp.activeTabIndex !== activeTabIndex) {
      if (this.state.activeIndex !== activeTabIndex) {
        this.tabsRef.goToPage(activeTabIndex);
      }
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

    if (isSoftCapslockOn !== prevProp.isSoftCapslockOn) {
      if (isSoftCapslockOn) {
        dispatch(updateCapslock(CapslockState.SoftOn));
      } else {
        dispatch(updateCapslock(CapslockState.SoftOff));
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
      homeUrl,
      sites,
      activePaneId
    } = this.props;

    if (this.state.isActivePane) {
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
    const { dispatch, activeTabIndex, activePaneId, paneId } = this.props;
    console.log(tab, activeTabIndex);
    if (activePaneId === paneId) {
      if (activeTabIndex !== tab.i) {
        dispatch(selectTab(tab.i));
      }
      this.setState({ activeIndex: tab.i });
    }
  }

  buildTabs() {
    const { sites, paneId } = this.props;
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
  const orientation = state.ui.get("orientation");
  const isSoftCapslockOn = state.ui.get("isSoftCapslockOn");
  const homeUrl = state.user.get("homeUrl");

  return {
    sites,
    keymap,
    modifiers,
    activeTabIndex,
    orientation,
    homeUrl,
    activePaneId,
    paneIds,
    isSoftCapslockOn
  };
}

export default connect(mapStateToProps)(Browser);
