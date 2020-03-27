import React from 'react';

/**
 * @callback A function to call when the hex is clicked.
 * @param e Mouse click event.
 * @param pos Position of the hex.
 */
export type HexClickEventCallback = (e: React.SyntheticEvent, pos: number) => void;

/**
 * @callback A function to call when the wheel moves over the hex.
 * @param e Wheel event.
 * @param pos Position of the hex.
 */
export type HexWheelEventCallback = (e: React.WheelEvent, pos: number) => void;
