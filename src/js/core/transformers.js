import { Matrix } from './matrix.js';
import { Node } from './node.js';
import { ClassList } from './classList.js';
import { Vector } from './vector.js';

let aux = {};

const transformers = {
  select(state, input) {
    const selected = state.doc.scene
      .findDescendant((node) => {
        return node._id === input.pointer.targetID;
      })
      .findAncestor((node) => {
        return node.props.class.includes('frontier');
      });

    selected ? selected.select() : state.doc.scene.deselectAll();

    aux.source = Vector.create(input.pointer.x, input.pointer.y);
  },

  shift(state, input) {
    const selected = state.doc.scene.selected;

    if (!selected) { return; }

    const target      = Vector.create(input.pointer.x, input.pointer.y);
    const translate   = target.subtract(aux.source);
    const translation = Matrix.translation(translate);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(translation)
      .multiply(selected.ancestorTransform())
      .multiply(selected.transform);

    aux.source = target;
  },

  initRotate(state, input) {
    const selected = state.doc.scene.selected;
    aux.source = Vector.create(input.pointer.x, input.pointer.y);
    const box = selected.box;
    const center = Vector.create(box.x + box.width / 2, box.y + box.height / 2);
    aux.center = center.transform(selected.totalTransform());
  },

  rotate(state, input) {
    const selected = state.doc.scene.selected;
    const target = Vector.create(input.pointer.x, input.pointer.y);
    const sourceToCenter = aux.source.subtract(aux.center);
    const targetToCenter = target.subtract(aux.center);

    const sourceAngle = Math.atan2(...[sourceToCenter.x, sourceToCenter.y]);
    const targetAngle = Math.atan2(...[targetToCenter.x, targetToCenter.y]);
    const angle = sourceAngle - targetAngle;
    const rotation = Matrix.rotation(angle, aux.center);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(rotation)
      .multiply(selected.ancestorTransform())
      .multiply(selected.transform);

    aux.source = target;
  },

  // (NOTE: that is the exact same code as for initRotate)
  initScale(state, input) {
    const selected = state.doc.scene.selected;
    aux.source = Vector.create(input.pointer.x, input.pointer.y);
    const box = selected.box;
    const center = Vector.create(box.x + box.width / 2, box.y + box.height / 2);
    aux.center = center.transform(selected.totalTransform());
  },

  scale(state, input) {
    const selected = state.doc.scene.selected;
    const target = Vector.create(input.pointer.x, input.pointer.y);
    const sourceToCenter = aux.source.subtract(aux.center);
    const targetToCenter = target.subtract(aux.center);

    const sourceDist = Math.sqrt(
      Math.pow(sourceToCenter.x, 2) +
      Math.pow(sourceToCenter.y, 2)
    );
    const targetDist = Math.sqrt(
      Math.pow(targetToCenter.x, 2) +
      Math.pow(targetToCenter.y, 2)
    );
    const factor = targetDist / sourceDist;
    const scaling = Matrix.scale(factor, aux.center);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(scaling)
      .multiply(selected.ancestorTransform())
      .multiply(selected.transform);

    aux.source = target;
  },

  release(state, input) {
    const selected = state.doc.scene.selected;

    for (let ancestor of selected.ancestors) {
      ancestor.updateBox();
    }

    aux = {};
  },

  selectThrough(state, input) {
    const target = state.doc.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    const selection = target.findAncestor((node) => {
      return node.parent && node.parent.props.class.includes('frontier');
    });

    if (selection) {
      selection.select();
      state.doc.scene.setFrontier();
      state.doc.scene.unfocus();
    }
  },

  focus(state, input) {
    const target = state.doc.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    if (target) {
      const highlight = target.findAncestor((node) => {
        return node.props.class.includes('frontier');
      });

      if (highlight) {
        const pointer = Vector
          .create(input.pointer.x, input.pointer.y)
          .transform(highlight.totalTransform().invert());

        if (
          pointer.x >= highlight.box.x &&
          pointer.x <= highlight.box.x + highlight.box.width &&
          pointer.y >= highlight.box.y &&
          pointer.y <= highlight.box.y + highlight.box.height
        ) {
          highlight.props.class.add('focus');
        } else {
          state.doc.scene.unfocus();
        }
      }
    }
  },

  // OLD (probably useless):

  createDoc(state, input) {
    state.doc.init();
    state.docs.ids.push(state.doc._id);
    state.docs.selectedID = state.doc._id;
  },

  updateDocList(state, input) {
    state.docs.ids = input.data.docIDs;
  },

  requestDoc(state, input) {
    state.docs.selectedID = input.pointer.targetID;
  },

  setDoc(state, input) {
    state.doc.init(input.data.doc);
  },
};

export { transformers };
