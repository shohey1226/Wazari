import React from "react";
import { View, Picker } from "react-native";

export enum SearchEngine {
  Google = "Google",
  DuckDuckGo = "DuckDuckGo"
}

function SearchEnginePicker(props) {
  let pickerItems: Array<any> = [];
  for (let engine in SearchEngine) {
    pickerItems.push(
      <Picker.Item
        key={`searchengine-picker-item-${engine}`}
        label={engine}
        value={engine}
      />
    );
  }
  return (
    <Picker
      selectedValue={props.searchEngine}
      onValueChange={itemValue => props.onValueChange(itemValue)}
    >
      {pickerItems}
    </Picker>
  );
}

export default SearchEnginePicker;
