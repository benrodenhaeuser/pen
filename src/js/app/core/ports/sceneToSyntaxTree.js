import { MarkupNode } from '../domain/nodes/_.js';

const sceneToSyntaxTree = canvas => {
  const syntaxTree = MarkupNode.create();
  parse(canvas, syntaxTree, 0);
  syntaxTree.indexify();
  return syntaxTree;
};

const parse = (sceneNode, markupParent, level) => {
  const markupNodes = sceneNode.toMarkupNodes();
  const open = markupNodes.open;
  const close = markupNodes.close;
  open.level = level;
  close.level = level;

  // indent
  const pad = indent(level);
  const indentNode = MarkupNode.create();
  indentNode.markup = pad;
  markupParent.append(indentNode);

  // open tag
  markupParent.append(open);

  // linebreak
  const tNode = MarkupNode.create();
  tNode.markup = '\n';
  markupParent.append(tNode);

  if (sceneNode.graphicsChildren.length > 0) {
    const markupNode = MarkupNode.create();
    markupParent.append(markupNode);

    for (let sceneChild of sceneNode.graphicsChildren) {
      parse(sceneChild, markupNode, level + 1);
    }
  }

  // indent
  markupParent.append(indentNode);

  // close tag
  markupParent.append(close);

  // linebreak
  markupParent.append(tNode);
};

const indent = level => {
  let pad = '';

  for (let i = 0; i < level; i += 1) {
    pad += '  ';
  }

  return pad;
};

export { sceneToSyntaxTree };
