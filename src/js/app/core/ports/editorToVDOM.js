import { tools, message, canvas } from '../domain/_.js';

const editorToVDOM = store => {
  return {
    tools: tools(store),
    message: message(store),
    canvas: canvas(store),
  };
};

export { editorToVDOM };
