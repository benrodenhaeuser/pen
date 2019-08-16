// TODO: this code is NOT functional
// ... and it will not be needed once the new solution is ready!

import { types } from '../domain/nodes/_.js';
import { indent } from '../domain/helpers/_.js';

const canvasToMarkupTree = canvas => {
  const markupTree = SVGElement.create();
  parse(canvas, markupTree, 0);
  markupTree.indexify();
  return markupTree;
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

      switch (sceneChild.type) {
        case types.SHAPE:
          markupNode = PathElement.create();
          break;
        case types.GROUP:
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

export { canvasToMarkupTree };
