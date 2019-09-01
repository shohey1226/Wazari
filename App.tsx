/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/emin93/react-native-template-typescript
 *
 * @format
 */

import React, { Fragment } from "react";
import { Text, View, NativeModules, NativeEventEmitter } from "react-native";
import { Provider } from "react-redux";
import {
  createStackNavigator,
  createAppContainer,
  StackActions,
  StatusBar
} from "react-navigation";
import Orientation from "react-native-orientation";
import { StyleProvider } from "native-base";
import getTheme from "./native-base-theme/components";
import platform from "./native-base-theme/variables/platform";
import { updateOrientation } from "./app/actions/ui";
import Browser from "./app/containers/Browser";
import PaneRoot from "./app/containers/PaneRoot";
import Setting from "./app/components/Setting";
import KeySetting from "./app/containers/KeySetting";
import GeneralSetting from "./app/containers/GeneralSetting";
import ExcludedPatternList from "./app/containers/ExcludedPatternList";
import NavBar from "./app/containers/NavBar";
import SettingBackButton from "./app/components/SettingBackButton";
import configureStore from "./app/configureStore";
import { PersistGate } from "redux-persist/integration/react";
import { selectAppKeymap, selectModifiers } from "./app/selectors/keymap";
import keymapper from "./app/utils/Keymapper";
const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

const { store, persistor } = configureStore({});

//persistor.purge();

let RootStack = createStackNavigator({
  Home: {
    screen: PaneRoot,
    navigationOptions: ({ navigation }) => ({
      title: "",
      header: <NavBar {...navigation} />
    })
  },
  Setting: {
    screen: Setting,
    navigationOptions: ({ navigation }) => ({
      title: "Setting",
      headerLeft: <SettingBackButton {...navigation} />
    })
  },
  KeySetting: {
    screen: KeySetting,
    navigationOptions: () => ({
      title: "Key Setting"
    })
  },
  GeneralSetting: {
    screen: GeneralSetting,
    navigationOptions: () => ({
      title: "General Setting"
    })
  },
  ExcludedPatternList: {
    screen: ExcludedPatternList,
    navigationOptions: () => ({
      title: "Excluded Patterns"
    })
  }
});
let Navigation = createAppContainer(RootStack);

class App extends React.Component {
  componentDidMount() {
    const state = store.getState();
    const appKeymap = selectAppKeymap(state);
    const modifiers = selectModifiers(state);
    DAVKeyManager.updateModifiers(modifiers);
    DAVKeyManager.setAppKeymap(
      keymapper.convertToNativeFormat(appKeymap, modifiers)
    );
    Orientation.addOrientationListener(this._orientationDidChange);
  }

  _orientationDidChange = orientation => {
    const { dispatch } = store;
    dispatch(updateOrientation(orientation));
  };

  componentWillUnmount() {
    Orientation.removeOrientationListener(this._orientationDidChange);
  }

  render() {
    return (
      <StyleProvider style={getTheme(platform)}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <Navigation />
          </PersistGate>
        </Provider>
      </StyleProvider>
    );
  }
}

export default App;
