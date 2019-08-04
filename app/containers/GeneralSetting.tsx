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
import { Picker } from "react-native";
import ModalFrame from "../components/ModalFrame";
import SearchEnginePicker from "../components/SearchEnginePicker";
import Modal from "react-native-modal";
import { updateHome } from "../actions/user";

interface State {
  isModalVisible: boolean;
  searchEngine: string;
  homeUrl: string;
}

class GeneralSetting extends Component<any, State> {
  constructor(props) {
    super(props);
    this.state = {
      isModalVisible: false,
      searchEngine: "google",
      homeUrl: props.homeUrl
    };
  }

  onSearchEngineValueChange(value) {
    this.setState({ searchEngine: value });
  }

  renderModalContent() {
    return (
      <ModalFrame>
        <SearchEnginePicker
          onValueChange={this.onSearchEngineValueChange.bind(this)}
          searchEngine={this.state.searchEngine}
        />
        <Button block onPress={() => this.setState({ isModalVisible: false })}>
          <Text>CLOSE</Text>
        </Button>
      </ModalFrame>
    );
  }

  toggleModal(modalType: string) {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  }

  onSubmitHomeEditing() {
    const { dispatch } = this.props;
    dispatch(updateHome(this.state.homeUrl));
  }

  render() {
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
            <Text>{this.state.searchEngine}</Text>
            <Icon active name="arrow-forward" />
          </Right>
        </ListItem>
        <View>
          <Modal
            isVisible={this.state.isModalVisible}
            animationIn="fadeIn"
            animationOut="fadeOut"
          >
            {this.renderModalContent()}
          </Modal>
        </View>
      </List>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const homeUrl = state.user.get("homeUrl");
  return {
    homeUrl
  };
}

export default connect(mapStateToProps)(GeneralSetting);
