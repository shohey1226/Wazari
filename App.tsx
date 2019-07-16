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
  StackActions
} from "react-navigation";
import { Button, Icon } from "@shoutem/ui";
import Browser from "./app/containers/Browser";
import KeySetting from "./app/containers/KeySetting";
import configureStore from "./app/configureStore";

const store: any = configureStore({});

let RootStack = createStackNavigator({
  Home: {
    screen: Browser,
    navigationOptions: ({ navigation }) => ({
      title: "",
      headerRight: (
        <Button
          styleName="clear"
          onPress={() => navigation.navigate({ routeName: "Setting" })}
        >
          <Icon name="settings" />
        </Button>
      )
    })
  },
  Setting: {
    screen: KeySetting,
    navigationOptions: () => ({
      title: "Setting"
    })
  }
});
let Navigation = createAppContainer(RootStack);

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Navigation />
      </Provider>
    );
  }
}

export default App;
