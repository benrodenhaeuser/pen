import { MarkupNode } from '../../domain/_.js';

const domToSyntaxTree = $svg => {
  if ($svg instanceof SVGElement) {
    const node = MarkupNode.create();
    return buildTree($svg, node);
  } else {
    return null;
  }
};

const buildTree = ($node, node) => {
  if ($node.nodeName === '#text') {
    const tNode = MarkupNode.create();
    tNode.markup = $node.nodeValue;
    node.append(tNode);
  } else {
    let openTag = `<${$node.nodeName}`;
    const attrs = [];
    for (let attr of $node.attributes) {
      attrs.push(`${attr.name}="${attr.value}"`);
    }
    openTag = [openTag, ...attrs].join(' ');
    openTag += '>';

    const closeTag = `</${$node.nodeName}>`;

    const openNode = MarkupNode.create();
    const closeNode = MarkupNode.create();

    openNode.markup = openTag;
    openNode.tag = $node.nodeName;
    closeNode.markup = closeTag;
    closeNode.tag = $node.nodeName;

    openNode.key = $node.key;
    closeNode.key = $node.key;

    node.append(openNode);

    if ($node.childNodes.length > 0) {
      const innerNode = MarkupNode.create();

      for (let $child of $node.childNodes) {
        buildTree($child, innerNode);
      }

      node.append(innerNode);
    }

    node.append(closeNode);

    return node;
  }

  for (let $child of $node.childNodes) {
    node.append(buildTree($child));
  }

  return node;
};

export { domToSyntaxTree };
