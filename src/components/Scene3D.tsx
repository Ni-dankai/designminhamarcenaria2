import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { FurnitureSpace, FurniturePiece } from '../types/furniture';
import { SingleSpaceVisualizer } from './SingleSpaceVisualizer';
import { PieceVisualizer } from './PieceVisualizer';
import { LoadingSpinner } from './LoadingSpinner';

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
  return <SingleSpaceVisualizer space={space} isSelected={selectedSpaceId === space.id} onSelect={onSelectSpace} />;
};

interface Scene3DProps {
  space: FurnitureSpace;
  allPieces: FurniturePiece[]; // <-- Recebe a lista plana de peças
  selectedSpaceId?: string | null;
  onSelectSpace?: (spaceId: string) => void;
  selectedPieceId?: string | null;
  onSelectPiece?: (pieceId: string) => void;
}

export const Scene3D = ({ space, allPieces, selectedSpaceId, onSelectSpace, selectedPieceId, onSelectPiece }: Scene3DProps) => {
  const gridYPosition = - (space.originalDimensions.height / 100) / 2 - 0.2;

  return (
    <Suspense fallback={<LoadingSpinner message="Carregando visualização 3D..." />}>
        <Canvas camera={{ position: [5, 5, 15], fov: 55 }} style={{ background: 'var(--color-background-gradient)' }}>
          <Suspense fallback={null}> 
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <Environment preset="studio" />
            <Grid position={[0, gridYPosition, 0]} args={[25, 25]} cellColor="var(--color-border)" sectionColor="var(--color-primary)" infiniteGrid />
            
            {/* Renderiza a árvore de espaços vazios */}
            <RecursiveSpaceVisualizer space={space} selectedSpaceId={selectedSpaceId} onSelectSpace={onSelectSpace} />

            {/* Renderiza a lista plana de todas as peças já posicionadas */}
            {allPieces.map((piece) => (
              <PieceVisualizer 
                key={piece.id}
                piece={piece} 
                onClick={() => onSelectPiece && onSelectPiece(piece.id)}
              />
            ))}

            <OrbitControls maxPolarAngle={Math.PI / 1.5} minDistance={2} maxDistance={50} />
          </Suspense>
        </Canvas>
    </Suspense>
  );
};
