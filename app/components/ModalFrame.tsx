import React from "react";
import { View } from "react-native";

function ModalFrame(props) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <View
        style={{
          justifyContent: "flex-start",
          width: 300,
          backgroundColor: "white",
          margin: 10,
          shadowColor: "#666",
          shadowOffset: {
            width: 0,
            height: 3
          },
          shadowRadius: 5,
          shadowOpacity: 1.0,
          padding: 10
        }}
      >
        {props.children}
      </View>
    </View>
  );
}

export default ModalFrame;
