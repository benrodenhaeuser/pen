const transitionTable = [
  [{                    input: 'docSaved'       }, {                         }],
  [{                    input: 'updateDocList'  }, {                         }],
  [{                    input: 'requestDoc'     }, { to: 'busy'              }],
  [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'              }],
  [{ from: 'idle',      input: 'createShape'    }, {                         }],
  [{ from: 'idle',      input: 'createDoc'      }, {                         }],
  [{ from: 'idle',      input: 'animate'        }, { to: 'animating'         }],
  [{ from: 'idle',      input: 'getFrameOrigin' }, { to: 'dragging'          }],
  [{ from: 'idle',      input: 'resizeFrame'    }, { to: 'resizing'          }],
  [{ from: 'idle',      input: 'setFrameOrigin' }, { to: 'drawing'           }],
  [{ from: 'idle',      input: 'deleteFrame'    }, {                         }],
  [{ from: 'busy',      input: 'setDoc'         }, { to: 'idle'              }],
  [{ from: 'drawing',   input: 'changeCoords'   }, { do: 'sizeFrame'         }],
  [{ from: 'drawing',   input: 'releaseFrame'   }, { to: 'idle', do: 'clean' }],
  [{ from: 'dragging',  input: 'changeCoords'   }, { do: 'moveFrame'         }],
  [{ from: 'dragging',  input: 'releaseFrame'   }, { to: 'idle'              }],
  [{ from: 'resizing',  input: 'changeCoords'   }, { do: 'sizeFrame'         }],
  [{ from: 'resizing',  input: 'releaseFrame'   }, { to: 'idle'              }],
  [{ from: 'animating', input: 'animate'        }, { to: 'animating'         }],
  [{ from: 'animating', input: 'edit'           }, { to: 'idle'              }],
  [{ from: 'animating', input: 'createDoc'      }, { to: 'idle'              }],
  [{ from: 'animating', input: 'createShape'    }, { to: 'idle'              }],
];

transitionTable.get = function(key) {
  const match = (pair) => {
    return (pair[0].from === key[0] || !pair[0].from) &&
      pair[0].input === key[1];
  };

  const pair = transitionTable.find(match);

  if (pair) {
    return pair[1];
  }
};

export { transitionTable };
