import React, { Component } from "react";
import { WebView } from "react-native-webview";
import { Text, View } from "react-native";

class Browser extends Component {
  render() {
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ html: "<h1>Hello world</h1>" }}
      />
    );
  }
}

export default Browser;
