import React, { Component } from "react";
import {
  Picker,
  ScrollView,
  NativeModules,
  TextInput,
  Modal,
  Switch,
  Alert
} from "react-native";
import { connect } from "react-redux";
import {
  Button,
  Text,
  View,
  Subtitle,
  Caption,
  Divider,
  Row,
  TouchableOpacity,
  Icon
} from "@shoutem/ui";
import {
  selectModifiers,
  selectDesktopKeymap,
  selectBrowserKeymap,
  selectTerminalKeymap
} from "../selectors/keymap";
import {
  updateModifier,
  updateActionModifier,
  updateActionKey,
  setDefault
} from "../actions/keymap";

import equals from "is-equal-shallow";
import { isEqual } from "lodash"; // deep comparison
import keymapper from "../utils/Keymapper";

const { DAVKeyManager } = NativeModules;

const ModifierNames = {
  ctrlKey: "Control(^)",
  metaKey: "Meta/Command(⌘)",
  altKey: "Alt/Option(⌥)",
  capslockKey: "Caps Lock(⇪)"
};

class KeySetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      focusedModifier: null,
      modalVisible: false,
      modalType: null,
      window: null,
      action: null
    };
  }

  componentWillReceiveProps(nextProps) {
    const {
      modifiers,
      desktopKeymap,
      browserKeymap,
      terminalKeymap
    } = this.props;

    // Update modifiers
    if (!equals(this.props.modifiers, nextProps.modifiers)) {
      DAVKeyManager.updateModifiers(nextProps.modifiers);
    }

    if (!isEqual(this.props.desktopKeymap, nextProps.desktopKeymap)) {
      DAVKeyManager.setDesktopKeymap(
        keymapper.convertToNativeFormat(
          nextProps.desktopKeymap,
          nextProps.modifiers
        )
      );
    }

    if (!isEqual(this.props.browserKeymap, nextProps.browserKeymap)) {
      DAVKeyManager.setBrowserKeymap(
        keymapper.convertToNativeFormat(
          nextProps.browserKeymap,
          nextProps.modifiers
        )
      );
    }
  }

  toggleModifiersModal(modifierKey) {
    this.setState({
      modalVisible: !this.state.modalVisible,
      focusedModifier: modifierKey,
      modalType: "modifiers"
    });
  }

  toggleActionsModal(window, action) {
    this.setState({
      modalVisible: !this.state.modalVisible,
      modalType: "actions",
      window: window,
      action: action
    });
  }

  onModifierValueChange(value) {
    const { dispatch } = this.props;
    dispatch(updateModifier(this.state.focusedModifier, value));
    this.setState({ modalVisible: false });
  }

  renderModifierPickerItems() {
    const { modifiers } = this.props;
    let items = [];
    for (let mod in ModifierNames) {
      items.push(
        <Picker.Item
          label={ModifierNames[mod]}
          value={mod}
          key={`pickerItem${mod}`}
        />
      );
    }
    return items;
  }

  renderActionKeyPickerItems() {
    let items = [];
    const chars =
      "abcdefghijklmnopqrstuvwxyz1234567890~!@#$%^&*()_+{}|\":?><-=[];'";
    for (let i = 0, len = chars.length; i < len; i++) {
      items.push(
        <Picker.Item
          label={chars[i]}
          value={chars[i]}
          key={`pickerItem${chars[i]}`}
        />
      );
    }
    items.push(<Picker.Item label="Tab" value="Tab" key="pickerItemTab" />);
    items.push(<Picker.Item label="Up" value="up" key="pickerItemUp" />);
    items.push(<Picker.Item label="Down" value="down" key="pickerItemDown" />);
    items.push(<Picker.Item label="Left" value="left" key="pickerItemLeft" />);
    return items;
  }

  renderActionKeys(window, keymap) {
    let rows = [];
    for (let action in keymap) {
      rows.push(
        <TouchableOpacity
          onPress={() => this.toggleActionsModal(window, action)}
          key={`keymap-${window}-${action}`}
        >
          <Row>
            <Text>{this._toCapitalizedWords(action)}</Text>
            <Text>
              {this._key(keymap[action].key, keymap[action].modifiers)}
            </Text>
            <Icon styleName="disclosure" name="right-arrow" />
          </Row>
        </TouchableOpacity>
      );
    }
    rows.push(<Divider key={`dividerActionKeys`} />);
    return rows;
  }

  _key(key, modifiers) {
    return `${Object.keys(modifiers)
      .filter(mod => modifiers[mod] === true)
      .map(mod =>
        mod
          .replace("Key", "")
          .replace("alt", "⌥")
          .replace("meta", "⌘")
          .replace("ctrl", "^")
          .replace("shift", "⇧")
      )
      .join("+")} - ${key}`;
  }

  _toCapitalizedWords(name) {
    var words = name.match(/[A-Za-z][a-z]*/g);
    return words.map(this._capitalize).join(" ");
  }
  _capitalize(word) {
    return word.charAt(0).toUpperCase() + word.substring(1);
  }

  _actionKeyValueChanged(value) {
    const { dispatch } = this.props;
    dispatch(updateActionKey(this.state.window, this.state.action, value));
  }
  _actionModifierValueChanged(value, modifier) {
    const { dispatch } = this.props;
    dispatch(
      updateActionModifier(
        this.state.window,
        this.state.action,
        modifier,
        value
      )
    );
  }

  setDefault() {
    const { dispatch } = this.props;
    Alert.alert(
      "Do you want to reset key settings?",
      "",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "Set Default", onPress: () => dispatch(setDefault()) }
      ],
      { cancelable: false }
    );
  }

  renderModalContent() {
    const {
      modifiers,
      desktopKeymap,
      browserKeymap,
      terminalKeymap
    } = this.props;

    if (this.state.modalType === "modifiers") {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center"
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              justifyContent: "center",
              margin: 10,
              shadowColor: "#666",
              shadowOffset: {
                width: 0,
                height: 3
              },
              shadowRadius: 5,
              shadowOpacity: 1.0
            }}
          >
            <Picker
              selectedValue={modifiers[this.state.focusedModifier]}
              onValueChange={value => this.onModifierValueChange(value)}
            >
              {this.renderModifierPickerItems()}
            </Picker>
            <Button onPress={() => this.setState({ modalVisible: false })}>
              <Text>CANCEL</Text>
            </Button>
          </View>
        </View>
      );
    } else {
      let keymap = null;
      if (this.state.window === "browser") {
        keymap = browserKeymap[this.state.action];
      } else if (this.state.window === "desktop") {
        keymap = desktopKeymap[this.state.action];
      }
      if (!keymap) {
        return <View />;
      }

      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center"
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              justifyContent: "center",
              margin: 10,
              shadowColor: "#666",
              shadowOffset: {
                width: 0,
                height: 3
              },
              shadowRadius: 5,
              shadowOpacity: 1.0
            }}
          >
            <Picker
              selectedValue={keymap.key}
              onValueChange={this._actionKeyValueChanged.bind(this)}
            >
              {this.renderActionKeyPickerItems()}
            </Picker>
            <Row>
              <Text>Control(^)</Text>
              <Switch
                onValueChange={value =>
                  this._actionModifierValueChanged(value, "ctrlKey")
                }
                value={keymap.modifiers.ctrlKey}
              />
            </Row>
            <Row>
              <Text>Alt/Option(⌥)</Text>
              <Switch
                onValueChange={value =>
                  this._actionModifierValueChanged(value, "altKey")
                }
                value={keymap.modifiers.altKey}
              />
            </Row>
            <Row>
              <Text>Meta/Command(⌘)</Text>
              <Switch
                onValueChange={value =>
                  this._actionModifierValueChanged(value, "metaKey")
                }
                value={keymap.modifiers.metaKey}
              />
            </Row>
            <Row>
              <Text>Shift(⇧)</Text>
              <Switch
                onValueChange={value =>
                  this._actionModifierValueChanged(value, "shiftKey")
                }
                value={keymap.modifiers.shiftKey}
              />
            </Row>
            <Button onPress={() => this.setState({ modalVisible: false })}>
              <Text>CLOSE</Text>
            </Button>
          </View>
        </View>
      );
    }
  }

  render() {
    const { modifiers } = this.props;
    return (
      <ScrollView>
        <Divider />
        <Caption styleName="h-center">Caps Lock Key(⇪)</Caption>
        <TouchableOpacity
          onPress={() => this.toggleModifiersModal("capslockKey")}
        >
          <Row styleName="small">
            <Text>{ModifierNames[modifiers.capslockKey]}</Text>
            <Icon styleName="disclosure" name="right-arrow" />
          </Row>
        </TouchableOpacity>

        <Divider />
        <Caption styleName="h-center">Control Key(^)</Caption>
        <TouchableOpacity onPress={() => this.toggleModifiersModal("ctrlKey")}>
          <Row styleName="small">
            <Text>{ModifierNames[modifiers.ctrlKey]}</Text>
            <Icon styleName="disclosure" name="right-arrow" />
          </Row>
        </TouchableOpacity>
        <Divider />
        <Caption styleName="h-center">Alt/Option Key(⌥)</Caption>
        <TouchableOpacity onPress={() => this.toggleModifiersModal("altKey")}>
          <Row styleName="small">
            <Text>{ModifierNames[modifiers.altKey]}</Text>
            <Icon styleName="disclosure" name="right-arrow" />
          </Row>
        </TouchableOpacity>
        <Divider />
        <Caption styleName="h-center">Meta/Command Key(⌘)</Caption>
        <TouchableOpacity onPress={() => this.toggleModifiersModal("metaKey")}>
          <Row styleName="small">
            <Text>{ModifierNames[modifiers.metaKey]}</Text>
            <Icon styleName="disclosure" name="right-arrow" />
          </Row>
        </TouchableOpacity>
        <Divider />
        <Divider />
        <Subtitle styleName="h-center">Action Keys</Subtitle>
        <Divider />
        <Caption styleName="h-center">Desktop</Caption>
        {this.renderActionKeys("desktop", this.props.desktopKeymap)}

        <Divider />
        <Caption styleName="h-center">Browser</Caption>
        {this.renderActionKeys("browser", this.props.browserKeymap)}

        <Divider />
        <Divider />
        <TouchableOpacity onPress={this.setDefault.bind(this)}>
          <Row styleName="small">
            <Text style={{ marginLeft: 10 }}>Set back to default</Text>
            <Icon styleName="disclosure" name="right-arrow" />
          </Row>
        </TouchableOpacity>
        <Divider />
        <Divider />

        <Modal
          visible={this.state.modalVisible}
          animationType="fade"
          transparent={true}
        >
          {this.renderModalContent()}
        </Modal>
      </ScrollView>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const modifiers = selectModifiers(state);
  const desktopKeymap = selectDesktopKeymap(state);
  const browserKeymap = selectBrowserKeymap(state);
  return {
    modifiers,
    desktopKeymap,
    browserKeymap
  };
}

export default connect(mapStateToProps)(KeySetting);
