import React, { Component } from "react";
import { View, Text } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Col, Row, Grid } from "react-native-easy-grid";
import SettingMenu from "./SettingMenu";
import KeySetting from "../containers/KeySetting";
import { StackActions } from "react-navigation";

class Setting extends Component {
  clickMenuItem(item: string) {
    console.log(item);
    if (DeviceInfo.isTablet()) {
    } else {
      this.props.navigation.navigate({ routeName: "KeySetting" });
    }
  }

  render() {
    if (DeviceInfo.isTablet()) {
      return (
        <Grid>
          <Col size={1}>
            <SettingMenu clickMenuItem={this.clickMenuItem.bind(this)} />
          </Col>
          <Col size={2}>
            <View>
              <KeySetting />
            </View>
          </Col>
        </Grid>
      );
    } else {
      return <SettingMenu clickMenuItem={this.clickMenuItem.bind(this)} />;
    }
  }
}

export default Setting;
