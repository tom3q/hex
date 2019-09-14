import React from 'react';
import * as HexBoardUtils from './HexBoardUtils';
import { Hex } from './Hex';

interface FloatingContainerProps {
  /* Bottom position in pixels. */
  bottom?: number;
  /* Left position in pixels. */
  left?: number;
  /* Right position in pixels. */
  right?: number;
  /* Top position in pixels. */
  top?: number;
}

/**
 * A simple container for anything that needs absolute positioning within
 * the token area.
 */
class FloatingContainer extends React.Component<FloatingContainerProps, {}> {
  render() {
    const floatingStyle: React.CSSProperties = {
      bottom: this.props.bottom && this.props.bottom + 'px',
      left: this.props.left && this.props.left + 'px',
      position: 'absolute',
      right: this.props.right && this.props.right + 'px',
      top: this.props.top && this.props.top + 'px',
    };
    return (
      <div style={floatingStyle}>
        {this.props.children}
      </div>
    );
  }
}

interface TokenMarkProps {
  /** Height in pixels. */
  height: number;
  /** Width in pixels. */
  width: number;
  /** Path to the mark image. */
  image: string;
}

/**
 * Helper for drawing various marks on top of the token.
 */
class TokenMark extends React.Component<TokenMarkProps, {}> {
  render() {
    const image = require(`./resources/${this.props.image}`);
    const markStyle: React.CSSProperties = {
      backgroundImage: `url(${image})`,
      backgroundPosition: 'center center',
      backgroundSize: 'contain',
      height: this.props.height + 'px',
      width: this.props.width + 'px',
    };
    return (
      <div style={markStyle}>
      </div>
    );
  }
}

interface TokenHexProps {
  /** Whether the hex is currently selected. */
  active: boolean;
  /** Hex object to render */
  hex: Hex;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexBoardUtils.HexClickEventCallback;
  /**
   * A function to call when the scroll wheel is scrolled over the hex.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  onWheel: HexBoardUtils.HexWheelEventCallback;
  /** Position of the hex in the game cells array. */
  pos: number;
}

/**
 * Renders a hex field with a token.
 */
export class TokenHex extends React.Component<TokenHexProps, {}> {
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
    const hex = this.props.hex;
    const name = hex.army + '_' + hex.token.id;
    const hexImage=require(`./resources/${name}.png`);
    const fullHexStyle: React.CSSProperties = {
      backgroundImage: `url(${hexImage})`,
      backgroundPosition: 'center center',
      backgroundSize: 'contain',
      clipPath: 'polygon(  0% 50%, 25%   0%, 75%   0%, ' +
                        '100% 50%, 75% 100%, 25% 100%)',
      height: '100%',
      position: 'relative',
      transform: `rotate(${hex.rotation * 60}deg)`,
      width: '100%',
      zIndex: 20,
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
      visibility: 'hidden',
      width: '100%',
      zIndex: 15,
    };

    if (this.props.active || hex.attackedInBattle || hex.damagedInBattle) {
      overlayStyle.visibility = 'visible';
      fullHexStyle.zIndex = 10;
    }
    if (!this.props.active) {
      if (hex.attackedInBattle && hex.damagedInBattle) {
        overlayStyle.filter = 'hue-rotate(-140deg)';
      } else if (hex.damagedInBattle) {
        overlayStyle.filter = 'hue-rotate(-190deg)';
      } else if (hex.attackedInBattle) {
        overlayStyle.filter = 'hue-rotate(-60deg)';
      }
    }

    let originalInitiatives: Array<number> = [...hex.token.initiative];
    while (originalInitiatives.length < hex.initiative.length) {
      originalInitiatives.push(-1);
    }

    const initiativeMarks = [];
    for (let i = 0; i < hex.initiative.length; ++i) {
      if (hex.initiative[i] === originalInitiatives[i])
        continue;

      let left = 27 + i * 30;
      if (hex.initiative.length > 2)
        left = 25 + 45 * i / hex.initiative.length;

      const state = hex.initiative[i] < originalInitiatives[i] ?
        "lowered" : "raised";
      const image = `ability_initiative_${state}_${hex.initiative[i]}.png`;

      initiativeMarks.push(
        <FloatingContainer top={7} left={left} key={i}>
          <TokenMark width={34} height={34} image={image}/>
        </FloatingContainer>
      );
    }

    const toughnessUsedMarks = [];
    for (let i = 0; i < hex.damage; ++i) {
      let left = 27 + i * 30;
      if (hex.damage > 2)
        left = 25 + 45 * i / hex.damage;
      toughnessUsedMarks.push(
        <FloatingContainer bottom={7} left={left} key={i}>
          <TokenMark width={34} height={34} image="ability_toughness_used.png"/>
        </FloatingContainer>
      );
    }

    return (
      <>
        <div style={fullHexStyle} ref={this.tokenNode}
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}>
          {initiativeMarks}
          {toughnessUsedMarks}
        </div>
        <div style={overlayStyle} ref={this.overlayNode}
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}>
        </div>
      </>
    );
  }
}
