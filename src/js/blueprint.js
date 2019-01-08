// eventType: type of event that occured (e.g., 'click')
// nodeType:  type of node on which the event was fired (e.g., 'frame')
// action:    name of model-changing action that should be invoked (e.g.,'skip')
// message:   message that should be sent to the view (e.g., 'animate')
// nextState: state that the machine will transition to (e.g., 'idle')

const blueprint = {
  start: [
    {
      eventType: 'DOMContentLoaded',
      action: 'skip',
      nextState: 'idle',
    }
  ],

  idle: [
    {
      eventType: 'click',
      nodeType: 'newShapeButton',
      action: 'createShape',
      nextState: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'animateButton',
      action: 'skip',
      message: 'animate',
      nextState: 'animating',
    },
    {
      eventType: 'mousedown',
      nodeType: 'frame',
      action: 'grabFrame',
      nextState: 'draggingFrame',
    },
    {
      eventType: 'mousedown',
      nodeType: 'corner',
      action: 'grabCorner',
      nextState: 'resizingFrame',
    },
    {
      eventType: 'mousedown',
      nodeType: 'canvas',
      action: 'setFrameOrigin',
      nextState: 'drawingFrame',
    },
    {
      eventType: 'click',
      nodeType: 'deleteLink',
      action: 'deleteFrame',
      nextState: 'idle',
    }
  ],

  drawingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      nextState: 'drawingFrame',
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextState: 'idle',
    }
  ],

  draggingFrame: [
    {
      eventType: 'mousemove',
      action: 'moveFrame',
      nextState: 'draggingFrame',
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextState: 'idle',
    }
  ],

  resizingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      nextState: 'resizingFrame',
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextState: 'idle',
    }
  ],

  animating: [
    {
      eventType: 'click',
      nodeType: 'canvas',
      action: 'skip',
      nextState: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'animateButton',
      action: 'skip',
      message: 'animate',
      nextState: 'animating',
    },
  ]
};

export { blueprint };
