import { Box, Html } from '@react-three/drei';
import { FurnitureSpace } from '../types/furniture';
import { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';

interface SingleSpaceVisualizerProps {
  space: FurnitureSpace;
  isSelected?: boolean;
  onSelect?: (spaceId: string) => void;
}

export const SingleSpaceVisualizer = ({ space, isSelected = false, onSelect }: SingleSpaceVisualizerProps) => {
  const { currentDimensions, position = { x: 0, y: 0, z: 0 }, parentSpaceId } = space;
  const [hovered, setHovered] = useState(false);

  // Verificar se há espaço disponível
  const hasSpace = currentDimensions.width > 0 && 
                   currentDimensions.height > 0 && 
                   currentDimensions.depth > 0;

  if (!hasSpace) {
    return null;
  }

  // Cores diferentes para espaços principais e divididos
  const isSubSpace = !!parentSpaceId;
  let color = isSubSpace ? "#10b981" : "#3b82f6"; // Verde para sub-espaços, azul para principal
  let wireframeColor = isSubSpace ? "#059669" : "#1d4ed8";
  let opacity = 0.3;

  // Estados visuais para seleção e hover
  if (isSelected) {
    color = "#f59e0b"; // Laranja para selecionado
    wireframeColor = "#d97706";
    opacity = 0.5;
  } else if (hovered) {
    color = isSubSpace ? "#22c55e" : "#2563eb"; // Verde mais claro para sub-espaços, azul mais claro para principal
    wireframeColor = isSubSpace ? "#16a34a" : "#1d4ed8";
    opacity = 0.6;
  }

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (onSelect) {
      onSelect(space.id);
    }
  };

  return (
    <group position={[position.x / 100, position.y / 100, position.z / 100]}>
      {/* Espaço Disponível - Clicável */}
      <Box
        args={[currentDimensions.width / 100, currentDimensions.height / 100, currentDimensions.depth / 100]}
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color}
          transparent 
          opacity={opacity}
          wireframe={false}
        />
      </Box>

      {/* Wireframe do Espaço */}
      <Box
        args={[currentDimensions.width / 100, currentDimensions.height / 100, currentDimensions.depth / 100]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color={wireframeColor}
          wireframe 
          transparent
          opacity={0.8}
        />
      </Box>

      {/* Label do Espaço - Só aparece no hover ou quando selecionado */}
      {(hovered || isSelected) && (
        <Html
          position={[0, currentDimensions.height / 100 / 2 + 0.5, 0]}
          center
        >
          <div style={{
            background: isSelected ? '#f59e0b' : '#3b82f6',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            opacity: 0.95,
            transition: 'all 0.2s ease-in-out',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transform: hovered ? 'scale(1.05)' : 'scale(1)'
          }}>
            {isSelected ? '🎯 Selecionado' : 'Clique para selecionar'} ({currentDimensions.width}×{currentDimensions.height}×{currentDimensions.depth}mm)
          </div>
        </Html>
      )}
    </group>
  );
};
