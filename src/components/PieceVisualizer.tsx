import { Box } from '@react-three/drei';
import { FurniturePiece } from '../types/furniture';

interface PieceVisualizerProps {
  piece: FurniturePiece;
  onClick?: () => void;
}

export const PieceVisualizer = ({ piece, onClick }: PieceVisualizerProps) => {
  const { dimensions, position, color } = piece;
  const pos = position;
  const x = typeof pos.x === 'number' ? pos.x : 0;
  const y = typeof pos.y === 'number' ? pos.y : 0;
  const z = typeof pos.z === 'number' ? pos.z : 0;

  return (
    <Box
      args={[dimensions.width / 100, dimensions.height / 100, dimensions.depth / 100]}
      position={[x / 100, y / 100, z / 100]}
      onClick={onClick}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
};
