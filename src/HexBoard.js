import React from 'react';
import * as HexUtils from 'HexUtils.js';
import PropTypes from 'prop-types';

/*
 * Components representing single hex.
 */

/**
 * Renders a hex field with a token.
 */
class TokenHex extends React.Component {
  static propTypes = {
    /** Whether the hex is currently selected. */
    active: PropTypes.bool,
    /**
     * A function to call when the hex is clicked.
     * @param {!SyntheticEvent} Mouse click event.
     * @param {number} Position of the hex.
     */
    onClick: PropTypes.func.isRequired,
    /**
     * A function to call when the scroll wheel is scrolled over the hex.
     * @param {!SyntheticEvent} Mouse wheel event.
     * @param {number} Position of the hex.
     */
    onWheel: PropTypes.func.isRequired,
    /** Hex rotation in the unit of 60 degrees. */
    rotation: PropTypes.number,
    /** Name of the token to display. */
    token: PropTypes.string.isRequired,
  }

  render() {
    const hexImage=require(`resources/${this.props.token}.png`);
    const fullHexStyle = {
      backgroundImage: `url(${hexImage})`,
      backgroundPosition: 'center center',
      backgroundSize: '118% 118%',
      clipPath: 'polygon(  0% 50%, 25%   0%, 75%   0%, ' +
                        '100% 50%, 75% 100%, 25% 100%)',
      height: '100%',
      position: 'relative',
      transform: `rotate(${this.props.rotation * 60}deg)`,
      width: '100%',
      zIndex: this.props.active ? 10 : 20,
    };
    const overlayImage=require('resources/glow.png');
    const overlayStyle = {
      backgroundImage: `url(${overlayImage})`,
      backgroundPosition: 'center center',
      backgroundSize: '110% 110%',
      height: '100%',
      left: '0px',
      position: 'absolute',
      top: '0px',
      visibility: this.props.active ? 'visible' : 'hidden',
      width: '100%',
      zIndex: 15,
    };
    return (
      <>
        <div style={fullHexStyle}
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}></div>
        <div style={overlayStyle}
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}></div>
      </>
    );
  }
}

/**
 * Renders an empty hex field.
 */
class EmptyHex extends React.Component {
  static propTypes = {
    /** Path to the background image. */
    backgroundImage: PropTypes.string,
    /**
     * A function to call when the hex is clicked.
     * @param {!SyntheticEvent} Mouse click event.
     * @param {number} Position of the hex.
     */
    onClick: PropTypes.func.isRequired,
  }

  render() {
    let backgroundImage = null;
    if (this.props.backgroundImage)
      backgroundImage = `url(${this.props.backgroundImage})`;
    const cacheEmptyStyle = {
      backgroundImage: backgroundImage,
      backgroundPosition: 'center center',
      backgroundSize: '118% 118%',
      clipPath: 'polygon(  0% 50%, 25%   0%, 75%   0%, ' +
                        '100% 50%, 75% 100%, 25% 100%)',
      height: '100%',
      position: 'relative',
      width: '100%',
      zIndex: 30,
    };
    return (
      <div style={cacheEmptyStyle}
           onClick={(e) => this.props.onClick(e, this.props.pos)}>
      </div>
    );
  }
};

/*
 * Token cache components
 */

/**
 * Wraps one hex in player's token cache.
 */
class TokenCacheContainer extends React.Component {
  static propTypes = {
    /** The hex inside this field. */
    children: PropTypes.oneOfType([
      PropTypes.instanceOf(EmptyHex),
      PropTypes.instanceOf(TokenHex),
    ]),
    /** Whether the cache is vertical. */
    vertical: PropTypes.bool,
  }

  render() {
    const containerStyle = {
      display: 'inline-block',
      height: '100px',
      position: 'relative',
      width: '118px',
    };
    const outerContainerStyle = {
      display: 'inline-block',
      textAlign: 'center',
      width: this.props.vertical ? '100%' : null,
    };
    return (
      <div style={outerContainerStyle}>
        <div style={containerStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
};

/**
 * Renders player's token cache.
 * <pre>
 * /------------------------------\
 * | TokenCache                   |
 * | /--------------------------\ |
 * | | TokenCacheContainer (x3) | |
 * | | /----------------------\ | |
 * | | | {Empty,Full}Hex      | | |
 * | | \----------------------/ | |
 * | \--------------------------/ |
 * \------------------------------/
 * </pre>
 */
class TokenCache extends React.Component {
  static propTypes = {
    /** Position of the currently selected hex. */
    activeHex: PropTypes.number,
    /** Array of all board cells. */
    cells: PropTypes.arrayOf(PropTypes.object).isRequired,
    /**
     * A function to call when the hex is clicked.
     * @param {!SyntheticEvent} Mouse click event.
     * @param {number} Position of the hex.
     */
    onClick: PropTypes.func.isRequired,
    /**
     * A function to call when the scroll wheel is scrolled over the hex.
     * @param {!SyntheticEvent} Mouse wheel event.
     * @param {number} Position of the hex.
     */
    onWheel: PropTypes.func.isRequired,
    /* Index of the player this cache belongs to. */
    player: PropTypes.number,
    /** Whether the cache is vertical. */
    vertical: PropTypes.bool,
  }

  render() {
    let items = [];
    for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
      const pos = this.props.player * HexUtils.CACHE_SIZE + i;
      const hex = this.props.cells[pos];
      let contents;
      if (hex) {
        const active = pos === this.props.activeHex;
        contents = (
          <TokenHex pos={pos} token={hex.token}
                    rotation={hex.rotation} active={active}
                    onClick={this.props.onClick}
                    onWheel={this.props.onWheel}/>
          );
      } else {
        const background=require('resources/disabled_background.png');
        contents = <EmptyHex pos={pos}
                             backgroundImage={background}
                             onClick={this.props.onClick}/>;
      }
      items.push(
        <TokenCacheContainer key={pos} vertical={this.props.vertical}>
          {contents}
        </TokenCacheContainer>
      );
    }
    return (
      <>
       {items}
      </>
    );
  }
}

/*
 * Components of the playable part of the board.
 */

/**
 * Renders the spacer that occupies the table layout cells not related
 * to any hex.
 */
class PlayBoardSpacer extends React.Component {
  render() {
    const invisibleCellStyle = {
      border: 'none',
      display: 'table-cell',
      height: '52px',
      visibility: 'hidden',
      width: '92px',
    };
    return (
      <div style={invisibleCellStyle}>
      </div>
    );
  }
}

/**
 * Wraps one hex on playing board.
 */
class PlayBoardContainer extends React.Component {
  static propTypes = {
    /** The hex inside this field. */
    children: PropTypes.oneOfType([
      PropTypes.instanceOf(EmptyHex),
      PropTypes.instanceOf(TokenHex),
    ]),
  }

  render() {
    const cellStyle = {
      border: 'none',
      display: 'table-cell',
      height: '52px',
      width: '92px',
    };
    const overflowStyle = {
      height: '1px',
      overflow: 'visible',
      width: '1px',
    };
    const containerStyle = {
      height: '100px',
      position: 'relative',
      width: '118px',
    };
    return (
      <div style={cellStyle}>
        <div style={overflowStyle}>
          <div style={containerStyle}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Renders the playable part of the board.
 * <pre>
 * /--------------------------------------------------------\
 * | PlayBoard                                              |
 * | /--------------------------\ /-----------------------\ |
 * | | PlayBoardContainer (x19) | | PlayBoardSpacer (x26) | |
 * | | /----------------------\ | |                       | |
 * | | | {Empty,Full}Hex      | | |                       | |
 * | | \----------------------/ | |                       | |
 * | \--------------------------/ \-----------------------| |
 * \--------------------------------------------------------/
 * </pre>
 */
class PlayBoard extends React.Component {
  static propTypes = {
    /** Position of the currently selected hex. */
    activeHex: PropTypes.number,
    /** Array of all board cells. */
    cells: PropTypes.arrayOf(PropTypes.object).isRequired,
    /**
     * A function to call when the hex is clicked.
     * @param {!SyntheticEvent} Mouse click event.
     * @param {number} Position of the hex.
     */
    onClick: PropTypes.func.isRequired,
    /**
     * A function to call when the scroll wheel is scrolled over the hex.
     * @param {!SyntheticEvent} Mouse wheel event.
     * @param {number} Position of the hex.
     */
    onWheel: PropTypes.func.isRequired,
  }

  render() {
    const tableStyle = {
      display: 'table',
    };
    const tbodyStyle = {
      display: 'table-row-group',
    };
    const rowStyle = {
      display: 'table-row',
    };

    let tbody = [];
    for (let y = 0; y < HexUtils.BOARD_HEIGHT; y++) {
      let cells = [];
      for (let x = 0; x < HexUtils.BOARD_WIDTH; x++) {
        const pos = HexUtils.XyToPos(x, y);
        if (!HexUtils.XyIsValid(x, y)) {
          cells.push(<PlayBoardSpacer key={pos}/>);
          continue;
        }

        const hex = this.props.cells[pos];
        let contents;
        if (hex) {
          const active = pos === this.props.activeHex;
          contents = (
            <TokenHex pos={pos} token={hex.token}
                      rotation={hex.rotation} active={active}
                      onClick={this.props.onClick}
                      onWheel={this.props.onWheel}/>
          );
        } else {
          contents = <EmptyHex pos={pos} onClick={this.props.onClick}/>
        }

        cells.push(
          <PlayBoardContainer key={pos}>
            {contents}
          </PlayBoardContainer>
        );
      }

      tbody.push(
        <div style={rowStyle} key={y}>
          {cells}
        </div>
      );
    }

    return (
      <div style={tableStyle} id="board">
        <div style={tbodyStyle}>
          {tbody}
        </div>
      </div>
    );
  }
}

/**
 * Composites all the parts of the complete board.
 * <pre>
 * /---------------------------------------------\
 * | HexBoard                                    |
 * | /-----------------------------------------\ |
 * | | TokenCache                              | |
 * | \-----------------------------------------/ |
 * | /------------\ /-----------\ /------------\ |
 * | | TokenCache | | PlayBoard | | TokenCache | |
 * | \------------/ \-----------/ \------------/ |
 * | /-----------------------------------------\ |
 * | | TokenCache                              | |
 * | \-----------------------------------------/ |
 * \---------------------------------------------/
 * </pre>
 */
export class HexBoard extends React.Component {
  static propTypes = {
    /** The game metadata */
    ctx: PropTypes.object.isRequired,
    /** The game state */
    G: PropTypes.object.isRequired,
    /** Contains functions to dispatch game moves. */
    moves: PropTypes.object.isRequired,
    /** The player ID associated with the client. */
    playerID: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    /** State of the component used for rendering. */
    this.state = {
      /** Position of the currently selected hex. */
      activeHex: null
    }
    /**
     * Current position of the mouse wheel in the units same as
     * SyntheticEvent.deltaY.
     */
    this.wheelPos = 0;
  }

  /**
   * Handler for hex click events.
   * @param {!SyntheticEvent} Mouse click event.
   * @param {number} Position of the hex.
   * @private
   */
  onClick = (e, pos) => {
    if (this.props.ctx.currentPlayer !== this.props.playerID)
      return;

    // Validate this here as well to avoid deactivating the hex
    if (HexUtils.PosIsCache(pos) &&
        HexUtils.CachePosToPlayer(pos) !== Number(this.props.playerID))
      return;

    const hex = this.props.G.cells[pos];
    if (hex) {
      // Clicked a TokenHex
      this.setState((state) => {
        let state_change = {};
        if (pos === state.activeHex)
          state_change.activeHex = null;
        else if (hex.player === this.props.playerID)
          state_change.activeHex = pos;
        return state_change;
      });
    } else {
      // Clicked an EmptyHex
      if (this.state.activeHex !== null) {
        this.props.moves.moveToken(this.state.activeHex, pos);
        this.setState({
          activeHex: null
        });
      }
    }
  }

  /**
   * Handler for hex wheel events.
   * @param {!SyntheticEvent} Mouse wheel event.
   * @param {number} Position of the hex.
   * @private
   */
  onWheel = (e, pos) => {
    if (this.state.activeHex !== pos)
      return;

    this.wheelPos += e.deltaY;
    const steps = Math.floor(this.wheelPos / 128);
    this.wheelPos -= steps * 128;

    this.props.moves.rotateToken(pos, steps);
  };

  render() {
    const boardBackground=require('resources/board.jpg');
    const boardStyle = {
      backgroundImage: `url(${boardBackground})`,
      backgroundPosition: '0px 50px',
      backgroundRepeat: 'no-repeat',
      width: '1024px',
      zIndex: 0,
    };
    const horizontalCacheStyle = {
      height: '130px',
      marginTop: '30px',
      textAlign: 'center',
      width: '100%',
    };
    const verticalCacheStyle = {
      display: 'inline-block',
      lineHeight: 'normal',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '270px',
    };
    const middleContainerStyle = {
      lineHeight: '523px',
      verticalAlign: 'middle',
    };
    const tableContainerStyle = {
      display: 'inline-block',
      height: '523px',
      lineHeight: 'normal',
      verticalAlign: 'middle',
    };

    let caches = [];
    for (let i = 0; i < HexUtils.MAX_PLAYERS; ++i) {
      const player = (Number(this.props.playerID) + i)
                     % HexUtils.MAX_PLAYERS;
      caches.push(
        <TokenCache vertical={i % 2}
                    player={player}
                    cells={this.props.G.cells}
                    activeHex={this.state.activeHex}
                    onClick={this.onClick}
                    onWheel={this.onWheel}/>
      );
    }

    return (
      <div style={boardStyle}>
        <div style={horizontalCacheStyle}>
          {caches[2]}
        </div>
        <div style={middleContainerStyle}>
          <div style={verticalCacheStyle}>
            {caches[1]}
          </div>
          <div style={tableContainerStyle}>
            <PlayBoard cells={this.props.G.cells}
                       activeHex={this.state.activeHex}
                       onClick={this.onClick}
                       onWheel={this.onWheel}/>
          </div>
          <div style={verticalCacheStyle}>
            {caches[3]}
          </div>
        </div>
        <div style={horizontalCacheStyle}>
            {caches[0]}
        </div>
      </div>
    );
  }
}

