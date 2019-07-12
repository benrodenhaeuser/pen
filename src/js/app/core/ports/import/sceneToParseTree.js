import { ParseTree } from '../../domain/parsetree.js';

const sceneToParseTree = (scene) => {
  const astRoot = ParseTree.create();
  parse(scene, astRoot, 0);
  astRoot.indexify();
  return astRoot;
};

// produce ast from scenegraph
// TODO: this ignores text nodes (and thus whitespace)
const parse = (sceneNode, astParent, level) => {
  const astNodes = sceneNode.toASTNodes();
  const open     = astNodes.open;
  const close    = astNodes.close;
  open.level     = level;
  close.level    = level;

  astParent.children.push(open);

  if (sceneNode.graphicsChildren.length > 0) {
    const astNode = ParseTree.create();
    astParent.children.push(astNode);
    for (let sceneChild of sceneNode.graphicsChildren) {
      parse(sceneChild, astNode, level + 1);
    }
  }

  astParent.children.push(close);
};

export { sceneToParseTree };
