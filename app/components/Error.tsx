import React, { Component } from "react";
import { View, Text } from "react-native";

class Error extends Component {
  constructor(props) {
    super(props);
    if (props.name === "NSURLErrorDomain") {
      this.state = { message: "Network" };
    }
  }
  render() {
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#333"
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <Text style={{ color: "white", fontSize: 20 }}>
            Error ({this.state.message})
          </Text>
        </View>
      </View>
    );
  }
}

export default Error;
