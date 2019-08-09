import React, { Component } from "react";
import { connect } from "react-redux";
import {
  View,
  List,
  ListItem,
  Text,
  Left,
  Body,
  Right,
  Icon,
  Input,
  Item,
  Button,
  Separator
} from "native-base";
import { updateExcludedPattern, removeExcludedPattern } from "../actions/user";

interface State {
  patterns: Array<string>;
}

interface Props {
  excludedPatterns: Array<string>;
  dispatch: (any) => void;
}

class ExcludedPatterns extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      patterns: props.excludedPatterns
    };
  }

  onSubmitHomeEditing(index) {
    const { dispatch, excludedPatterns } = this.props;
    dispatch(
      updateExcludedPattern(excludedPatterns[index], this.state.patterns[index])
    );
  }

  onPressDelete(pattern) {
    const { dispatch, excludedPatterns } = this.props;
    dispatch(removeExcludedPattern(pattern));
  }

  renderPatterns() {
    const { excludedPatterns } = this.props;
    return excludedPatterns.map((pattern, i) => {
      return (
        <ListItem key={`excluded-pattern-${i}`}>
          <Body>
            <Input
              onChangeText={text => {
                this.setState({
                  patterns: { ...this.state.patterns, [i]: text }
                });
              }}
              value={this.state.patterns[i]}
              onSubmitEditing={() => this.onSubmitHomeEditing(i)}
            />
          </Body>
          <Right>
            <Button
              transparent
              danger
              onPress={() => this.onPressDelete(pattern)}
            >
              <Icon name="trash" />
            </Button>
          </Right>
        </ListItem>
      );
    });
  }

  render() {
    return (
      <List>
        <Text style={{ color: "#666", fontSize: 12.5, margin: 10 }}>
          Some web sites don't use INPUT or TEXTAREA HTML Tag for the input,
          which Wazari's keymap doesn't work (IME like Japanese doesn't work
          neigther). This is to exclude these web sites to disable Wazari's
          keyinput. ("Patterns" are URL regular expressions)
        </Text>
        <ListItem itemDivider>
          <Text>Patterns</Text>
        </ListItem>
        {this.renderPatterns()}
      </List>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const excludedPatterns = state.user.get("excludedPatterns").toArray();
  return {
    excludedPatterns
  };
}

export default connect(mapStateToProps)(ExcludedPatterns);
