import React, { Component } from "react";
import { View, Text } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Col, Row, Grid } from "react-native-easy-grid";
import { default as SettingMenu, MenuItem } from "./SettingMenu";
import KeySetting from "../containers/KeySetting";
import GeneralSetting from "../containers/GeneralSetting";
import { StackActions } from "react-navigation";

interface State {
  currentMenuItem: MenuItem;
}

class Setting extends Component<{}, State> {
  constructor(props) {
    super(props);
    this.state = {
      currentMenuItem: MenuItem.Key
    };
  }

  clickMenuItem(item: MenuItem) {
    if (DeviceInfo.isTablet()) {
      switch (item) {
        case MenuItem.Key:
          this.setState({ currentMenuItem: MenuItem.Key });
          break;
        case MenuItem.General:
          this.setState({ currentMenuItem: MenuItem.General });
          break;
      }
    } else {
      switch (item) {
        case MenuItem.Key:
          this.props.navigation.navigate({ routeName: "KeySetting" });
          break;
        case MenuItem.General:
          this.props.navigation.navigate({ routeName: "GeneralSetting" });
          break;
      }
    }
  }

  renderContent() {
    switch (this.state.currentMenuItem) {
      case MenuItem.Key:
        return <KeySetting />;
      case MenuItem.General:
        return <GeneralSetting />;
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
            <View>{this.renderContent()}</View>
          </Col>
        </Grid>
      );
    } else {
      return <SettingMenu clickMenuItem={this.clickMenuItem.bind(this)} />;
    }
  }
}

export default Setting;
