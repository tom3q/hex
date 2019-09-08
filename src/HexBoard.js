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

  constructor(props) {
    super(props);
    /** @private @const {!Object} Reference to the token div node. */
    this.tokenNode = React.createRef();
    /** @private @const {!Object} Reference to the overlay div node. */
    this.overlayNode = React.createRef();
  }

  componentDidMount() {
    /*
     * TODO(https://github.com/facebook/react/issues/2043):
     * Remove this when React starts attaching the events correctly.
     * See also: https://github.com/facebook/react/issues/9809.
     */
    this.tokenNode.current.onwheel =
      (e) => this.props.onWheel(e, this.props.pos);
    this.overlayNode.current.onwheel =
      (e) => this.props.onWheel(e, this.props.pos);
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
        <div style={fullHexStyle} ref={this.tokenNode}
             onClick={(e) => this.props.onClick(e, this.props.pos)}>
        </div>
        <div style={overlayStyle} ref={this.overlayNode}
             onClick={(e) => this.props.onClick(e, this.props.pos)}>
        </div>
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
    children: PropTypes.element.isRequired,
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
          <TokenHex pos={pos} token={hex.army + '_' + hex.token.id}
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
    children: PropTypes.element.isRequired,
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
            <TokenHex pos={pos} token={hex.army + '_' + hex.token.id}
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

/*
 * Utility components.
 */

/**
 * Renders a clickable button.
 */
class Button extends React.Component {
  static propTypes = {
    /** Whether the button is greyed out. */
    disabled: PropTypes.bool,
    /** Default button image. */
    image: PropTypes.string.isRequired,
    /** Image to display when the pointer is down on the button. */
    imageDown: PropTypes.string.isRequired,
    /** Height of the button as CSS string. */
    height: PropTypes.string.isRequired,
    /**
     * The function to call when the button is clicked.
     * @param {!SyntethicEvent} Click event.
     */
    onClick: PropTypes.func.isRequired,
    /** Rotation of the button in degrees. */
    rotation: PropTypes.number,
    /** Width of the button as CSS string. */
    width: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    /** @private @const {!Object} Reference to the button div node. */
    this.node = React.createRef();
    /** @private {!Object} State of the component used for rendering. */
    this.state = {
      /** {boolean} Whether the pointer is down. */
      down: false,
      /** {boolean} Whether the buttom is hovered. */
      hover: false,
    };
  }

  componentDidMount() {
    /*
     * TODO(https://github.com/facebook/react/issues/2043):
     * Remove this when React starts attaching the events correctly.
     * See also: https://github.com/facebook/react/issues/9809.
     */
    this.node.current.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
  }

  onPointerDown = (e) => {
    this.setState({
      down: true,
    });
  }

  onPointerEnter = (e) => {
    this.setState({
      down: e.buttons & 1 != 0,
      hover: true,
    });
  }

  onPointerLeave = (e) => {
    this.setState({
      down: false,
      hover: false,
    });
  }

  onPointerUp = (e) => {
    this.setState({
      down: false,
    });
    this.props.onClick(e);
  }

  render() {
    let image;
    if (!this.props.disabled && this.state.down) {
      image = require(`resources/${this.props.imageDown}`);
    } else {
      image = require(`resources/${this.props.image}`);
    }
    let filter = null;
    if (this.props.disabled) {
      filter = 'grayscale(100%)';
    } else if (this.state.hover && !this.state.down) {
      filter = 'brightness(130%)';
    }
    const buttonStyle = {
      backgroundImage: `url(${image})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      display: 'inline-block',
      filter: filter,
      height: this.props.height,
      transform: `rotate(${this.props.rotation}deg)`,
      width: this.props.width,
    };
    return (
      <div style={buttonStyle} ref={this.node}
           onPointerEnter={(e) => this.onPointerEnter(e)}
           onPointerLeave={(e) => this.onPointerLeave(e)}
           onPointerDown={(e) => this.onPointerDown(e)}
           onPointerUp={(e) => this.onPointerUp(e)}>
      </div>
    )
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
    /** The function to undo a game move. */
    undo: PropTypes.func.isRequired,
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

    e.preventDefault();

    this.wheelPos += e.deltaY;
    const steps = Math.floor(this.wheelPos / 128);
    this.wheelPos -= steps * 128;

    if (Math.abs(steps) >= 1)
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
    const bottomSpacerStyle = {
      display: 'inline-block',
      width: '100px',
    };

    let caches = [];
    for (let i = 0; i < HexUtils.MAX_PLAYERS; ++i) {
      const player = (Number(this.props.playerID) + i)
                     % HexUtils.MAX_PLAYERS;
      caches.push(
        <TokenCache vertical={i % 2 !== 0}
                    player={player}
                    cells={this.props.G.cells}
                    activeHex={this.state.activeHex}
                    onClick={this.onClick}
                    onWheel={this.onWheel}/>
      );
    }

    const playerActive =
      this.props.ctx.currentPlayer === this.props.playerID;
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
            <div style={bottomSpacerStyle}></div>
            <Button width='100px' height='100px' disabled={!playerActive}
                    image='toolbox_undo_x4.png'
                    imageDown='toolbox_undo_pressed_x4.png'
                    onClick={(e) => this.props.undo()}/>
            <div style={bottomSpacerStyle}></div>
            {caches[0]}
            <div style={bottomSpacerStyle}></div>
            <Button width='100px' height='80px' rotation={180}
                    disabled={!playerActive}
                    image='hand_view_button_cancel_x4.png'
                    imageDown='hand_view_button_cancel_pressed_x4.png'
                    onClick={(e) => this.props.moves.discardCache()}/>
            <Button width='100px' height='80px' disabled={!playerActive}
                    image='hand_view_button_end_turn_x4.png'
                    imageDown='hand_view_button_end_turn_pressed_x4.png'
                    onClick={(e) => this.props.events.endTurn()}/>
        </div>
      </div>
    );
  }
}

