import React, { Component } from "react";
import { View, NativeModules, NativeEventEmitter } from "react-native";
import { connect } from "react-redux";
import { Button, Icon, Header, Item, Input } from "native-base";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { addNewTab, selectTab, updateSite } from "../actions/ui";

interface IState {
  isLoading: boolean;
  isActive: boolean;
}

class NaviBar extends Component<{}, IState, any> {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  componentDidUpdate(prevProp) {}

  render() {
    return (
      <Header searchBar rounded>
        <Item>
          <Icon name="ios-search" />
          <Input placeholder="Search" />
          <Icon name="ios-people" />
        </Item>
        <Button transparent dark onPress={() => this.props.onPressSetting()}>
          <Icon name="settings" />
        </Button>
      </Header>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const keymap = selectBrowserKeymap(state);
  const modifiers = selectModifiers(state);
  const activeTabIndex = state.ui.get("activeTabIndex");
  return {
    keymap,
    modifiers,
    activeTabIndex
  };
}

export default connect(mapStateToProps)(NaviBar);
