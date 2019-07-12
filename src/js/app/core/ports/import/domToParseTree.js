import { ParseTree } from '../../domain.js';

const domToParseTree = ($svg) => {
  if ($svg instanceof SVGElement) {
    const pNode = ParseTree.create();
    return buildTree($svg, pNode);
  } else {
    return null;
  }
};

const buildTree = ($node, pNode) => {
  if ($node.nodeName === '#text') {
    const tNode = ParseTree.create();
    tNode.markup = $node.nodeValue;
    pNode.children.push(tNode);
  } else {
    let openTag;

    openTag = `<${$node.nodeName}`;
    const attrs = [];
    for (let attr of $node.attributes) {
      attrs.push(`${attr.name}="${attr.value}"`);
    }
    openTag = [openTag, ...attrs].join(' ');
    openTag += '>';

    const closeTag = `</${$node.nodeName}>`;

    const openNode  = ParseTree.create();
    const closeNode = ParseTree.create();

    openNode.markup  = openTag;
    openNode.tag     = $node.nodeName;
    closeNode.markup = closeTag;
    closeNode.tag    = $node.nodeName;

    openNode.key = $node.key;
    closeNode.key = $node.key;

    pNode.children.push(openNode);

    if ($node.childNodes.length > 0) {
      const innerNode = ParseTree.create();

      for (let $child of $node.childNodes) {
        buildTree($child, innerNode);
      }

      pNode.children.push(innerNode);
    }

    pNode.children.push(closeNode);

    return pNode;
  }

  for (let $child of $node.childNodes) {
    pNode.children.push(buildTree($child));
  }

  return pNode;
};

export { domToParseTree };
