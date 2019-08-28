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
import { addPane, removePane, updatePaneBlueprint } from "../actions/ui";
import TreeUtils from "../utils/tree";
import { selectAppKeymap, selectModifiers } from "../selectors/keymap";
import keymapper from "../utils/Keymapper";

const { DAVKeyManager } = NativeModules;
const DAVKeyManagerEmitter = new NativeEventEmitter(DAVKeyManager);

interface State {
  ids: Array<number>;
}

interface Props {
  dispatch: (any) => void;
  activePaneId: number;
  keymap: any;
  modifiers: any;
}

class TileRoot extends Component<Props, State> {
  subscriptions: Array<any> = [];
  root: any = {}; // TreeModel node object

  constructor(props) {
    super(props);

    // https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    if (
      Object.entries(props.paneBlueprint).length === 0 &&
      props.paneBlueprint.constructor === Object
    ) {
      let tree = new TreeModel();
      this.root = tree.parse({
        id: 1
      });
      props.dispatch(addPane(1));
    } else {
      this.root = TreeUtils.deserialize(props.paneBlueprint);
    }

    this.handleAppActions = this.handleAppActions.bind(this);

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
    const { dispatch, keymap, modifiers } = this.props;

    DAVKeyManager.setAppKeymap(
      keymapper.convertToNativeFormat(keymap, modifiers)
    );
    this.subscriptions.push(
      DAVKeyManagerEmitter.addListener("RNAppKeyEvent", this.handleAppActions)
    );

    DAVKeyManager.turnOnKeymap();
    DAVKeyManager.setMode("text");

    // let newNodeId = TreeUtils.addNode(this.root, "Row", 1);
    // dispatch(addPane(newNodeId));
    // let newNodeId2 = TreeUtils.addNode(this.root, "Col", newNodeId);
    // dispatch(addPane(newNodeId2));
    // let obj = TreeUtils.serialize(this.root);
    // dispatch(updatePaneBlueprint(obj));

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
    const { dispatch, activePaneId } = this.props;
    console.log(event);
    switch (event.action) {
      case "addRowPane":
        dispatch(addPane(TreeUtils.addNode(this.root, "Row", activePaneId)));
        break;
      case "addColumnPane":
        dispatch(addPane(TreeUtils.addNode(this.root, "Col", activePaneId)));
        break;
      case "removePane":
        TreeUtils.removeNode(this.root, activePaneId);
        dispatch(removePane(activePaneId));
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
  const activePaneId = state.ui.get("activePaneId");
  const paneBlueprint = state.ui.get("paneBlueprint").toJS();
  const keymap = selectAppKeymap(state);
  const modifiers = selectModifiers(state);
  return { activePaneId, paneBlueprint, keymap, modifiers };
}

export default connect(mapStateToProps)(TileRoot);
