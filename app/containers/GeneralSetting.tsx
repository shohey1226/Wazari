import React, { Component } from "react";
import { connect } from "react-redux";
import {
  View,
  List,
  ListItem,
  Text,
  Left,
  Body,
  Right,
  Icon,
  Input,
  Item,
  Button
} from "native-base";
import { Picker, Modal } from "react-native";
import ModalFrame from "../components/ModalFrame";
import SearchEnginePicker from "../components/SearchEnginePicker";

import { updateHome, updateSearchEngine } from "../actions/user";
import { SearchEngine } from "../components/SearchEnginePicker";

interface State {
  isModalVisible: boolean;
  homeUrl: string;
  modalType: string | null;
}

interface Props {
  searchEngine: SearchEngine;
  dispatch: (any) => void;
  homeUrl: string;
}

class GeneralSetting extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      isModalVisible: false,
      modalType: "searchEngine",
      homeUrl: props.homeUrl
    };
  }

  onSearchEngineValueChange(value) {
    const { dispatch } = this.props;
    dispatch(updateSearchEngine(value));
  }

  renderModalContainer() {
    let content = <View />;
    if (this.state.modalType === "searchEngine") {
      content = (
        <SearchEnginePicker
          onValueChange={this.onSearchEngineValueChange.bind(this)}
          searchEngine={this.props.searchEngine}
        />
      );
    }
    return (
      <ModalFrame>
        {content}
        <Button block onPress={() => this.setState({ isModalVisible: false })}>
          <Text>CLOSE</Text>
        </Button>
      </ModalFrame>
    );
  }

  toggleModal(modalType: string) {
    this.setState({
      isModalVisible: !this.state.isModalVisible,
      modalType: modalType
    });
  }

  onSubmitHomeEditing() {
    const { dispatch } = this.props;
    dispatch(updateHome(this.state.homeUrl));
  }

  render() {
    const { searchEngine } = this.props;
    return (
      <List>
        <ListItem>
          <Left>
            <Text>Home Page</Text>
          </Left>
          <Body>
            <Input
              onChangeText={text => this.setState({ homeUrl: text })}
              value={this.state.homeUrl}
              onSubmitEditing={this.onSubmitHomeEditing.bind(this)}
            />
          </Body>
        </ListItem>
        <ListItem icon onPress={() => this.toggleModal("searchEngine")}>
          <Body>
            <Text>Search Engine</Text>
          </Body>
          <Right>
            <Text>{searchEngine}</Text>
            <Icon active name="arrow-forward" />
          </Right>
        </ListItem>
        <View>
          <Modal
            visible={this.state.isModalVisible}
            animationType="fade"
            transparent={true}
          >
            {this.renderModalContainer()}
          </Modal>
        </View>
      </List>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const homeUrl = state.user.get("homeUrl");
  const searchEngine = state.user.get("searchEngine");
  return {
    homeUrl,
    searchEngine
  };
}

export default connect(mapStateToProps)(GeneralSetting);
