import React, { Component } from "react";
import { View, Text } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Col, Row, Grid } from "react-native-easy-grid";
import SettingMenu from "./SettingMenu";
import KeySetting from "../containers/KeySetting";

class Setting extends Component {
  clickMenuItem(item: string) {
    console.log(item);
  }

  render() {
    if (DeviceInfo.isTablet()) {
      return (
        <Grid>
          <Col size={1}>
            <SettingMenu clickMenuItem={this.clickMenuItem} />
          </Col>
          <Col size={2}>
            <View>
              <KeySetting />
            </View>
          </Col>
        </Grid>
      );
    } else {
      return (
        <View>
          <Text>phone</Text>
        </View>
      );
    }
  }
}

export default Setting;
