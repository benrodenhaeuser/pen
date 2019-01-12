// eventType: type of event that occured (e.g., 'click')
// nodeType:  type of node on which the event occured, if any (e.g., 'frame')
// action:    name of state-changing action that should be invoked (e.g.,'skip')
// messages:  messages to be sent to machine subscribers
// nextState: state label that the machine will transition to (e.g., 'idle')

const blueprint = {
  // start: [
  //   {
  //     eventType: 'DOMContentLoaded',
  //     action: 'skip',
  //     nextState: 'idle',
  //   }
  // ],

  idle: [
    {
      eventType: 'click',
      nodeType: 'newShapeButton',
      action: 'createShape',
      nextState: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'newProjectButton',
      action: 'createProject',
      messages: {
        db: 'saveNewProject',
        ui: 'renderFrames',
      },
      nextState: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'animateButton',
      action: 'skip',
      messages: {
        ui: 'animateShapes',
      },
      nextState: 'animating',
    },
    {
      eventType: 'projectSaved',
      action: 'skip',
      messages: {
        ui: 'displaySavedFlash',
      },
      nextState: 'idle',
    },
    {
      eventType: 'mousedown',
      nodeType: 'frame',
      action: 'grabFrame',
      messages: {
        ui: 'renderFrames',
      },
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
      messages: {
        ui: 'renderFrames',
      },
      nextState: 'idle',
    }
  ],

  drawingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      messages: {
        ui: 'renderFrames',
      },
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
      messages: {
        ui: 'renderFrames',
      },
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
      messages: {
        ui: 'renderFrames',
      },
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
      messages: {
        ui: 'animateShapes',
      },
      nextState: 'animating',
    },
  ]
};

export { blueprint };
