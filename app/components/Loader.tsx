import React, { Component } from "react";
import { View } from "react-native";
import {
  Placeholder,
  PlaceholderMedia,
  PlaceholderLine,
  Shine
} from "rn-placeholder";

class LoaderView extends Component {
  render() {
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white"
        }}
      >
        <Placeholder style={{ padding: 50 }} Animation={Shine}>
          <PlaceholderLine width={80} />
          <PlaceholderLine />
          <PlaceholderLine width={40} />
          <PlaceholderLine />
          <PlaceholderLine width={30} />
          <PlaceholderLine width={50} />
          <PlaceholderLine />
          <PlaceholderLine />
          <PlaceholderLine width={80} />
          <PlaceholderLine />
        </Placeholder>
      </View>
    );
  }
}

export default LoaderView;
