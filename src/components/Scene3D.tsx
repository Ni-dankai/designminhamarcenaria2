import React, { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { FurnitureSpace, FurniturePiece } from '../types/furniture';
import { SingleSpaceVisualizer } from './SingleSpaceVisualizer';
import { PieceVisualizer } from './PieceVisualizer';
import { LoadingSpinner } from './LoadingSpinner';

// Componente recursivo para desenhar os espaços disponíveis (folhas da árvore)
const RecursiveSpaceVisualizer = ({ space, selectedSpaceId, onSelectSpace }: { space: FurnitureSpace; selectedSpaceId?: string | null; onSelectSpace?: (spaceId: string) => void }) => {
  if (!space.isActive && space.subSpaces?.length) {
    return (
      <>
        {space.subSpaces.map(sub => (
          <RecursiveSpaceVisualizer key={sub.id} space={sub} selectedSpaceId={selectedSpaceId} onSelectSpace={onSelectSpace} />
        ))}
      </>
    );
  }
  if (space.isActive) {
    return <SingleSpaceVisualizer space={space} isSelected={selectedSpaceId === space.id} onSelect={onSelectSpace} />;
  }
  return null;
};


interface Scene3DProps {
  space: FurnitureSpace;
  allPieces: FurniturePiece[];
  textureUrl: string;
  selectedSpaceId?: string | null;
  onSelectSpace?: (spaceId: string) => void;
  onSelectPiece?: (pieceId: string) => void;
  hoveredPieceId?: string | null;
}

export const Scene3D: React.FC<Scene3DProps> = ({ 
  space, 
  allPieces, 
  textureUrl, 
  selectedSpaceId, 
  onSelectSpace, 
  onSelectPiece, 
  hoveredPieceId 
}) => {
  const gridYPosition = - (space.originalDimensions.height / 100) / 2 - 0.2;
  const [gridColors, setGridColors] = useState({ cell: '#e0e0e0', section: '#3b82f6' });

  useEffect(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const cellColor = computedStyle.getPropertyValue('--color-border').trim();
    const sectionColor = computedStyle.getPropertyValue('--color-primary').trim();
    if (cellColor && sectionColor) {
      setGridColors({ cell: cellColor, section: sectionColor });
    }
  }, []);

  return (
    <Suspense fallback={<LoadingSpinner message="Carregando visualização 3D..." />}>
      <Canvas 
        shadows
        camera={{ position: [5, 4, 12], fov: 50 }} 
        style={{ background: 'var(--color-background-gradient)' }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputEncoding: THREE.sRGBEncoding,
        }}
      >
        <Suspense fallback={null}> 
          {/* =================================================================== */}
          {/* NOVA ILUMINAÇÃO: Mais suave e com melhor qualidade visual         */}
          {/* =================================================================== */}
          <hemisphereLight color={"#d3d8e0"} groundColor={"#666666"} intensity={0.2} />
          
          <directionalLight 
            position={[4, 8, 6]} 
            intensity={1.5} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />

          <directionalLight 
            position={[-4, 2, -4]} 
            intensity={0.2}
          />
          
          <Environment preset="apartment" /> 
          
          <Grid 
            position={[0, gridYPosition, 0]} 
            args={[25, 25]} 
            cellColor={gridColors.cell} 
            sectionColor={gridColors.section} 
            infiniteGrid 
          />
            
          <RecursiveSpaceVisualizer space={space} selectedSpaceId={selectedSpaceId} onSelectSpace={onSelectSpace} />

          {allPieces.map((piece) => (
            <PieceVisualizer 
              key={piece.id}
              piece={piece} 
              textureUrl={textureUrl}
              onClick={() => onSelectPiece && onSelectPiece(piece.id)}
              isHovered={piece.id === hoveredPieceId}
            />
          ))}

          <OrbitControls makeDefault maxPolarAngle={Math.PI / 1.8} minDistance={2} maxDistance={50} />
        </Suspense>
      </Canvas>
    </Suspense>
  );
};
