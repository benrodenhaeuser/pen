const svgExporter = {
  build(store) {
    const markup = [];
    const vNode = this.buildSceneNode(store.scene);

    return this.convertToMarkup(markup, vNode, 0);
  },

  buildSceneNode(node, svgParent = null) {
    const svgNode = node.toSVGNode();

    if (svgParent) {
      svgParent.children.push(svgNode);
    }

    for (let child of node.graphicsChildren) {
      this.buildSceneNode(child, svgNode);
    }

    return svgNode;
  },

  convertToMarkup(markup, svgNode, level) {
    this.appendOpenTag(markup, svgNode, level);
    for (let child of svgNode.children) {
      this.convertToMarkup(markup, child, level + 1);
    }
    this.appendCloseTag(markup, svgNode, level);

    return markup.join('');
  },

  appendOpenTag(markup, svgNode, level) {
    const tag = [];

    for (let i = 0; i < level; i += 1) {
      tag.push('    ');
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
  },

  appendCloseTag(markup, svgNode, level) {
    const tag = [];

    // if (svgNode.tag !== 'path') {
      for (let i = 0; i < level; i += 1) {
        tag.push('    ');
      }
    // }

    tag.push('</');
    tag.push(svgNode.tag);
    tag.push('>');
    tag.push('\n');

    markup.push(tag.join(''));
  },
};

export { svgExporter };
