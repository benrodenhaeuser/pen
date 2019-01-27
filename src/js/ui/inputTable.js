const inputTable = [
  // event type     pointer target        input
  [['click',       'newShapeButton'   ], 'createShape'     ],
  [['click',       'newDocButton'     ], 'createDoc'       ],
  [['click',       'animateButton'    ], 'animate'         ],
  [['click',       'deleteLink'       ], 'deleteFrame'     ],
  [['click',       'doc-list-entry'   ], 'requestDoc'      ],
  [['click',       'canvas'           ], 'edit'            ],
  [['mousedown',   'frame'            ], 'getFrameOrigin'  ],
  [['mousedown',   'top-left-corner'  ], 'findOppCorner'   ],
  [['mousedown',   'top-right-corner' ], 'findOppCorner'   ],
  [['mousedown',   'bot-left-corner'  ], 'findOppCorner'   ],
  [['mousedown',   'bot-right-corner' ], 'findOppCorner'   ],
  [['mousedown',   'canvas'           ], 'setFrameOrigin'  ],
  [['mousedown',   'rotate-handle'    ], 'getStartAngle'   ],
  [['mousemove'                       ], 'changeCoords'    ],
  [['mouseup'                         ], 'releaseFrame'    ],
];

inputTable.get = function(key) {
  const match = (pair) => {
    return pair[0][0] === key[0] &&
      (pair[0][1] === key[1] || pair[0][1] === undefined);
  };

  const pair = inputTable.find(match);

  if (pair) {
    // console.log(pair[1]);
    return pair[1];
  } else {
    // console.log(key[0], key[1]);
    // console.log('ui: no proper input');
  }
};

export { inputTable };
