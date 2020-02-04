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

// https://qiita.com/hirocueki2/items/137400e236189a0a6b3e
function _truncate(str) {
  let len = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(
    str
  )
    ? 9
    : 16;
  return str.length <= len ? str : str.substr(0, len) + "...";
}

class Tab extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      tab,
      page,
      isTabActive,
      onPressHandler,
      onTabLayout,
      styles,
      siteTitle,
      siteUrl
    } = this.props;

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
      fontSize: 12,
      marginLeft: 10,
      marginRight: 10,
      color: "white"
    };

    return (
      <TouchableOpacity
        style={style}
        onPress={onPressHandler}
        onLayout={onTabLayout}
        key={page}
      >
        <View style={containerStyle}>
          <Favicon url={siteUrl} />
          <Text style={textStyle}>{siteTitle}</Text>
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
  }
}

function mapStateToTabProps(state, ownProps) {
  const sites = selectSites(state, ownProps.paneId);
  let siteTitle = "";
  let siteUrl = "";
  for (let i = 0; i < sites.length; i++) {
    if (sites[i].id === ownProps.tab.id) {
      siteTitle = sites[i].title
        ? _truncate(sites[i].title)
        : _truncate(sites[i].url);
      siteUrl = sites[i].url;
      break;
    }
  }
  return {
    siteTitle,
    siteUrl
  };
}

export default connect(mapStateToTabProps)(Tab);
