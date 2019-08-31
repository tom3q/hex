import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';
import React from 'react';

const BOARD_WIDTH = 5;
const BOARD_HEIGHT = 9;
const MAX_PLAYERS = 4;
const CACHE_SIZE = 4;
const CELLS_SIZE = MAX_PLAYERS * CACHE_SIZE + BOARD_WIDTH * BOARD_HEIGHT;

function XyIsValid(x, y) {
  // 2
  // 1 3
  // 0 2 4
  // 1 3
  // 0 2 4
  // 1 3
  // 0 2 4
  // 1 3
  // 2
  if (y % 2) {
    if (!(x % 2))
      return false;
    return true;
  } else if (y === 0 || y === BOARD_HEIGHT - 1) {
    if (x !== 2)
      return false;
    return true;
  } else {
    if (x % 2)
      return false;
    return true;
  }
}

function XyToPos(x, y) {
  return MAX_PLAYERS * CACHE_SIZE + y * BOARD_WIDTH + x;
}

function PosIsCache(pos) {
  return pos < MAX_PLAYERS * CACHE_SIZE;
}

function CachePosToPlayer(pos) {
  if (!PosIsCache(pos))
    return null;
  return Math.floor(pos / CACHE_SIZE);
}

function CachePosIndex(pos) {
  if (!PosIsCache(pos))
    return null
  return pos % CACHE_SIZE;
}

class HexBoardSpacer extends React.Component {
  render() {
    const invisibleCellStyle = {
      display: 'table-cell',
      border: 'none',
      width: '92px',
      height: '52px',
      visibility: 'hidden',
    };
    return (
      <div style={invisibleCellStyle}></div>
    );
  }
}

class HexBoardContainer extends React.Component {
  onClick = (e) => {
    this.props.onClick(this.props.pos);
    e.stopPropagation();
  }

  render() {
    const cellStyle = {
      display: 'table-cell',
      border: 'none',
      width: '92px',
      height: '52px',
    };
    const hexContainerStyle = {
      overflow: 'visible',
      height: '1px',
      width: '1px',
    };
    const emptyHexStyle = {
      width: '118px',
      height: '100px',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
    };
    return (
      <div style={cellStyle}>
        <div style={hexContainerStyle}>
          <div style={emptyHexStyle}
               onClick={(e) => this.onClick(e)}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

class HexBoardToken extends React.Component {
  constructor(props) {
    super(props);
    this.wheelPos = 0;
    this.state = {
      floating: false,
      rotation: 0,
    };
  }

  onWheel = (e) => {
    if (!this.props.active)
      return;
    if (this.props.locked && !this.props.canRotate)
      return;
    this.wheelPos += e.deltaY;
    let steps = Math.floor(this.wheelPos / 128);
    this.wheelPos -= steps * 128;
    this.setState(state => ({
      rotation: (state.rotation + steps * 60) % 360,
    }));
  }

  onClick = (e) => {
    this.props.onClick(this.props.pos);
    e.stopPropagation();
  }

  render() {
    const fullHex=require('resources/' + this.props.token + '.png');
    let fullHexStyle = {
      backgroundImage: `url(${fullHex})`,
      backgroundSize: '118% 118%',
      backgroundPosition: 'center center',
      width: '100%',
      height: '100%',
      transform: 'rotate(' + this.state.rotation + 'deg)',
    };
    if (this.state.floating) {
      fullHexStyle.position = 'fixed';
    }
    const overlayImg=require('resources/glow.png');
    let overlayStyle = {
      backgroundImage: `url(${overlayImg})`,
      backgroundSize: '110% 110%',
      backgroundPosition: 'center center',
      width: '100%',
      height: '100%',
      visibility: 'hidden',
    };
    if (this.props.active) {
      overlayStyle.visibility = 'visible';
    }
    return (
      <HexBoardContainer pos={this.props.pos} hasToken="true">
        <div style={fullHexStyle}
             onClick={(e) => this.onClick(e)}
             onWheel={(e) => this.onWheel(e)}>
          <div style={overlayStyle}></div>
        </div>
      </HexBoardContainer>
    );
  }
}

class HexBoard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeHex: null
    }
  }

  onClick = (e) => {
    this.setState({
      activeHex: null
    });
  }

  onClickToken = (pos) => {
    this.setState(state => ({
      activeHex: (pos === state.activeHex) ? null : pos,
    }));
  }

  onClickEmpty = (pos) => {
    this.props.moves.moveToken(this.state.activeHex, pos);
    this.setState({
      activeHex: null
    });
    console.log('Clicked empty hex ' + pos + '!');
  }

  render() {
    const boardBackground=require('resources/board.jpg');

    const rowStyle = {
      display: 'table-row',
    };

    const boardStyle = {
      backgroundImage: `url(${boardBackground})`,
      width: '1024px',
      height: '683px',
    };

    const tableStyle = {
      display: 'table',
      paddingLeft: '270px',
      paddingTop: '80px',
    };

    const tbodyStyle = {
      display: 'table-row-group',
    };

    let tbody = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      let cells = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        let pos = XyToPos(x, y);
        if (XyIsValid(x, y)) {
          let hex = this.props.G.cells[pos];
          if (hex)
            cells.push(<HexBoardToken key={pos} pos={pos}
                                      token={hex.token}
                                      active={this.state.activeHex === pos}
                                      onClick={this.onClickToken}/>);
          else
            cells.push(<HexBoardContainer key={pos} pos={pos}
                                          onClick={this.onClickEmpty}/>);
        } else {
          cells.push(<HexBoardSpacer key={pos}/>);
        }
      }
      tbody.push(<div style={rowStyle} key={y}>{cells}</div>);
    }

    return (
      <div style={boardStyle}
           onClick={(e) => this.onClick(e)}>
        <div style={tableStyle} id="board">
          <div style={tbodyStyle}>{tbody}</div>
        </div>
      </div>
    );
  }
}

const Hex = Game({
  setup: () => {
    let cells = Array(CELLS_SIZE).fill(null);
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (XyIsValid(x, y) && (x * y % 4 > 2)) {
          cells[XyToPos(x, y)] = {
            token: 'borgo_net_fighter',
          }
        }
      }
    }
    return { cells: cells };
  },

  moves: {
    moveToken(G, ctx, from, to) {
      if (G.cells[to] === null) {
        G.cells[to] = G.cells[from];
        G.cells[from] = null;
      }
    },
  },

  flow: {
    endGameIf: (G, ctx) => {
    },
  },
});

const App = Client({
  game: Hex,
  board: HexBoard,
});

export default App;
