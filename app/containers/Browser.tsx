import React, { Component } from "react";
import { WebView } from "react-native-webview";
import { Text, View } from "react-native";

class Browser extends Component {
  render() {
    return (
      <WebView
        source={{ uri: "https://www.wazaterm.com" }}
        hideKeyboardAccessoryView={true}
      />
    );
  }
}

export default Browser;
