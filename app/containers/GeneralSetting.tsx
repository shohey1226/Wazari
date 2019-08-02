import React, { Component } from "react";
import { View, List, ListItem, Text, Left, Right, Icon } from "native-base";
import DeviceInfo from "react-native-device-info";

class GeneralSetting extends Component {
  render() {
    return (
      <List>
        <ListItem>
          <Left>
            <Text>General key1</Text>
          </Left>
          <Right>
            <Icon name="arrow-forward" />
          </Right>
        </ListItem>
      </List>
    );
  }
}

export default GeneralSetting;
