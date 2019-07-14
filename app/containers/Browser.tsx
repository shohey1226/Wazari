import React, { Component } from "react";
import { WebView } from "react-native-webview";
import { Text, View } from "react-native";
import sVim from "../utils/sVim";

interface IState {
  isLoading: boolean;
}

class Browser extends Component<{}, IState, any> {
  webref: WebView | null = null;

  constructor(props) {
    super(props);
    this.state = { isLoading: true };
  }

  componentDidMount() {
    sVim.init(() => {
      this.setState({ isLoading: false });
    });

    setTimeout(() => {
      this.webref !== null && this.webref.injectJavaScript(`sVimHint.start()`);
    }, 3000);
  }

  render() {
    if (this.state.isLoading) {
      return <View />;
    } else {
      return (
        <WebView
          ref={r => (this.webref = r as any)}
          source={{ uri: "https://www.wazaterm.com" }}
          hideKeyboardAccessoryView={true}
          injectedJavaScript={injectingJs
            .replace("SVIM_PREDEFINE", sVim.sVimPredefine)
            .replace("SVIM_GLOBAL", sVim.sVimGlobal)
            .replace("SVIM_HELPER", sVim.sVimHelper)
            .replace("SVIM_TAB", sVim.sVimTab)
            .replace("SVIM_HINT", sVim.sVimHint)}
        />
      );
    }
  }
}

let injectingJs = `
SVIM_PREDEFINE
SVIM_HELPER
SVIM_TAB
SVIM_GLOBAL
SVIM_HINT
sVimTab.bind();

window.receivedHitAHintFromReactNative = function() {
  sVimHint.start();
}
window.receivedScrollDownFromReactNative = function() {
  sVimTab.commands.scrollDown();
}
window.receivedScrollUpFromReactNative = function() {
  sVimTab.commands.scrollUp();
}
true
`;

export default Browser;
