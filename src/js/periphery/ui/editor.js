import { UI } from './ui.js';

const editor = Object.assign(Object.create(UI), {
  init(state) {
    this.name = 'editor';
    UI.init.bind(this)(state);
    return this;
  },

  bindEvents(func) {
    this.mountPoint.addEventListener('input', (event) => {
      event.preventDefault();

      func({
        source: this.name,
        type:   event.type,
        value:  event.target.value,
      });
    });
  },

  reconcile(oldVNode, newVNode, $node) {
    // if the textarea is out of focus and new text
    // content is available, set that text content as
    // the textarea's value:
    if (
      $node.tagName === 'TEXTAREA' &&
      document.activeElement !== $node &&
      newVNode.children[0] !== oldVNode.children[0]
    ) {
      $node.value = newVNode.children[0];
    }
  },
});

export { editor };


// init: wire up the codemirror instance and register it as `this.editor`
// bindEvents: `this.editor.on('change', ...)`
// reconcile:
//   - let's assume we are passed a string (i..e., the markup).
//   - then we can proceed in analogy to what we have now.
//
// what happens on first render? 
