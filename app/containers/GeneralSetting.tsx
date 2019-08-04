import React, { Component } from "react";
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

interface State {
  isModalVisible: boolean;
  searchEngine: string;
}

class GeneralSetting extends Component<any, State> {
  constructor(props) {
    super(props);
    this.state = {
      isModalVisible: false,
      searchEngine: "google"
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
          <Text>CANCEL</Text>
        </Button>
      </ModalFrame>
    );
  }

  toggleModal(modalType: string) {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  }

  render() {
    return (
      <List>
        <ListItem>
          <Left>
            <Text>Home Page</Text>
          </Left>
          <Body>
            <Input placeholder="https://www.google.com" />
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

export default GeneralSetting;
