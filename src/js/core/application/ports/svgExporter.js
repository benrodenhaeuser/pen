const svgExporter = {
  build(store) {
    const markup = [];
    const vNode = this.buildSceneNode(store.scene);

    return this.convertToMarkup(markup, vNode);
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

  // -- TODO: get spacing right
  // -- TODO: prettification (line breaks and indents)

  convertToMarkup(markup, svgNode) {
    this.appendOpenTag(markup, svgNode);
    for (let child of svgNode.children) {
      this.convertToMarkup(markup, child);
    }
    this.appendCloseTag(markup, svgNode);

    return markup.join('');
  },

  appendOpenTag(markup, svgNode) {
    markup.push('<');
    markup.push(svgNode.tag);
    markup.push(' ');

    for (let [key, value] of Object.entries(svgNode.props)) {
      markup.push(key);
      markup.push('="');
      markup.push(value);
      markup.push('"');
    }

    markup.push('>');
  },

  appendCloseTag(markup, svgNode) {
    markup.push('</');
    markup.push(svgNode.tag);
    markup.push('>');
  },
};

export { svgExporter };
