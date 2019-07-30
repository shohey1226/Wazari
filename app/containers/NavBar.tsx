import React, { Component } from "react";
import { View, NativeModules, NativeEventEmitter } from "react-native";
import { connect } from "react-redux";
import { Button, Icon, Header, Item, Input, Left } from "native-base";
import { selectBrowserKeymap, selectModifiers } from "../selectors/keymap";
import { selectSites } from "../selectors/ui";
import {
  addNewTab,
  selectTab,
  updateSite,
  toggleBack,
  toggleForward
} from "../actions/ui";

interface IState {
  isLoading: boolean;
  isActive: boolean;
  text: string;
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  sites: any;
}

class NavBar extends Component<Props, IState, any> {
  constructor(props) {
    super(props);
    this.state = { text: "" };
  }

  componentDidMount() {}

  componentDidUpdate(prevProp) {}

  onEndEditing() {
    const { dispatch, activeTabIndex, sites } = this.props;
    if (/^http/.test(this.state.text)) {
      dispatch(addNewTab(this.state.text));
    } else {
      dispatch(addNewTab(`https://www.google.com/search?q=${this.state.text}`));
    }
    this.setState({ text: "" });
  }

  onPressToggleBack() {
    const { dispatch } = this.props;
    dispatch(toggleBack());
  }

  onPressToggleForward() {
    const { dispatch } = this.props;
    dispatch(toggleForward());
  }

  render() {
    return (
      <Header searchBar rounded>
        <Button transparent dark onPress={this.onPressToggleBack.bind(this)}>
          <Icon name="ios-arrow-back" />
        </Button>
        <Button
          transparent
          dark
          onPress={this.onPressToggleForward.bind(this)}
          style={{ marginRight: 20 }}
        >
          <Icon name="ios-arrow-forward" />
        </Button>
        <Item>
          <Icon name="ios-search" />
          <Input
            placeholder="URL or Search with Google"
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
