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

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  activeIndex: number;
  isActivePane: boolean;
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
  orientation: string;
  homeUrl: string;
  keySwitchOn: boolean;
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
      siteIds: [],
      siteTitles: {}
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

    // virtual keyboard is used
    // this.keyboardDidShowListener = Keyboard.addListener(
    //   "keyboardDidShow",
    //   () => {
    //     const { keyMode } = this.props;
    //     keyMode !== KeyMode.Direct && dispatch(updateMode(KeyMode.Direct));
    //   }
    // );
    // this.keyboardDidHideListener = Keyboard.addListener(
    //   "keyboardDidHide",
    //   () => {
    //     const { keyMode } = this.props;
    //     keyMode !== KeyMode.Direct && dispatch(updateMode(KeyMode.Text));
    //   }
    // );
    if (activeTabIndex) {
      setTimeout(() => {
        this.tabsRef.goToPage(activeTabIndex);
      }, 50);
    }
    this.setSites();
  }

  componentWillUnmount() {
    // this.keyboardDidShowListener.remove();
    // this.keyboardDidHideListener.remove();
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
      case KeyMode.Text:
        DAVKeyManager.turnOnKeymap();
        DAVKeyManager.setMode("text");
        break;
      case KeyMode.Terminal:
        DAVKeyManager.turnOnKeymap();
        DAVKeyManager.setMode("input");
        break;
      case KeyMode.Direct:
        DAVKeyManager.turnOffKeymap();
        break;
      case KeyMode.Browser:
        DAVKeyManager.turnOnKeymap();
        DAVKeyManager.setMode("browser");
        break;
      case KeyMode.Search:
        DAVKeyManager.turnOnKeymap();
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

    if (!isEqual(sites, prevProp.sites)) {
      let siteTitles = {};
      sites.forEach(s => {
        const tabTitle = s.title
          ? this._truncate(s.title)
          : this._truncate(s.url);
        return (siteTitles[s.id] = tabTitle);
      });
      this.setState({
        siteTitles: siteTitles
      });
    }
  }

  setSites() {
    const { sites } = this.props;
    const siteIds = sites.map(s => s.id);
    let siteTitles = {};
    sites.forEach(s => {
      const tabTitle = s.title
        ? this._truncate(s.title)
        : this._truncate(s.url);
      return (siteTitles[s.id] = tabTitle);
    });
    this.setState(
      {
        siteIds: siteIds,
        siteTitles: siteTitles
      },
      () => {
        this.buildTabs();
      }
    );
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
          this.pressCloseTab(activeTabIndex, activePaneId);
          break;
      }
    }
  };

  // https://qiita.com/hirocueki2/items/137400e236189a0a6b3e
  _truncate(str) {
    let len = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(
      str
    )
      ? 9
      : 16;
    return str.length <= len ? str : str.substr(0, len) + "...";
  }

  pressCloseTab(i) {
    const { dispatch, sites, activeTabIndex, paneId } = this.props;
    dispatch(closeTab(i, paneId));
    if (i === activeTabIndex) {
      if (sites.length > i + 1) {
        dispatch(selectTab(i));
      } else {
        setTimeout(() => {
          dispatch(selectTab(i - 1));
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
    if (activeTabIndex !== tab.i) {
      dispatch(selectTab(tab.i));
    }
    this.setState({ activeIndex: tab.i });
  }

  buildTabs() {
    const { sites, keyMode, activeTabIndex, paneId } = this.props;
    for (let i = 0; i < sites.length; i++) {
      let view: any = null;
      if (keyMode === KeyMode.Terminal) {
        view = (
          <WVTerm
            url={sites[i].url}
            tabLabel={{
              label: this.state.siteTitles[sites[i].id],
              onPressButton: () => this.pressCloseTab(i),
              url: sites[i].url
            }}
            {...this.props}
          />
        );
      } else {
        view = (
          <TabWindow
            tabLabel={{
              label: this.state.siteTitles[sites[i].id],
              id: sites[i].id,
              onPressButton: () => this.pressCloseTab(i),
              url: sites[i].url
            }}
            url={sites[i].url}
            tabNumber={i}
            keyMode={keyMode}
            isActive={activeTabIndex === i && this.state.isActivePane}
            activeTabIndex={activeTabIndex}
            {...this.props}
          />
        );
      }
      this.tabViews[sites[i].id] = view;
    }
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
                key={page}
                tab={tab}
                page={page}
                isTabActive={isTabActive}
                onPressHandler={onPressHandler}
                onTabLayout={onTabLayout}
                tabTitles={this.state.siteTitles}
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

const Tab = ({
  tab,
  page,
  isTabActive,
  onPressHandler,
  onTabLayout,
  styles,
  tabTitles
}) => {
  const { label, url, onPressButton, id } = tab;
  const style = {
    marginHorizontal: 1,
    paddingVertical: 0.5
  };
  const containerStyle = {
    paddingRight: 0,
    paddingLeft: 12.5,
    paddingVertical: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 37.5
  };
  const textStyle = {
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 10,
    marginRight: 10,
    color: "white"
  };
  console.log(tabTitles);
  return (
    <TouchableOpacity
      style={style}
      onPress={onPressHandler}
      onLayout={onTabLayout}
      key={page}
    >
      <View style={containerStyle}>
        <Favicon url={url} />
        <Text style={textStyle}>{tabTitles[id]}</Text>
        <Button
          style={{ height: 37.5 }}
          transparent
          dark
          onPress={() => onPressButton()}
        >
          <Icon
            name="md-close"
            style={{
              paddingRight: 5,
              fontSize: 13,
              color: "#fff"
            }}
          />
        </Button>
      </View>
    </TouchableOpacity>
  );
};

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
