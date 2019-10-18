import React, { Component } from "react";
import { View, Image } from "react-native";
import url from "url";

class Favicon extends Component {
  render() {
    if (this.props.url) {
      let domain = url.parse(this.props.url).host;
      return (
        <Image
          style={{
            width: 10,
            height: 10
          }}
          source={{
            uri: `https://s2.googleusercontent.com/s2/favicons?domain=${domain}`
          }}
        />
      );
    } else {
      return <View />;
    }
  }
}

export default Favicon;
