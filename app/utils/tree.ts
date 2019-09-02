import TreeModel from "tree-model";

module.exports = {
  addNode(
    rootNode: any, // Node
    type: "Row" | "Col",
    targetNodeId: string
  ): number | null {
    let targetNode = _findNode(rootNode, targetNodeId);

    if (!targetNode) {
      return null;
    }

    let tree = new TreeModel();
    // make current node branch and create a new node with targetNode.id
    targetNode.model.type = type;
    targetNode.addChild(tree.parse({ id: targetNode.model.id, size: 50 }));
    targetNode.model.id = "branch";
    // add new Node
    let id = Date.now().toString();
    targetNode.addChild(tree.parse({ id: id, size: 50 }));

    return id;
  },

  increaseSize(rootNode: any, targetNodeId: string) {
    let targetNode = _findNode(rootNode, targetNodeId);
    let theOtherNode = targetNode.parent.children.filter(
      n => n.model.id !== targetNodeId
    )[0];
    let size = targetNode.model.size;
    if (size <= 100) {
      size++;
      targetNode.model.size = size;
      theOtherNode.model.size = 100 - size;
    }
  },

  decreaseSize(rootNode: any, targetNodeId: string) {
    let targetNode = _findNode(rootNode, targetNodeId);
    let theOtherNode = targetNode.parent.children.filter(
      n => n.model.id !== targetNodeId
    )[0];
    let size = targetNode.model.size;
    if (size > 0) {
      size--;
      targetNode.model.size = size;
      theOtherNode.model.size = 100 - size;
    }
  },

  removeNode(rootNode, targetNodeId: number): void {
    let targetNode = _findNode(rootNode, targetNodeId);
    let theOtherNode = targetNode.parent.children.filter(
      n => n.model.id !== targetNodeId
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
  },

  serialize(root) {
    return _serializeNode(root);
  },

  deserialize(obj) {
    var tree = new TreeModel();
    let root = tree.parse({ id: "tempRoot" });
    _deserialize(root, obj);
    // looks there is no way to create empty tree
    delete root.children[0].parent;
    return root.children[0];
  },

  isValidTree(root, paneIds): boolean {
    let nodeIds = root
      .all(node => node.model.id !== "branch")
      .map(n => n.model.id);
    paneIds.forEach(paneId => {
      if (nodeIds.indexOf(paneId) === -1) {
        return false;
      }
    });
    return true;
  }
};

function _findNode(rootNode, id) {
  let targetNode = rootNode.first(node => {
    if (node.model.id === id) {
      return true;
    }
  });
  return targetNode ? targetNode : null;
}

function _deserialize(node, obj) {
  let tree = new TreeModel();
  let childNode = node.addChild(
    tree.parse({ id: obj.id, type: obj.type, size: obj.size })
  );
  obj.children.forEach(o => {
    _deserialize(childNode, o);
  });
  return node;
}

// https://stackoverflow.com/questions/52063481/how-to-create-a-tree-structure-representation-in-json
function _serializeNode(node) {
  let treeObj = {
    id: node.model.id,
    type: node.model.type,
    size: node.model.size,
    children: []
  };
  node.children.forEach(n => {
    treeObj.children.push(_serializeNode(n));
  });
  return treeObj;
}
