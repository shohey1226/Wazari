import React, { Component } from "react";
import { View } from "react-native";
import { List, ListItem, Text, Left, Right, Icon } from "native-base";

export interface Props {
  clickMenuItem: (menuItem: string) => void;
}

class SettingMenu extends Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <List>
        <ListItem onPress={() => this.props.clickMenuItem("keyboard")}>
          <Left>
            <Text>Keyboard</Text>
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
