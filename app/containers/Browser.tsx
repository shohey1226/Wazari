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
import Favicon from "../components/Favicon";
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
  tabViews: Array<any> = [];

  constructor(props) {
    super(props);
    this.state = {
      activeIndex: props.activeTabIndex,
      isActivePane: props.paneId === props.activePaneId
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

  renderTabs() {
    const { sites, keyMode, activeTabIndex, paneId } = this.props;
    let tabs = [];
    for (let i = 0; i < sites.length; i++) {
      const tabTitle = sites[i].title
        ? this._truncate(sites[i].title)
        : this._truncate(sites[i].url);

      tabs.push(
        <Tab
          key={`tab-${i}`}
          heading={
            <TabHeading
              style={{
                paddingLeft: 5,
                paddingRight: 0,
                justifyContent: "flex-start"
              }}
            >
              <View style={{ marginLeft: 5 }}>
                <Favicon url={sites[i].url} />
              </View>
              <Text
                style={{
                  textAlign: "left",
                  fontSize: 10.5,
                  width: 105
                }}
              >
                {tabTitle}
              </Text>
              <Button
                transparent
                light
                onPress={() => this.pressCloseTab(i)}
                style={{ alignSelf: "center" }}
              >
                <Icon
                  name="md-close"
                  style={{
                    marginRight: 5,
                    fontSize: 13
                  }}
                />
              </Button>
            </TabHeading>
          }
        >
          <TabWindow
            url={sites[i].url}
            tabNumber={i}
            keyMode={keyMode}
            isActive={activeTabIndex === i && this.state.isActivePane}
            activeTabIndex={activeTabIndex}
            {...this.props}
          />
        </Tab>
      );
    }
    return tabs;
  }

  render() {
    const { activeTabIndex, orientation, sites, paneIds, paneId } = this.props;

    let style = { height: 35 };
    if (
      sites.length < 2 ||
      (orientation === "LANDSCAPE" && DeviceInfo.getDeviceType() === "Handset")
    ) {
      style = { height: 0 };
    }

    return (
      <Tabs
        ref={r => (this.tabsRef = r as any)}
        renderTabBar={() => (
          <ScrollableTab style={{ backgroundColor: "#222", ...style }} />
        )}
        onChangeTab={this.onChangeTab.bind(this)}
        style={{
          borderWidth: this.state.isActivePane && paneIds.length > 1 ? 1 : 0,
          borderColor: "#30d158"
        }}
        scrollWithoutAnimation={true}
        locked={true}
      >
        {this.renderTabs()}
      </Tabs>
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
