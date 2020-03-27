import React from 'react';

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
export class Button extends React.Component<ButtonProps, ButtonState> {
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
      image = require(`hex-resources/resources/gfx/${this.props.imageDown}`);
    } else {
      image = require(`hex-resources/resources/gfx/${this.props.image}`);
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
