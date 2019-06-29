import { h } from './h.js';

const tools = (store) => {
  return h('ul', { id: 'buttons' },
    h('li', {},
      h('button', {
        id: 'newDocButton',
        class: 'pure-button',
        'data-type': 'newDocButton',
      }, 'New')
    ),
    docs(store),
    h('li', {},
      h('button', {
        id: 'getPrevious',
        'data-type': 'getPrevious',
        class: 'pure-button',
      }, 'Undo')
    ),
    h('li', {},
      h('button', {
        id: 'getNext',
        'data-type': 'getNext',
        class: 'pure-button',
      }, 'Redo')
    ),
    h('li', {},
      h('button', {
        id: 'select',
        'data-type': 'select',
        class: 'pure-button',
      }, 'Select')
    ),
    h('li', {},
      h('button', {
        id: 'pen',
        'data-type': 'pen',
        class: 'pure-button',
      }, 'Pen')
    )
  );
};

const docs = (store) => {
  const vDocs = h('ul', {
    id: 'docs',
    class: 'pure-menu-children doc-list',
  });

  const docs = store.docs;

  for (let identifier of docs.children) {
    vDocs.children.push(
      h('li', {
        class: 'pure-menu-item',
      },
        h('a', {
          class: 'pure-menu-link',
          'data-key': identifier.payload._id,
          'data-type': 'doc-identifier',
        }, identifier.payload._id)
        //  TODO: This is where we would need to put the *name* of the document.
    ));
  }

  const container = h('div', { class: 'pure-menu pure-menu-horizontal' },
    h('ul', { class: 'pure-menu-list' },
      h('li', { class: 'pure-menu-item pure-menu-has-children pure-menu-allow-hover'},
        h('a', { href: '#', id: 'menuLink1', class: 'pure-menu-link' }, 'Open'),
        vDocs
      )
    )
  );

  return container;
};

export { tools };