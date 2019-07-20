import React, { Component } from "react";
import { View, NativeModules, NativeEventEmitter } from "react-native";
import { connect } from "react-redux";
import { Button, Icon, Header, Item, Input } from "native-base";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { selectSites } from "../selectors/ui";
import { addNewTab, selectTab, updateSite } from "../actions/ui";

interface IState {
  isLoading: boolean;
  isActive: boolean;
  text: string;
}

class NavBar extends Component<{}, IState, any> {
  constructor(props) {
    super(props);
    this.state = { text: "" };
  }

  componentDidMount() {}

  componentDidUpdate(prevProp) {}

  onEndEditing() {
    const { dispatch, activeTabIndex, sites } = this.props;
    dispatch(addNewTab(this.state.text));
    this.setState({ text: "" });
  }

  render() {
    return (
      <Header searchBar rounded>
        <Item>
          <Icon name="ios-search" />
          <Input
            placeholder="Search"
            onChangeText={text => this.setState({ text })}
            value={this.state.text}
            autoCorrect={false}
            onEndEditing={this.onEndEditing.bind(this)}
            textContentType="URL"
            autoCapitalize="none"
          />
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
  const sites = selectSites(state);
  return {
    keymap,
    modifiers,
    activeTabIndex,
    sites
  };
}

export default connect(mapStateToProps)(NavBar);
