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
  Button
} from "native-base";
import { Col, Row, Grid } from "react-native-easy-grid";
import TreeModel from "tree-model";

interface State {}

interface Props {}

class TileRoot extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {};
    let tree = new TreeModel();
    let root = tree.parse({
      name: "1",
      type: "Col"
    });
    // console.log(root);
    root.addChild(tree.parse({ name: "1.a", size: 50 }));
    //root.addChild(tree.parse({ name: "1.b" }));
    let n2 = tree.parse({ name: "2", type: "Row", size: 50 });
    root.addChild(n2);
    let n3 = tree.parse({ name: "3", size: 75 });
    n2.addChild(n3);
    n2.addChild(tree.parse({ name: "4", size: 25 }));
    // console.log(n3);
    // root.addChild(n3);
    // n3.addChild(tree.parse({ name: "44444444444444444" }));
    // n3.addChild(tree.parse({ name: "55555555555555555" }));
    console.log(root);
    this.root = root;
  }

  componentDidMount() {
    // let n3 = root.first(node => {
    //   if (node.model.name === 3) {
    //     return true;
    //   }
    // });
  }

  renderRecursively(node) {
    let childViews = [];
    if (node.children.length === 0) {
      childViews.push(<Text>{node.model.name}</Text>);
    } else {
      node.children.forEach(child => {
        if (node.model.type === "Col") {
          childViews.push(
            <Col size={child.model.size}>{this.renderRecursively(child)}</Col>
          );
        } else if (node.model.type === "Row") {
          childViews.push(
            <Row size={child.model.size}>{this.renderRecursively(child)}</Row>
          );
        }
      });
    }
    return childViews;
  }

  render() {
    let v = this.renderRecursively(this.root);
    console.log(v);
    return <Grid>{v}</Grid>;
  }
}

function mapStateToProps(state, ownProps) {
  return {};
}

export default connect(mapStateToProps)(TileRoot);
