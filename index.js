/**
 * @format
 */

import { AppRegistry } from "react-native";
import { App, SecondScreenApp } from "./App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent("SecondScreen", () => SecondScreenApp);
