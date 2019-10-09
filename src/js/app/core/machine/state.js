import { Editor } from '../domain/_.js';
import { Docs } from '../domain/_.js';
import { Doc } from '../domain/_.js';
import { Message } from '../domain/_.js';
import { Canvas } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { Tools } from '../domain/_.js';
import { Tool } from '../domain/_.js';

import { comps } from '../domain/_.js';
import { docToObject } from '../ports/_.js';
import { objectToDoc } from '../ports/_.js';
import { markupToCanvas } from '../ports/_.js'; 

const State = {
  create(canvasWidth) {
    return Object.create(State).init(canvasWidth);
  },

  init(canvasWidth) {
    this.editor = this.buildEditor(canvasWidth);

    this.description = {
      mode: 'start',
      label: undefined,
      input: {},
      update: undefined,
      layout: {
        menuVisible: false,
      },
    };

    this.temp = {};
    this.snapshots = {};

    return this;
  },

  buildEditor(canvasWidth) {
    return Editor.create().mount(
      this.buildDoc(canvasWidth),
      this.buildTools(),
      Docs.create(),
      this.buildMessage()
    );
  },

  buildMessage() {
    return Message.create({ text: 'Welcome!' });
  },

  buildTools() {
    return Tools.create().mount(
      Tool.create({
        name: 'Pen',
        iconPath: '/assets/buttons/pen.svg',
        toolType: 'penButton',
      }),
      Tool.create({
        name: 'Select',
        iconPath: '/assets/buttons/select.svg',
        toolType: 'selectButton',
      }),
      Tool.create({
        name: 'Undo',
        iconPath: '/assets/buttons/undo.svg',
        toolType: 'getPrevious',
      }),
      Tool.create({
        name: 'Redo',
        iconPath: '/assets/buttons/redo.svg',
        toolType: 'getNext',
      }),
      Tool.create({
        name: 'New',
        iconPath: '/assets/buttons/new.svg',
        toolType: 'newDocButton',
      }),
      Tool.create({
        name: 'Open',
        iconPath: '/assets/buttons/open.svg',
        toolType: 'docListButton',
      })
    );
  },

  buildDoc(canvasWidth) {
    return Doc.create({ canvasWidth: canvasWidth }).mount(
      Canvas.create({
        viewBox: Rectangle.createFromDimensions(0, 0, 800, 1600),
      })
    );
  },

  docToObject() {
    return docToObject(this.doc);
  },

  objectToDoc(object) {
    return objectToDoc(object);
  },

  markupToCanvas(markup) {
    return markupToCanvas(markup);
  },

  snapshot(label) {
    if (this.snapshots[label]) {
      return this.snapshots[label];
    }

    // TODO: clean up the structure
    switch (label) {
      case 'vDOM':
        return (this.snapshots['vDOM'] = {
          tools: comps.tools(this.tools),
          menu: comps.menu(this.docs),
          message: this.editor.message.text,
          canvas: this.canvas.renderElement(),
        });
      case 'plain':
        return (this.snapshots['plain'] = this.docToObject());
      case 'markupTree':
        return (this.snapshots['markupTree'] = this.canvas.renderTags());
    }
  },
};

Object.defineProperty(State, 'mode', {
  get() {
    return this.description.mode;
  },

  set(value) {
    this.description.mode = value;
  },
});

Object.defineProperty(State, 'label', {
  get() {
    return this.description.label;
  },

  set(value) {
    this.description.label = value;
  },
});

Object.defineProperty(State, 'input', {
  get() {
    return this.description.input;
  },

  set(value) {
    this.description.input = value;
  },
});

Object.defineProperty(State, 'update', {
  get() {
    return this.description.update;
  },

  set(value) {
    this.description.update = value;
  },
});

Object.defineProperty(State, 'layout', {
  get() {
    return this.description.layout;
  },

  set(value) {
    this.description.layout = value;
  },
});

Object.defineProperty(State, 'canvas', {
  get() {
    return this.editor.canvas;
  },
});

Object.defineProperty(State, 'doc', {
  get() {
    return this.editor.doc;
  },
});

Object.defineProperty(State, 'tools', {
  get() {
    return this.editor.tools;
  },
});

Object.defineProperty(State, 'docs', {
  get() {
    return this.editor.docs;
  },
});

Object.defineProperty(State, 'message', {
  get() {
    return this.editor.message;
  },
});

Object.defineProperty(State, 'target', {
  get() {
    return this.temp.target;
  },

  set(value) {
    this.temp.target = value;
  },
});

Object.defineProperty(State, 'from', {
  get() {
    return this.temp.from;
  },

  set(value) {
    this.temp.from = value;
  },
});

export { State };
