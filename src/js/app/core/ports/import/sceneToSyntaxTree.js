import { SyntaxTree } from '../../domain/nodes/_.js';

const sceneToSyntaxTree = canvas => {
  const astRoot = SyntaxTree.create();
  parse(canvas, astRoot, 0);
  astRoot.indexify();
  return astRoot;
};

const parse = (sceneNode, astParent, level) => {
  const astNodes = sceneNode.toASTNodes();
  const open = astNodes.open;
  const close = astNodes.close;
  open.level = level;
  close.level = level;

  // indent
  const pad = indent(level);
  const indentNode = SyntaxTree.create();
  indentNode.markup = pad;
  astParent.children.push(indentNode);

  // open tag
  astParent.children.push(open);

  // linebreak
  const tNode = SyntaxTree.create();
  tNode.markup = '\n';
  astParent.children.push(tNode);

  if (sceneNode.graphicsChildren.length > 0) {
    const astNode = SyntaxTree.create();
    astParent.children.push(astNode);

    for (let sceneChild of sceneNode.graphicsChildren) {
      parse(sceneChild, astNode, level + 1);
    }
  }

  // indent
  astParent.children.push(indentNode);

  // close tag
  astParent.children.push(close);

  // linebreak
  astParent.children.push(tNode);
};

const indent = level => {
  let pad = '';

  for (let i = 0; i < level; i += 1) {
    pad += '  ';
  }

  return pad;
};

export { sceneToSyntaxTree };
