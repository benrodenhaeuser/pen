import { tools, message, canvas } from '../../domain/_.js';

const exportToVDOM = state => {
  return {
    tools: tools(state.store),
    message: message(state.store),
    canvas: canvas(state.store),
  };
};

export { exportToVDOM };
