import React, { Component } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import {
  Button,
  Text,
  Container,
  Header,
  Tab,
  Tabs,
  ScrollableTab
} from "native-base";
import Window from "./Window";
import { selectSites } from "../selectors/ui";
import { addNewTab, selectTab } from "../actions/ui";

class TabBar extends Component {
  constructor(props) {
    super(props);
    //this.onPressTab = this.onPressTab.bind(this);
  }

  componentDidMount() {
    const { dispatch, sites } = this.props;
    if (sites.length === 0) {
      dispatch(addNewTab("https://www.wazaterm.com"));
      dispatch(addNewTab("https://www.google.com"));
    }
    //setTimeout(() => this.tabsRef.goToPage(1), 3000);
  }

  // onPressTab(index) {
  //   const { dispatch } = this.props;
  //   dispatch(selectTab(index));
  // }

  renderTabs() {
    const { sites } = this.props;
    let tabs = [];
    for (let i = 0; i < sites.length; i++) {
      const tabTitle = sites[i].title || sites[i].url;
      tabs.push(
        <Tab heading={tabTitle}>
          <Window key={`tab-${i}`} url={sites[i].url} />
        </Tab>
      );
    }
    return tabs;
  }

  render() {
    const {} = this.props;
    return (
      <Tabs
        ref={r => (this.tabsRef = r as any)}
        renderTabBar={() => <ScrollableTab />}
      >
        {this.renderTabs()}
      </Tabs>
    );
  }
}

function mapStateToProps(state, ownProps) {
  // const activeTabIndex = state.ui.get("activeTabIndex");
  const sites = selectSites(state);
  // return { activeTabIndex, sites };
  return { sites };
}

export default connect(mapStateToProps)(TabBar);
