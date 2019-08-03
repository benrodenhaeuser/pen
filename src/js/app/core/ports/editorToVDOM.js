import { tools, message, canvas } from '../domain/_.js';

const editorToVDOM = editor => {
  return {
    tools: tools(editor),
    message: message(editor),
    canvas: canvas(editor),
  };
};

export { editorToVDOM };
