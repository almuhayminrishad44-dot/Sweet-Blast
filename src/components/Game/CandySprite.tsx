/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Circle, Group, Rect, Star, Ring } from 'react-konva';
import { CandyType, SpecialType } from '../../game/types';

interface CandySpriteProps {
  type: CandyType;
  special: SpecialType;
  x: number;
  y: number;
  size: number;
  isSelected?: boolean;
}

const CANDY_COLORS = {
  [CandyType.RED]: '#FF4D4D',
  [CandyType.BLUE]: '#4D94FF',
  [CandyType.GREEN]: '#4DFF4D',
  [CandyType.YELLOW]: '#FFFF4D',
  [CandyType.PURPLE]: '#B366FF',
  [CandyType.ORANGE]: '#FF944D',
};

const CANDY_GLOSS = {
  [CandyType.RED]: '#FF8080',
  [CandyType.BLUE]: '#80B3FF',
  [CandyType.GREEN]: '#80FF80',
  [CandyType.YELLOW]: '#FFFF80',
  [CandyType.PURPLE]: '#D1A3FF',
  [CandyType.ORANGE]: '#FFB380',
};

export const CandySprite: React.FC<CandySpriteProps> = ({ type, special, x, y, size, isSelected }) => {
  const color = CANDY_COLORS[type];
  const gloss = CANDY_GLOSS[type];
  const padding = size * 0.15;
  const innerSize = size - padding * 2;

  return (
    <Group x={x} y={y}>
      {/* Selection Glow */}
      {isSelected && (
        <Ring
          x={size / 2}
          y={size / 2}
          innerRadius={innerSize / 2 + 2}
          outerRadius={innerSize / 2 + 6}
          fill="white"
          opacity={0.5}
        />
      )}

      {/* Shadow */}
      <Circle
        x={size / 2}
        y={size / 2 + 4}
        radius={innerSize / 2}
        fill="rgba(0,0,0,0.15)"
      />
      
      {/* Main Body */}
      <Circle
        x={size / 2}
        y={size / 2}
        radius={innerSize / 2}
        fillRadialGradientStartPoint={{ x: -innerSize / 6, y: -innerSize / 6 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={innerSize / 1.2}
        fillRadialGradientColorStops={[0, gloss, 0.5, color, 1, color]}
        shadowColor={color}
        shadowBlur={special !== SpecialType.NONE ? 15 : 0}
        shadowOpacity={0.5}
      />

      {/* Shine */}
      <Circle
        x={size / 2 - innerSize / 6}
        y={size / 2 - innerSize / 6}
        radius={innerSize / 8}
        fill="rgba(255, 255, 255, 0.4)"
      />

      {/* Special Indicators */}
      {special === SpecialType.STRIPED_H && (
        <Group x={size / 2} y={size / 2}>
          {[ -6, 0, 6 ].map(offset => (
            <Rect
              key={offset}
              x={-innerSize / 2}
              y={offset - 1}
              width={innerSize}
              height={2}
              fill="white"
              opacity={0.8}
            />
          ))}
        </Group>
      )}
      {special === SpecialType.STRIPED_V && (
        <Group x={size / 2} y={size / 2}>
          {[ -6, 0, 6 ].map(offset => (
            <Rect
              key={offset}
              x={offset - 1}
              y={-innerSize / 2}
              width={2}
              height={innerSize}
              fill="white"
              opacity={0.8}
            />
          ))}
        </Group>
      )}
      {special === SpecialType.COLOR_BOMB && (
        <Star
          x={size / 2}
          y={size / 2}
          numPoints={12}
          innerRadius={innerSize / 5}
          outerRadius={innerSize / 2.2}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={innerSize / 2}
          fillRadialGradientColorStops={[0, '#FFF', 0.5, '#FFD700', 1, '#FFA500']}
          stroke="white"
          strokeWidth={2}
          shadowColor="gold"
          shadowBlur={20}
        />
      )}
    </Group>
  );
};
