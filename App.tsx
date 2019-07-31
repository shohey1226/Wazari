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
import { Text, View } from "react-native";
import { Provider } from "react-redux";
import {
  createStackNavigator,
  createAppContainer,
  StackActions,
  StatusBar
} from "react-navigation";
import { StyleProvider } from "native-base";
import getTheme from "./native-base-theme/components";
import platform from "./native-base-theme/variables/platform";

import Browser from "./app/containers/Browser";
import Setting from "./app/components/Setting";
import NavBar from "./app/containers/NavBar";
import configureStore from "./app/configureStore";
import { PersistGate } from "redux-persist/integration/react";

const { store, persistor } = configureStore({});

persistor.purge();

let RootStack = createStackNavigator({
  Home: {
    screen: Browser,
    navigationOptions: ({ navigation }) => ({
      title: "",
      header: (
        <NavBar
          onPressSetting={() => navigation.navigate({ routeName: "Setting" })}
        />
      )
    })
  },
  Setting: {
    screen: Setting,
    navigationOptions: () => ({
      title: "Setting"
    })
  }
});
let Navigation = createAppContainer(RootStack);

class App extends React.Component {
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
