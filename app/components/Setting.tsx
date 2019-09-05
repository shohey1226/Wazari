import React, { Component } from "react";
import { View, Text, Dimensions } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { default as SettingMenu, MenuItem } from "./SettingMenu";
import KeySetting from "../containers/KeySetting";
import GeneralSetting from "../containers/GeneralSetting";
import ExcludedPatternList from "../containers/ExcludedPatternList";
import { StackActions } from "react-navigation";

interface State {
  currentMenuItem: MenuItem;
  width: number;
}

interface Props {
  navigation: any;
}

class Setting extends Component<Props, State> {
  handler = dims => this.setState({ width: dims.window.width });

  constructor(props) {
    super(props);
    this.state = {
      currentMenuItem: MenuItem.Key,
      width: Dimensions.get("window").width
    };
  }

  componentDidMount() {
    Dimensions.addEventListener("change", this.handler);
  }
  componentWillMount() {
    Dimensions.removeEventListener("change", this.handler);
  }

  clickMenuItem(item: MenuItem) {
    if (this.state.width > 414) {
      switch (item) {
        case MenuItem.Key:
          this.setState({ currentMenuItem: MenuItem.Key });
          break;
        case MenuItem.General:
          this.setState({ currentMenuItem: MenuItem.General });
          break;
        case MenuItem.ExcludedPatterns:
          this.setState({ currentMenuItem: MenuItem.ExcludedPatterns });
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
        case MenuItem.ExcludedPatterns:
          this.props.navigation.navigate({ routeName: "ExcludedPatternList" });
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
      case MenuItem.ExcludedPatterns:
        return <ExcludedPatternList />;
    }
  }

  render() {
    if (this.state.width > 414) {
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
