// exploratory code

const exportToAST = (state) => {
  const root = freshNode();
  parse(state.store.scene, root);

  console.log(flatten(root));

  // populate with length information
  // populate with key info etc

  return root;
};

// produce an xml syntax tree from scenegraph node
const parse = (node, astParent) => {
  const astOpen  = node.toOpeningTag();
  const astClose = node.toClosingTag();

  astParent.children.push(astOpen);

  let fresh;

  if (node.graphicsChildren.length > 0) {
    fresh = freshNode();
    astParent.children.push(fresh);
  }

  astParent.children.push(astClose);

  for (let child of node.graphicsChildren) {
    parse(child, fresh);
  }
};

// flatten tree to a list of markup strings
const flatten = (astNode, list = []) => {
  if (astNode.markup) {
    list.push(astNode);
  } else {
    for (let child of astNode.children) {
      flatten(child, list);
    }
  }

  return list;
}

const freshNode = (tagName) => {
  return {
    children: [],
  };
}


export { exportToAST };
