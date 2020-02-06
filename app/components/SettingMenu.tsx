import React, { Component } from "react";
import { View } from "react-native";
import { List, ListItem, Text, Left, Right, Icon } from "native-base";

export enum MenuItem {
  Key,
  General
}

export interface Props {
  clickMenuItem: (menuItem: MenuItem) => void;
}

class SettingMenu extends Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <List>
        <ListItem onPress={() => this.props.clickMenuItem(MenuItem.Key)}>
          <Left>
            <Text>Keyboard</Text>
          </Left>
          <Right>
            <Icon name="arrow-forward" />
          </Right>
        </ListItem>
        <ListItem onPress={() => this.props.clickMenuItem(MenuItem.General)}>
          <Left>
            <Text>General</Text>
          </Left>
          <Right>
            <Icon name="arrow-forward" />
          </Right>
        </ListItem>
      </List>
    );
  }
}

export default SettingMenu;
