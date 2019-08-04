import React from "react";
import { View, Picker } from "react-native";

function SearchEnginePicker(props) {
  return (
    <Picker
      selectedValue={props.searchEngine}
      onValueChange={itemValue => props.onValueChange(itemValue)}
    >
      <Picker.Item label="Google" value="google" />
      <Picker.Item label="DuckDuckGo" value="duckduckgo" />
    </Picker>
  );
}

export default SearchEnginePicker;
