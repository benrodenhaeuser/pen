// exploratory code

const exportToAST = (state) => {
  const root = freshNode();
  parse(state.store.scene, root, 0);

  console.log(render(root));

  return root;
};

// produce an xml syntax tree from scenegraph node
const parse = (node, astParent, level) => {
  const openingTag = node.toOpeningTag();
  openingTag.level = level;
  astParent.children.push(openingTag);

  if (node.graphicsChildren.length > 0) {
    const fresh = freshNode();
    astParent.children.push(fresh);
    for (let child of node.graphicsChildren) {
      parse(child, fresh, level + 1);
    }
  }

  const closingTag = node.toClosingTag();
  closingTag.level = level;
  astParent.children.push(closingTag);
};

// flatten tree to a list
const flatten = (astNode, list = []) => {
  if (astNode.markup) {
    list.push(astNode);
  } else {
    for (let child of astNode.children) {
      flatten(child, list);
    }
  }

  return list;
};

// render properly indented markup string
const render = (astNode) => {
  const list = flatten(astNode);

  for (let i = 0; i < list.length; i += 1) {
    list[i] = indent(list[i].level) + list[i].markup;
  }

  return list.join('\n');
};

const indent = (level) => {
  let pad = '  ';
  let ind = '';

  for (let i = 0; i < level; i += 1) {
    ind = pad + ind;
  }

  return ind;
};


const freshNode = (tagName) => {
  return {
    children: [],
  };
};


export { exportToAST };
