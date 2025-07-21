import React from 'react';
import { Box, Html } from '@react-three/drei';
import { FurnitureSpace } from '../types/furniture';
import { ThreeEvent } from '@react-three/fiber';

interface SingleSpaceVisualizerProps {
  space: FurnitureSpace;
  isSelected?: boolean;
  onSelect?: (spaceId: string) => void;
  selectionMode: 'piece' | 'space';
}

export const SingleSpaceVisualizer: React.FC<SingleSpaceVisualizerProps> = ({ 
  space, 
  isSelected = false, 
  onSelect, 
  selectionMode 
}) => {
  const { currentDimensions, position = { x: 0, y: 0, z: 0 } } = space;
  
  const hasSpace = currentDimensions.width > 1 && 
                   currentDimensions.height > 1 && 
                   currentDimensions.depth > 1;

  if (!hasSpace) {
    return null;
  }

  const color = isSelected ? '#f97316' : '#3b82f6';

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (onSelect) {
      onSelect(space.id);
    }
  };

  return (
    <group position={[position.x / 100, position.y / 100, position.z / 100]}>
      {/* =================================================================== */}
      {/* 1. PARTE VISUAL: Sólida, translúcida, mas SEMPRE ignora o mouse.    */}
      {/* =================================================================== */}
      <Box
        args={[currentDimensions.width / 100, currentDimensions.height / 100, currentDimensions.depth / 100]}
        raycast={() => null} // Esta parte é apenas para ver, nunca para clicar.
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </Box>

      {/* =================================================================== */}
      {/* 2. PARTE INTERATIVA: Invisível e SÓ É RENDERIZADA no modo 'space'. */}
      {/* =================================================================== */}
      {selectionMode === 'space' && (
        <Box
          args={[currentDimensions.width / 100, currentDimensions.height / 100, currentDimensions.depth / 100]}
          onClick={handleClick}
        >
          <meshBasicMaterial visible={false} />
        </Box>
      )}

      {/* Etiqueta de informações (Html) */}
      {isSelected && (
        <Html center position={[0, currentDimensions.height / 200 + 0.15, 0]}>
          <div style={{
            background: '#f97316',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            Espaço Ativo: {space.name}
          </div>
        </Html>
      )}
    </group>
  );
};
