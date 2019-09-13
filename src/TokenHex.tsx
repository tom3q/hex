import React from 'react';
import * as HexBoardUtils from './HexBoardUtils';
import { Hex } from './Hex';

interface FloatingContainerProps {
  /* Bottom position in pixels. */
  bottom?: number;
  /* Height in pixels. */
  height?: number;
  /* Left position in pixels. */
  left?: number;
  /* Right position in pixels. */
  right?: number;
  /* Top position in pixels. */
  top?: number;
  /* Width in pixels. */
  width?: number;
}

/**
 * A simple container for anything that needs absolute positioning within
 * the token area.
 */
class FloatingContainer extends React.Component<FloatingContainerProps, {}> {
  render() {
    const floatingStyle: React.CSSProperties = {
      bottom: this.props.bottom && this.props.bottom + 'px',
      height: this.props.height && this.props.height + 'px',
      left: this.props.left && this.props.left + 'px',
      position: 'absolute',
      right: this.props.right && this.props.right + 'px',
      top: this.props.top && this.props.top + 'px',
      width: this.props.width && this.props.width + 'px',
    };
    return (
      <div style={floatingStyle}>
        {this.props.children}
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
    const toughnessUsedMarks = [];
    const toughnessUsedImage=require('./resources/ability_toughness_used.png');
    const toughnessUsedStyle: React.CSSProperties = {
      backgroundImage: `url(${toughnessUsedImage})`,
      backgroundPosition: 'center center',
      backgroundSize: 'contain',
      width: '100%',
      height: '100%',
    };
    for (let i = 0; i < hex.damage; ++i) {
      let left = 27 + i * 30;
      if (hex.damage > 2)
        left = 25 + 45 * i / hex.damage;
      toughnessUsedMarks.push(
        <FloatingContainer width={34} height={34} bottom={7} left={left} key={i}>
          <div style={toughnessUsedStyle}>
          </div>
        </FloatingContainer>
      );
    }
    return (
      <>
        <div style={fullHexStyle} ref={this.tokenNode}
             onClick={(e) => this.props.onClick(e, this.props.pos)}
             onWheel={(e) => this.props.onWheel(e, this.props.pos)}>
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
