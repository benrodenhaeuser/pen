// eventType: type of event that occured (e.g., 'click')
// nodeType:  type of node on which the event was fired (e.g., 'frame')
// action:    name of model-changing action that should be invoked (e.g.,'skip')
// message:   message that should be sent to the view (e.g., 'animate')
// nextState: state that the machine will transition to (e.g., 'idle')

const blueprint = {
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
      nextState: 'draggingFrame',)
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
      // subscriber: model/db, message: save
    },
    // addition:
    {
      eventType: 'click',
      nodeType: 'undoButton',
      action: 'undo',
      nextState: 'idle',
    },
  ],

  drawingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      nextState: 'drawingFrame',
      // subscriber: canvas, message: render
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextState: 'idle',
      // subscriber: model/db, message: save
    }
  ],

  draggingFrame: [
    {
      eventType: 'mousemove',
      action: 'moveFrame',
      nextState: 'draggingFrame',
      // subscriber: canvas, message: render
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextState: 'idle',
      // subscriber: model/db, message: save
    }
  ],

  resizingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      nextState: 'resizingFrame',
      // subscriber: canvas, message: render
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextState: 'idle',
      // subscriber: model/db, message: save
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
      message: 'animating',
      nextState: 'animating',
    },
  ]
};

export { blueprint };
