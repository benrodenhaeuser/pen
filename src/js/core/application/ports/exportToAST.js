// exploratory code

const exportToAST = (state) => {
  const root = freshNode();
  parse(state.store.scene, root);

  console.log(root);
  console.log(render(root));

  // populate with length information
  // populate with key info etc

  return root;
};

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

const render = (astNode, markup = []) => {
  if (astNode.markup) {
    markup.push(astNode.markup);
  } else {
    for (let child of astNode.children) {
      render(child, markup);
    }
  }

  return markup.join('');
}

const freshNode = (tagName) => {
  return {
    children: [],
  };
}


export { exportToAST };
