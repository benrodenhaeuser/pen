import { ASTNode } from './ast.js';

const exportToAST = (state) => {
  const astRoot = ASTNode.create();
  parse(state.store.scene, astRoot, 0);
  astRoot.indexify();
  return astRoot;
};

// produce ast from scenegraph
const parse = (sceneNode, astParent, level) => {
  const astNodes = sceneNode.toASTNodes();
  const open     = astNodes.open;
  const close    = astNodes.close;
  open.level     = level;
  close.level    = level;

  astParent.children.push(open);

  if (sceneNode.graphicsChildren.length > 0) {
    const astNode = ASTNode.create();
    astParent.children.push(astNode);
    for (let sceneChild of sceneNode.graphicsChildren) {
      parse(sceneChild, astNode, level + 1);
    }
  }

  astParent.children.push(close);
};

export { exportToAST };
