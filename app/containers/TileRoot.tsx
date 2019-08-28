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
import { addTile, removeTile, updateTileBlueprint } from "../actions/ui";
import TreeUtils from "../utils/tree";

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
  root: any = {}; // TreeModel node object

  constructor(props) {
    super(props);

    // https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    if (
      Object.entries(props.tileBlueprint).length === 0 &&
      props.tileBlueprint.constructor === Object
    ) {
      let tree = new TreeModel();
      this.root = tree.parse({
        id: 1
      });
      props.dispatch(addTile(1));
    } else {
      this.root = TreeUtils.deserialize(props.tileBlueprint);
    }

    //TreeUtils.removeNode(root, 1);

    // this.state = {
    //   //ids: [1, newNodeId, newNodeId2]
    //   ids: [1, newNodeId]
    // };

    //console.log(tree);

    //console.log(r);

    //this.root = r;

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
    const { dispatch } = this.props;
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions)
    );

    // let newNodeId = TreeUtils.addNode(this.root, "Row", 1);
    // dispatch(addTile(newNodeId));
    // let newNodeId2 = TreeUtils.addNode(this.root, "Col", newNodeId);
    // dispatch(addTile(newNodeId2));
    // let obj = TreeUtils.serialize(this.root);
    // dispatch(updateTileBlueprint(obj));

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
        TreeUtils.addNode(this.root, "Row", activeTileId);
        break;
      case "addColumn":
        TreeUtils.addNode(this.root, "Col", activeTileId);
        break;
    }
  }

  renderRecursively(node) {
    let childViews = [];
    if (node.children.length === 0) {
      childViews.push(<Text key={node.model.id}>{node.model.id}</Text>);
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
  const tileBlueprint = state.ui.get("tileBlueprint").toJS();
  return { activeTileId, tileBlueprint };
}

export default connect(mapStateToProps)(TileRoot);
