import { SyntaxTree } from '../../domain.js';

const domToSyntaxTree = $svg => {
  if ($svg instanceof SVGElement) {
    const node = SyntaxTree.create();
    return buildTree($svg, node);
  } else {
    return null;
  }
};

const buildTree = ($node, node) => {
  if ($node.nodeName === '#text') {
    const tNode = SyntaxTree.create();
    tNode.markup = $node.nodeValue;
    node.children.push(tNode);
  } else {
    let openTag = `<${$node.nodeName}`;
    const attrs = [];
    for (let attr of $node.attributes) {
      attrs.push(`${attr.name}="${attr.value}"`);
    }
    openTag = [openTag, ...attrs].join(' ');
    openTag += '>';

    const closeTag = `</${$node.nodeName}>`;

    const openNode = SyntaxTree.create();
    const closeNode = SyntaxTree.create();

    openNode.markup = openTag;
    openNode.tag = $node.nodeName;
    closeNode.markup = closeTag;
    closeNode.tag = $node.nodeName;

    openNode.key = $node.key;
    closeNode.key = $node.key;

    node.children.push(openNode);

    if ($node.childNodes.length > 0) {
      const innerNode = SyntaxTree.create();

      for (let $child of $node.childNodes) {
        buildTree($child, innerNode);
      }

      node.children.push(innerNode);
    }

    node.children.push(closeNode);

    return node;
  }

  for (let $child of $node.childNodes) {
    node.children.push(buildTree($child));
  }

  return node;
};

export { domToSyntaxTree };
