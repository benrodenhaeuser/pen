import { tools, editor, message, canvas } from './components.js';

const exportToVDOM = (state) => {
  return {
    tools:    tools(state.store),
    // editor:   editor(state),     // not needed atm
    message:  message(state.store),
    canvas:   canvas(state.store),
  };
};

export { exportToVDOM };
