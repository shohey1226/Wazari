import React, { Component } from "react";
import { connect } from "react-redux";
import { NativeModules, NativeEventEmitter } from "react-native";
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
import { addTile, removeTile } from "../actions/ui";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  ids: Array<number>;
}

interface Props {
  dispatch: (any) => void;
  activeTileId: number;
}

class TileRoot extends Component<Props, State> {
  subscriptions: Array<any> = [];

  constructor(props) {
    super(props);
    let tree = new TreeModel();
    let root = tree.parse({
      id: 1
    });
    console.log(root);
    this.root = root;

    let newNodeId = this.addNode("Row", 1);
    console.log(this.root);
    let newNodeId2 = this.addNode("Col", newNodeId);
    // console.log(this.root);

    this.state = {
      //ids: [1, newNodeId, newNodeId2]
      ids: [1, newNodeId]
    };

    //this.removeNode(newNodeId);
    console.log(this.root);

    console.log(this.root.all());

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
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions)
    );
    // setTimeout(() => {
    //   this.removePane(1);
    //   this.setState({ ids: this.state.ids.filter(i => i !== 1) });
    // }, 3000);
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  handleAppActions(event) {
    const { dispatch, activeTileId } = this.props;
    console.log(event);
    switch (event.action) {
      case "addRow":
        this.addNode("Row", adtiveTileId);
        break;
      case "addColumn":
        this.addNode("Col", adtiveTileId);
        break;
    }
  }

  addNode(type: "Row" | "Col", targetPaneId: string): number | null {
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

  removeNode(targetPaneId) {
    const { dispatch } = this.props;

    let targetNode = this._findNode(targetPaneId);
    let theOtherNode = targetNode.parent.children.filter(
      n => n.model.id !== targetPaneId
    )[0];

    // Assume this tree
    // R + - + - 1
    //   |   |
    //   |   + - 2
    //   + - 3

    // When we delete 3, the counter part is branch, which we need to move them up.
    if (theOtherNode.model.id === "branch") {
      theOtherNode.children.forEach(n => {
        targetNode.parent.addChild(n);
      });
      targetNode.parent.model.type = theOtherNode.model.type;
      targetNode.parent.model.id = "branch";
      targetNode.drop();
      theOtherNode.drop();
    } else {
      // R + - 1
      //   |
      //   + - 2
      // When the parent is Root, then only have one node
      if (targetNode.parent.isRoot()) {
        targetNode.parent.model.type = null;
        targetNode.parent.model.id = theOtherNode.model.id;
        targetNode.drop();
        theOtherNode.drop();

        // When we delete 1, remove the branch and move the counter part up.
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
    return <Grid>{v}</Grid>;
  }
}

function mapStateToProps(state, ownProps) {
  const activeTileId = state.ui.get("activeTileId");
  return { activeTileId };
}

export default connect(mapStateToProps)(TileRoot);
