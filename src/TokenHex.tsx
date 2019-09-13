import React from 'react';
import * as HexBoardUtils from './HexBoardUtils';
import { Hex } from './Hex';

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
