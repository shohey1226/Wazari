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
import { Provider } from "react-redux";
import { createStackNavigator, createAppContainer } from "react-navigation";
import Browser from "./app/containers/Browser";
import configureStore from "./app/configureStore";

const store: any = configureStore({});

let RootStack = createStackNavigator(
  {
    Home: {
      screen: Browser
    }
  },
  {
    headerMode: "none"
  }
);
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
