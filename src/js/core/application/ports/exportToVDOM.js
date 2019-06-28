import { tools   } from './components/tools.js';
import { editor  } from './components/editor.js';
import { message } from './components/message.js';
import { canvas  } from './components/canvas.js';

const exportToVDOM = (state) => {
  return {
    tools:    tools(state.store),
    editor:   editor(state),
    message:  message(state.store),
    canvas:   canvas(state.store),
  };
};

export { exportToVDOM };
