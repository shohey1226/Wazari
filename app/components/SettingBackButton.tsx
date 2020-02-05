import React, { Component } from "react";
import { View, NativeModules } from "react-native";
import { Button, Text, Icon } from "native-base";

const { DAVKeyManager } = NativeModules;

class SettingBackButton extends Component {
  onPressBack() {
    //DAVKeyManager.turnOnKeymap();
    this.props.pop();
  }

  render() {
    return (
      <Button
        onPress={() => this.onPressBack()}
        transparent
        style={{ marginLeft: 16 }}
      >
        <Icon name="arrow-back" />
        <Text style={{ paddingLeft: 4 }}>Back</Text>
      </Button>
    );
  }
}

export default SettingBackButton;
