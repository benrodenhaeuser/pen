const exportToSVG = store => {
  const markup = [];
  const vNode = buildSceneNode(store.scene);

  return convertToMarkup(markup, vNode, 0);
};

const buildSceneNode = (node, svgParent = null) => {
  const svgNode = node.toSVGNode();

  if (svgParent) {
    svgParent.children.push(svgNode);
  }

  for (let child of node.graphicsChildren) {
    buildSceneNode(child, svgNode);
  }

  return svgNode;
};

const convertToMarkup = (markup, svgNode, level) => {
  appendOpenTag(markup, svgNode, level);
  for (let child of svgNode.children) {
    convertToMarkup(markup, child, level + 1);
  }
  appendCloseTag(markup, svgNode, level);

  return markup.join('');
};

const appendOpenTag = (markup, svgNode, level) => {
  const tag = [];

  for (let i = 0; i < level; i += 1) {
    tag.push('  ');
  }

  tag.push('<');
  tag.push(svgNode.tag);

  const propsList = [];

  for (let [key, value] of Object.entries(svgNode.props)) {
    propsList.push(`${key}="${value}"`);
  }

  if (propsList.length > 0) {
    tag.push(' ');
  }

  tag.push(propsList.join(' '));

  tag.push('>');

  // if (svgNode.tag !== 'path') {
  tag.push('\n');
  // }

  markup.push(tag.join(''));
};

const appendCloseTag = (markup, svgNode, level) => {
  const tag = [];

  // if (svgNode.tag !== 'path') {
  for (let i = 0; i < level; i += 1) {
    tag.push('  ');
  }
  // }

  tag.push('</');
  tag.push(svgNode.tag);
  tag.push('>');
  tag.push('\n');

  markup.push(tag.join(''));
};

export { exportToSVG };
