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
  text: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface Props {
  dispatch: (any) => void;
  activeTabIndex: number;
  sites: any;
}

class NavBar extends Component<Props, IState, any> {
  constructor(props) {
    super(props);
    const site = props.sites[props.activeTabIndex];
    this.state = {
      text: "",
      canGoBack: site && site.canGoBack ? site.canGoBack : false,
      canGoForward: site && site.canGoForward ? site.canGoForward : false
    };
  }

  componentDidMount() {}

  componentDidUpdate(prevProp) {
    const { activeTabIndex, sites } = this.props;
    const site = sites[activeTabIndex];
    const prevSite = prevProp.sites[prevProp.activeTabIndex];
    if (
      activeTabIndex !== prevProp.activeTabIndex ||
      site.url !== prevSite.url
    ) {
      this.setState({
        canGoBack: site.canGoBack,
        canGoForward: site.canGoForward
      });
    }
  }

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
    const { canGoBack, canGoForward } = this.props;
    return (
      <Header searchBar rounded>
        <Button
          transparent
          light
          onPress={this.onPressToggleBack.bind(this)}
          disabled={!this.state.canGoBack}
        >
          <Icon name="ios-arrow-back" />
        </Button>
        <Button
          transparent
          light
          onPress={this.onPressToggleForward.bind(this)}
          style={{ marginRight: 20 }}
          disabled={!this.state.canGoForward}
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
        <Button transparent light onPress={() => this.props.onPressSetting()}>
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
