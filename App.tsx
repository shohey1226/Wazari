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
import { Button, Icon, Header, Item, Input } from "native-base";
import Browser from "./app/containers/Browser";
import Setting from "./app/components/Setting";
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
        <Header searchBar rounded>
          <Item>
            <Icon name="ios-search" />
            <Input placeholder="Search" />
            <Icon name="ios-people" />
          </Item>
          <Button
            transparent
            dark
            onPress={() => navigation.navigate({ routeName: "Setting" })}
          >
            <Icon name="settings" />
          </Button>
        </Header>
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
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Navigation />
        </PersistGate>
      </Provider>
    );
  }
}

export default App;
