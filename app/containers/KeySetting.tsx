import React, { Component } from "react";
import {
  Picker,
  ScrollView,
  NativeModules,
  Modal,
  Switch,
  Alert,
  View
} from "react-native";
import { connect } from "react-redux";
import {
  Button,
  List,
  ListItem,
  Separator,
  Text,
  Body,
  Right,
  Left,
  Icon
} from "native-base";
import { selectModifiers, selectBrowserKeymap } from "../selectors/keymap";
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

enum ModalType {
  Mod,
  Action
}

interface Props {
  modifiers: any;
  browserKeymap: any;
  dispatch: (any) => void;
}

interface States {
  modalVisible: boolean;
  modalType: ModalType;
  focusedModifier: string | null;
  window: string | null;
  action: string | null;
}

type ActionModifier = {
  capslockKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
};

class KeySetting extends Component<Props, States> {
  constructor(props) {
    super(props);
    this.state = {
      focusedModifier: null,
      modalVisible: false,
      modalType: ModalType.Mod,
      window: null,
      action: null
    };
  }

  componentDidUpdate(prevProps) {
    const { modifiers, browserKeymap } = this.props;

    // Update modifiers
    if (!equals(modifiers, prevProps.modifiers)) {
      DAVKeyManager.updateModifiers(modifiers);
      DAVKeyManager.setBrowserKeymap(
        keymapper.convertToNativeFormat(browserKeymap, modifiers)
      );
    }

    if (!isEqual(browserKeymap, prevProps.browserKeymap)) {
      DAVKeyManager.setBrowserKeymap(
        keymapper.convertToNativeFormat(browserKeymap, modifiers)
      );
    }
  }

  toggleModifiersModal(modifierKey) {
    this.setState({
      modalVisible: !this.state.modalVisible,
      focusedModifier: modifierKey,
      modalType: ModalType.Mod
    });
  }

  toggleActionsModal(window, action) {
    this.setState({
      modalVisible: !this.state.modalVisible,
      modalType: ModalType.Action,
      window: window,
      action: action
    });
  }

  onModifierValueChange(value) {
    const { dispatch } = this.props;
    dispatch(updateModifier(this.state.focusedModifier, value));
    this.setState({ modalVisible: false });
  }

  //// Rendering

  renderModifiers() {
    const { modifiers } = this.props;
    let items = [];
    for (let mod in ModifierNames) {
      items.push(
        <ListItem
          key={`modifiers-${mod}`}
          icon
          onPress={() => this.toggleModifiersModal(mod)}
        >
          <Body>
            <Text>{ModifierNames[mod]}</Text>
          </Body>
          <Right>
            <Text>{ModifierNames[modifiers[mod]]}</Text>
            <Icon active name="arrow-forward" />
          </Right>
        </ListItem>
      );
    }
    return items;
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
        <ListItem
          icon
          onPress={() => this.toggleActionsModal(window, action)}
          key={`keymap-${window}-${action}`}
        >
          <Body>
            <Text>{this._toCapitalizedWords(action)}</Text>
          </Body>
          <Right>
            <Text>
              {this._key(keymap[action].key, keymap[action].modifiers)}
            </Text>
            <Icon active name="arrow-forward" />
          </Right>
        </ListItem>
      );
    }
    return rows;
  }

  private _key(key: string, modifiers: ActionModifier) {
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

  private _toCapitalizedWords(name: string) {
    var words = name.match(/[A-Za-z][a-z]*/g);
    return words.map(this._capitalize).join(" ");
  }
  private _capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.substring(1);
  }

  _actionKeyValueChanged(value) {
    const { dispatch, browserKeymap } = this.props;
    if (!this.state.action) return;

    const keyFrom = browserKeymap[this.state.action].key;
    if (this._isUniqueActionKey(this.state.action, value)) {
      dispatch(updateActionKey(this.state.window, this.state.action, value));
    } else {
      Alert.alert(`The key and modifiers are being used`, "");
      dispatch(updateActionKey(this.state.window, this.state.action, keyFrom));
    }
  }

  _actionModifierValueChanged(value, modifier) {
    const { dispatch, browserKeymap } = this.props;
    if (!this.state.action) return;

    const valueFrom = browserKeymap[this.state.action].modifiers[modifier];
    if (this._isUniqueActionModifer(this.state.action, modifier, value)) {
      dispatch(
        updateActionModifier(
          this.state.window,
          this.state.action,
          modifier,
          value
        )
      );
    } else {
      Alert.alert(`The key and modifiers are being used`, "");
      dispatch(
        updateActionModifier(
          this.state.window,
          this.state.action,
          modifier,
          valueFrom
        )
      );
    }
  }

  private _isUniqueActionKey(actionName: string, keyTo: string) {
    const { browserKeymap } = this.props;
    for (let action in browserKeymap) {
      if (actionName === action) {
        continue;
      }
      if (
        keyTo === browserKeymap[action].key &&
        equals(
          browserKeymap[actionName].modifiers,
          browserKeymap[action].modifiers
        )
      ) {
        // already being used
        return false;
      }
    }
    return true;
  }

  private _isUniqueActionModifer(
    actionName: string,
    modifier: string,
    value: boolean
  ) {
    const { browserKeymap } = this.props;
    let modifiersTo = Object.assign({}, browserKeymap[actionName].modifiers);
    modifiersTo[modifier] = value;
    for (let action in browserKeymap) {
      if (actionName === action) {
        continue;
      }
      if (
        browserKeymap[actionName].key === browserKeymap[action].key &&
        equals(browserKeymap[action].modifiers, modifiersTo)
      ) {
        return false;
      }
    }
    return true;
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
    const { modifiers, browserKeymap } = this.props;

    if (this.state.modalType === ModalType.Mod) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <View
            style={{
              width: 300,
              backgroundColor: "white",
              justifyContent: "center",
              margin: 10,
              shadowColor: "#666",
              shadowOffset: {
                width: 0,
                height: 3
              },
              shadowRadius: 5,
              shadowOpacity: 1.0,
              padding: 10
            }}
          >
            <Picker
              selectedValue={modifiers[this.state.focusedModifier]}
              onValueChange={value => this.onModifierValueChange(value)}
            >
              {this.renderModifierPickerItems()}
            </Picker>
            <Button
              block
              onPress={() => this.setState({ modalVisible: false })}
            >
              <Text>CANCEL</Text>
            </Button>
          </View>
        </View>
      );
    } else {
      let keymap = null;
      if (this.state.window === "browser") {
        keymap = browserKeymap[this.state.action];
      }
      if (!keymap) {
        return <View />;
      }

      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <View
            style={{
              width: 300,
              backgroundColor: "white",
              justifyContent: "center",
              margin: 10,
              shadowColor: "#666",
              shadowOffset: {
                width: 0,
                height: 3
              },
              shadowRadius: 5,
              shadowOpacity: 1.0,
              padding: 10
            }}
          >
            <Picker
              selectedValue={keymap.key}
              onValueChange={this._actionKeyValueChanged.bind(this)}
            >
              {this.renderActionKeyPickerItems()}
            </Picker>
            <ListItem icon>
              <Body>
                <Text>Control(^)</Text>
              </Body>
              <Right>
                <Switch
                  onValueChange={value =>
                    this._actionModifierValueChanged(value, "ctrlKey")
                  }
                  value={keymap.modifiers.ctrlKey}
                />
              </Right>
            </ListItem>
            <ListItem icon>
              <Body>
                <Text>Alt/Option(⌥)</Text>
              </Body>
              <Right>
                <Switch
                  onValueChange={value =>
                    this._actionModifierValueChanged(value, "altKey")
                  }
                  value={keymap.modifiers.altKey}
                />
              </Right>
            </ListItem>
            <ListItem icon>
              <Body>
                <Text>Meta/Command(⌘)</Text>
              </Body>
              <Right>
                <Switch
                  onValueChange={value =>
                    this._actionModifierValueChanged(value, "metaKey")
                  }
                  value={keymap.modifiers.metaKey}
                />
              </Right>
            </ListItem>
            <ListItem icon>
              <Body>
                <Text>Shift(⇧)</Text>
              </Body>
              <Right>
                <Switch
                  onValueChange={value =>
                    this._actionModifierValueChanged(value, "shiftKey")
                  }
                  value={keymap.modifiers.shiftKey}
                />
              </Right>
            </ListItem>
            <Button
              block
              onPress={() => this.setState({ modalVisible: false })}
            >
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
        <Separator bordered>
          <Text>Modifier keys</Text>
        </Separator>
        {this.renderModifiers()}
        <Separator bordered>
          <Text>Shortcuts</Text>
        </Separator>
        {this.renderActionKeys("browser", this.props.browserKeymap)}
        <Separator bordered>
          <Text style={{ color: "red" }}>Danger zone</Text>
        </Separator>
        <ListItem onPress={this.setDefault.bind(this)} icon>
          <Body>
            <Text>Set back to default</Text>
          </Body>
          <Right>
            <Icon active name="arrow-forward" />
          </Right>
        </ListItem>
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
  const browserKeymap = selectBrowserKeymap(state);
  return {
    modifiers,
    browserKeymap
  };
}

export default connect(mapStateToProps)(KeySetting);
