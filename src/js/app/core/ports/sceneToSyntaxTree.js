import { SVGElement } from '../domain/nodes/_.js';
import { GElement } from '../domain/nodes/_.js';
import { PathElement } from '../domain/nodes/_.js';
import { types } from '../domain/nodes/_.js';

import { Text } from '../domain/nodes/_.js';

const sceneToSyntaxTree = canvas => {
  const syntaxTree = SVGElement.create();
  parse(canvas, syntaxTree, 0);
  syntaxTree.indexify();
  return syntaxTree;
};

const parse = (sceneNode, markupParent, level) => {
  const markupNodes = sceneNode.toTags(level); // pass the level
  const open = markupNodes.open;
  const close = markupNodes.close;

  // indent
  const indentNode = Text.create(indent(level));
  markupParent.append(indentNode);

  // open tag
  markupParent.append(open);

  // linebreak
  const tNode = Text.create();
  tNode.markup = '\n';
  markupParent.append(tNode);

  // inner markup
  if (sceneNode.graphicsChildren.length > 0) {
    for (let sceneChild of sceneNode.graphicsChildren) {
      let markupNode;

      console.log(sceneChild.type);

      switch (sceneChild.type) {
        case types.SHAPE:
          console.log('shape case');
          markupNode = PathElement.create();
          console.log(markupNode.type);
          break;
        case types.GROUP:
          console.log('group case');
          markupNode = GElement.create();
          break;
      }

      markupParent.append(markupNode);
      parse(sceneChild, markupNode, level + 1);
    }
  }

  if (close) {
    // indent
    markupParent.append(indentNode);

    // close tag
    markupParent.append(close);

    // linebreak
    markupParent.append(tNode);
  }
};

const indent = level => {
  let pad = '';

  for (let i = 0; i < level; i += 1) {
    pad += '  ';
  }

  return pad;
};

export { sceneToSyntaxTree };
