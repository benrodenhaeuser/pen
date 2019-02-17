import { Matrix, Vector } from './matrix.js';

let aux = {};

const actions = {
  select(state, input) {
    const selected = state.doc.scene
      .findDescendant((node) => {
        return node._id === input.pointer.targetID;
      })
      .findAncestor((node) => {
        return node.props.class.includes('frontier');
      });

    if (selected) {
      selected.select();
      this.initShift(state, input);
    } else {
      state.doc.scene.deselectAll();
    }
  },

  initShift(state, input) {
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
      .multiply(selected.globalTransform());

    aux.source = target;
  },

  initRotate(state, input) {
    const selected = state.doc.scene.selected;
    aux.source     = Vector.create(input.pointer.x, input.pointer.y);
    const box      = selected.box;
    const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
    aux.center     = center.transform(selected.globalTransform());
  },

  rotate(state, input) {
    const selected          = state.doc.scene.selected;
    const target            = Vector.create(input.pointer.x, input.pointer.y);
    const sourceMinusCenter = aux.source.subtract(aux.center);
    const targetMinusCenter = target.subtract(aux.center);

    const sourceAngle = Math.atan2(sourceMinusCenter.y, sourceMinusCenter.x);
    const targetAngle = Math.atan2(targetMinusCenter.y, targetMinusCenter.x);
    const angle       = targetAngle - sourceAngle;
    const rotation    = Matrix.rotation(angle, aux.center);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(rotation)
      .multiply(selected.globalTransform());

    aux.source = target;
  },

  initScale(state, input) {
    const selected = state.doc.scene.selected;
    aux.source     = Vector.create(input.pointer.x, input.pointer.y);
    const box      = selected.box;
    const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
    aux.center     = center.transform(selected.globalTransform());
  },

  scale(state, input) {
    const selected          = state.doc.scene.selected;
    const target            = Vector.create(input.pointer.x, input.pointer.y);
    const sourceMinusCenter = aux.source.subtract(aux.center);
    const targetMinusCenter = target.subtract(aux.center);

    const sourceDist = Math.sqrt(
      Math.pow(sourceMinusCenter.x, 2) +
      Math.pow(sourceMinusCenter.y, 2)
    );
    const targetDist = Math.sqrt(
      Math.pow(targetMinusCenter.x, 2) +
      Math.pow(targetMinusCenter.y, 2)
    );
    const factor     = targetDist / sourceDist;
    const scaling    = Matrix.scale(factor, aux.center);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(scaling)
      .multiply(selected.globalTransform());

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
      state.doc.scene.unfocusAll();
    }
  },

  focus(state, input) {
    const target = state.doc.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    if (target) {
      const toFocus = target.findAncestor((node) => {
        return node.classList.includes('frontier');
      });

      if (toFocus) {
        const pointer = Vector
          .create(input.pointer.x, input.pointer.y)
          .transform(toFocus.globalTransform().invert());

        if (pointer.isWithin(toFocus.box)) {
          toFocus.classList.add('focus');
        } else {
          state.doc.scene.unfocusAll();
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

export { actions };
