import React, { Component } from "react";
import { connect } from "react-redux";
import Browser from "./Browser";
import {
  addPane,
  removePane
  // updatePaneBlueprint,
  // selectPane
} from "../actions/ui";

interface State {
  // isModalVisible: boolean;
  // homeUrl: string;
}

interface Props {}

class SecondScreen extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { isLoading: true };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(addPane("secondScreen"));
    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    // this looks working
    dispatch(removePane("secondScreen"));
  }

  render() {
    if (this.state.isLoading) {
      return null;
    } else {
      return <Browser paneId={"secondScreen"} />;
    }
  }
}

function mapStateToProps(state, ownProps) {
  return {};
}

export default connect(mapStateToProps)(SecondScreen);
