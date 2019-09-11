import React from 'react';
import * as HexUtils from './HexUtils';

/*
 * Components representing single hex.
 */

/**
 * @callback A function to call when the hex is clicked.
 * @param Mouse click event.
 * @param Position of the hex.
 */
type HexClickEventCallback = (e: React.SyntheticEvent, pos: number) => void;
type HexWheelEventCallback = (e: React.WheelEvent, pos: number) => void;

interface TokenHexProps {
  /** Whether the hex is currently selected. */
  active: boolean;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexClickEventCallback;
  /**
   * A function to call when the scroll wheel is scrolled over the hex.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  onWheel: HexWheelEventCallback;
  /** Position of the hex in the game cells array. */
  pos: number;
  /** Hex rotation in the unit of 60 degrees. */
  rotation: number;
  /** Name of the token to display. */
  token: string;
}

/**
 * Renders a hex field with a token.
 */
class TokenHex extends React.Component<TokenHexProps, {}> {
  /** @private @const {!Object} Reference to the token div node. */
  private tokenNode = React.createRef<HTMLDivElement>();
  /** @private @const {!Object} Reference to the overlay div node. */
  private overlayNode = React.createRef<HTMLDivElement>();

  componentDidMount() {
    /*
     * TODO(https://github.com/facebook/react/issues/2043):
     * Remove this when React starts attaching the events correctly.
     * See also: https://github.com/facebook/react/issues/9809.
     */
    if (this.tokenNode.current) {
      this.tokenNode.current.addEventListener('wheel', (e) => {
        e.preventDefault();
      });
    }
    if (this.overlayNode.current) {
      this.overlayNode.current.addEventListener('wheel', (e) => {
        e.preventDefault();
      });
    }
  }

  render() {
    const hexImage=require(`./resources/${this.props.token}.png`);
    const fullHexStyle: React.CSSProperties = {
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
    const overlayImage=require('./resources/glow.png');
    const overlayStyle: React.CSSProperties = {
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
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}>
        </div>
        <div style={overlayStyle} ref={this.overlayNode}
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}>
        </div>
      </>
    );
  }
}

interface EmptyHexProps {
  /** Path to the background image. */
  backgroundImage?: string;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexClickEventCallback;
  /** Position of the hex in the game cells array. */
  pos: number;
}

/**
 * Renders an empty hex field.
 */
class EmptyHex extends React.Component<EmptyHexProps, {}> {
  render() {
    let backgroundImage = undefined;
    if (this.props.backgroundImage) {
      backgroundImage = `url(${this.props.backgroundImage})`;
    }
    const cacheEmptyStyle: React.CSSProperties = {
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

interface TokenCacheContainerProps {
  /** The hex inside this field. */
  children: React.ReactElement;
  /** Whether the cache is vertical. */
  vertical: boolean;
}

/**
 * Wraps one hex in player's token cache.
 */
class TokenCacheContainer extends React.Component<TokenCacheContainerProps, {}> {
  render() {
    const containerStyle: React.CSSProperties = {
      display: 'inline-block',
      height: '100px',
      position: 'relative',
      width: '118px',
    };
    const outerContainerStyle: React.CSSProperties = {
      display: 'inline-block',
      textAlign: 'center',
      width: this.props.vertical ? '100%' : undefined,
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

interface TokenCacheProps {
  /** Position of the currently selected hex. */
  activeHex: number | null;
  /** Array of all board cells. */
  cells: Array<any | null>;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexClickEventCallback;
  /**
   * A function to call when the scroll wheel is scrolled over the hex.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  onWheel: HexWheelEventCallback;
  /* Index of the player this cache belongs to. */
  player: number;
  /** Whether the cache is vertical. */
  vertical: boolean;
}

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
class TokenCache extends React.Component<TokenCacheProps, {}> {
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
        const background=require('./resources/disabled_background.png');
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
    const invisibleCellStyle: React.CSSProperties = {
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

interface PlayBoardContainerProps {
  /** The hex inside this field. */
  children: React.ReactElement;
}


/**
 * Wraps one hex on playing board.
 */
class PlayBoardContainer extends React.Component<PlayBoardContainerProps, {}> {
  render() {
    const cellStyle: React.CSSProperties = {
      border: 'none',
      display: 'table-cell',
      height: '52px',
      width: '92px',
    };
    const overflowStyle: React.CSSProperties = {
      height: '1px',
      overflow: 'visible',
      width: '1px',
    };
    const containerStyle: React.CSSProperties = {
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

interface PlayBoardProps {
  /** Position of the currently selected hex. */
  activeHex: number | null;
  /** Array of all board cells. */
  cells: Array<any | null>;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexClickEventCallback;
  /**
   * A function to call when the scroll wheel is scrolled over the hex.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  onWheel: HexWheelEventCallback;
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
class PlayBoard extends React.Component<PlayBoardProps, {}> {
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

interface ButtonProps {
  /** Whether the button is greyed out. */
  disabled: boolean;
  /** Default button image. */
  image: string;
  /** Image to display when the pointer is down on the button. */
  imageDown: string;
  /** Height of the button as CSS string. */
  height: string;
  /**
   * A function to call when the scroll wheel is scrolled over the hex.
   * @param Mouse wheel event.
   */
  onClick: (e: React.PointerEvent) => void;
  /** Rotation of the button in degrees. */
  rotation?: number;
  /** Width of the button as CSS string. */
  width: string;
}

interface ButtonState {
  /** Whether the pointer is down. */
  down: boolean;
  /** Whether the buttom is hovered. */
  hover: boolean;
}

/**
 * Renders a clickable button.
 */
class Button extends React.Component<ButtonProps, ButtonState> {
  /** @private @const {!Object} Reference to the button div node. */
  private node = React.createRef<HTMLDivElement>();

  constructor(props: ButtonProps) {
    super(props);
    /** @private {!Object} State of the component used for rendering. */
    this.state = {
      down: false,
      hover: false,
    };
  }

  componentDidMount() {
    /*
     * TODO(https://github.com/facebook/react/issues/2043):
     * Remove this when React starts attaching the events correctly.
     * See also: https://github.com/facebook/react/issues/9809.
     */
    if (this.node.current) {
      this.node.current.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
    }
  }

  private onPointerDown = (e: React.PointerEvent) => {
    this.setState({
      down: true,
    });
  }

  private onPointerEnter = (e: React.PointerEvent) => {
    this.setState({
      down: (e.buttons & 1) !== 0,
      hover: true,
    });
  }

  private onPointerLeave = (e: React.PointerEvent) => {
    this.setState({
      down: false,
      hover: false,
    });
  }

  private onPointerUp = (e: React.PointerEvent) => {
    this.setState({
      down: false,
    });
    this.props.onClick(e);
  }

  render() {
    let image;
    if (!this.props.disabled && this.state.down) {
      image = require(`./resources/${this.props.imageDown}`);
    } else {
      image = require(`./resources/${this.props.image}`);
    }
    let filter = undefined;
    if (this.props.disabled) {
      filter = 'grayscale(100%)';
    } else if (this.state.hover && !this.state.down) {
      filter = 'brightness(130%)';
    }
    const buttonStyle: React.CSSProperties = {
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

interface HexBoardProps {
  /** The game metadata */
  ctx: any;
  /** The game state */
  G: any;
  /** Contains functions to dispatch game moves. */
  moves: any;
  /** The player ID associated with the client. */
  playerID: string;
  /** The function to undo a game move. */
  undo: () => void;
}

interface HexBoardState {
  /** Position of the currently selected hex. */
  activeHex: number | null;
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
export class HexBoard extends React.Component<HexBoardProps, HexBoardState> {
 /**
  * Current position of the mouse wheel in the units same as
  * SyntheticEvent.deltaY.
  */
  private wheelPos: number;

  constructor(props: HexBoardProps) {
    super(props);
    /** State of the component used for rendering. */
    this.state = {
      activeHex: null
    }
    this.wheelPos = 0;
  }

  /**
   * Handler for hex click events.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  private onClick = (e: React.SyntheticEvent, pos: number): void => {
    if (this.props.ctx.currentPlayer !== this.props.playerID)
      return;

    /* Do not handle clicks on other player's caches. */
    if (HexUtils.PosIsCache(pos) &&
        HexUtils.CachePosToPlayer(pos) !== Number(this.props.playerID))
      return;

    /* Clicking the active token deactivates it. */
    if (pos === this.state.activeHex) {
      this.setState({ activeHex: null });
      return;
    }

    /* Use an intant hex if active and clicked on a board hex. */
    const activeHex = this.state.activeHex !== null ?
      this.props.G.cells[this.state.activeHex] : null;
    if (activeHex && activeHex.token.instant) {
      if (!HexUtils.PosIsCache(pos)) {
        this.props.moves.useInstantToken(this.state.activeHex, pos);
        this.setState({ activeHex: null });
      }
      return;
    }

    /* Change the active selection if clicked on another owned token. */
    const targetHex = this.props.G.cells[pos];
    if (targetHex) {
      // Clicked a TokenHex
      if (targetHex.player === Number(this.props.playerID)) {
        this.setState({ activeHex: pos });
      }
      return;
    }

    /* Move the active token if clicked on an empty field. */
    if (this.state.activeHex !== null) {
      this.props.moves.moveToken(this.state.activeHex, pos);
      this.setState({ activeHex: null });
    }
  }

  /**
   * Handler for hex wheel events.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  private onWheel = (e: React.WheelEvent, pos: number): void => {
    if (this.state.activeHex !== pos)
      return;

    const activeHex = this.props.G.cells[pos];
    if (activeHex.token.instant)
      return;

    e.preventDefault();

    this.wheelPos += e.deltaY;
    const steps = Math.floor(this.wheelPos / 128);
    this.wheelPos -= steps * 128;

    if (Math.abs(steps) >= 1)
      this.props.moves.rotateToken(pos, steps);
  };

  render() {
    const boardBackground=require('./resources/board.jpg');
    const boardStyle: React.CSSProperties = {
      backgroundImage: `url(${boardBackground})`,
      backgroundPosition: '0px 50px',
      backgroundRepeat: 'no-repeat',
      width: '1024px',
      zIndex: 0,
    };
    const horizontalCacheStyle: React.CSSProperties = {
      height: '130px',
      marginTop: '30px',
      textAlign: 'center',
      width: '100%',
    };
    const verticalCacheStyle: React.CSSProperties = {
      display: 'inline-block',
      lineHeight: 'normal',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '270px',
    };
    const middleContainerStyle: React.CSSProperties = {
      lineHeight: '523px',
      verticalAlign: 'middle',
    };
    const tableContainerStyle: React.CSSProperties = {
      display: 'inline-block',
      height: '523px',
      lineHeight: 'normal',
      verticalAlign: 'middle',
    };
    const bottomSpacerStyle: React.CSSProperties = {
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
                    onClick={(e) => {
                      this.props.moves.discardCache(this.state.activeHex);
                      this.setState( { activeHex: null } );
                    }}/>
            <Button width='100px' height='80px' disabled={!playerActive}
                    image='hand_view_button_end_turn_x4.png'
                    imageDown='hand_view_button_end_turn_pressed_x4.png'
                    onClick={(e) => this.props.moves.endTurn()}/>
        </div>
      </div>
    );
  }
}

