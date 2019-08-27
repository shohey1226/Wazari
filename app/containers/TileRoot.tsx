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
import Browser from "./Browser";
import { WebView } from "react-native-webview";

interface State {
  ids: Array<number>;
}

interface Props {}

class TileRoot extends Component<Props, State> {
  constructor(props) {
    super(props);
    let tree = new TreeModel();
    let root = tree.parse({
      id: 1
    });
    console.log(root);
    this.root = root;

    let newNodeId = this.addPane("Row", 1);
    console.log(this.root);
    // let newNodeId2 = this.addPane("Col", newNodeId);
    // console.log(this.root);

    this.state = {
      //ids: [1, newNodeId, newNodeId2]
      ids: [1, newNodeId]
    };

    this.removePane(newNodeId);
    console.log(this.root);

    // console.log(root);
    // root.addChild(tree.parse({ id: "1.a", size: 50 }));
    // //root.addChild(tree.parse({ id: "1.b" }));
    // let n2 = tree.parse({ id: "2", type: "Row", size: 50 });
    // root.addChild(n2);
    // let n3 = tree.parse({ id: "3", size: 75 });
    // n2.addChild(n3);
    // n2.addChild(tree.parse({ id: "4", size: 25 }));
    // // console.log(n3);
    // // root.addChild(n3);
    // // n3.addChild(tree.parse({ id: "44444444444444444" }));
    // // n3.addChild(tree.parse({ id: "55555555555555555" }));
  }

  componentDidMount() {
    // setTimeout(() => {
    //   this.removePane(1);
    //   this.setState({ ids: this.state.ids.filter(i => i !== 1) });
    // }, 3000);
  }

  addPane(type: "Row" | "Col", targetPaneId: string): number | null {
    let targetNode = this._findNode(targetPaneId);

    if (!targetNode) {
      return null;
    }

    let tree = new TreeModel();
    // make current node branch and create a new node with targetNode.id
    targetNode.model.type = type;
    targetNode.addChild(tree.parse({ id: targetNode.model.id }));
    targetNode.model.id = "branch";
    // add new Node
    let id = Date.now();
    targetNode.addChild(tree.parse({ id: id }));

    return id;
  }

  removePane(targetPaneId) {
    let targetNode = this._findNode(targetPaneId);
    let theOtherNode = targetNode.parent.children.filter(
      n => n.model.id !== targetPaneId
    )[0];

    // if it's branch, then move up the node
    if (theOtherNode.model.id === "branch") {
      theOtherNode.children.forEach(n => {
        targetNode.parent.addChild(n);
      });
      targetNode.parent.model.type = theOtherNode.model.type;
      targetNode.parent.model.id = "branch";
      targetNode.drop();
      theOtherNode.drop();
    } else {
      if (targetNode.parent.isRoot()) {
        targetNode.parent.model.type = null;
        targetNode.parent.model.id = theOtherNode.model.id;
        targetNode.drop();
        theOtherNode.drop();
      } else {
        let grandParent = targetNode.parent.parent;
        grandParent.addChild(theOtherNode);
        targetNode.parent.drop();
        targetNode.drop();
      }
    }
  }

  _findNode(id) {
    let targetNode = this.root.first(node => {
      if (node.model.id === id) {
        return true;
      }
    });
    return targetNode ? targetNode : null;
  }

  renderRecursively(node) {
    let childViews = [];
    if (node.children.length === 0) {
      childViews.push(<Text>{node.model.id}</Text>);
    } else {
      node.children.forEach(child => {
        if (node.model.type === "Col") {
          childViews.push(
            <Col key={child.model.id}>{this.renderRecursively(child)}</Col>
          );
        } else if (node.model.type === "Row") {
          childViews.push(
            <Row key={child.model.id}>{this.renderRecursively(child)}</Row>
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
