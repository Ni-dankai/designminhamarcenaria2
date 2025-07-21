import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTexture, Edges } from '@react-three/drei';
import { FurniturePiece } from '../types/furniture';

interface PieceVisualizerProps {
  piece: FurniturePiece;
  textureUrl: string;
  isHovered: boolean;
  onClick?: () => void;
  normalMapUrl?: string; 
}

export const PieceVisualizer: React.FC<PieceVisualizerProps> = ({ 
  piece, 
  textureUrl, 
  normalMapUrl, 
  onClick, 
  isHovered 
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { position, dimensions } = piece;

  const [colorMap, normalMap] = useTexture([textureUrl, normalMapUrl || textureUrl]);

  const materials = useMemo(() => {
    const textureScale = 500;

    const createMaterialForFace = (faceWidth: number, faceHeight: number) => {
      const colorMapClone = colorMap.clone();
      const textureAspect = colorMap.image.width / colorMap.image.height;
      let repeatU, repeatV;

      colorMapClone.wrapS = THREE.RepeatWrapping;
      colorMapClone.wrapT = THREE.RepeatWrapping;
      colorMapClone.center.set(0.5, 0.5);

      if (faceWidth > faceHeight) {
        colorMapClone.rotation = Math.PI / 2;
        repeatU = faceHeight / textureScale;
        repeatV = (faceWidth / textureScale) / textureAspect;
      } else {
        colorMapClone.rotation = 0;
        repeatU = faceWidth / textureScale;
        repeatV = (faceHeight / textureScale) / textureAspect;
      }
      colorMapClone.repeat.set(repeatU, repeatV);

      let normalMapClone = null;
      if (normalMapUrl && normalMap) {
        normalMapClone = normalMap.clone();
        normalMapClone.wrapS = THREE.RepeatWrapping;
        normalMapClone.wrapT = THREE.RepeatWrapping;
        normalMapClone.center.set(0.5, 0.5);
        normalMapClone.rotation = colorMapClone.rotation;
        normalMapClone.repeat.copy(colorMapClone.repeat);
      }
      
      return new THREE.MeshStandardMaterial({
        map: colorMapClone,
        normalMap: normalMapClone,
        color: "#cccccc",
        roughness: 0.9,
        metalness: 0.0,
        envMapIntensity: 0.7,
        // ===================================================================
        // NOVA TÉCNICA: Empurra as faces para trás para revelar as bordas
        // ===================================================================
        polygonOffset: true,
        polygonOffsetFactor: 1, // Empurra a face para longe da câmera
        polygonOffsetUnits: 1,
      });
    };

    const frontBackMat = createMaterialForFace(dimensions.width, dimensions.height);
    const topBottomMat = createMaterialForFace(dimensions.width, dimensions.depth);
    const leftRightMat = createMaterialForFace(dimensions.depth, dimensions.height);

    return [leftRightMat, leftRightMat, topBottomMat, topBottomMat, frontBackMat, frontBackMat];

  }, [colorMap, normalMap, dimensions, normalMapUrl]);

  useEffect(() => {
    if (!meshRef.current || !meshRef.current.material) return;
    const currentMaterials = Array.isArray(meshRef.current.material) ? meshRef.current.material : [meshRef.current.material];
    currentMaterials.forEach(mat => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive.set(isHovered ? '#ffff00' : '#000000');
        mat.emissiveIntensity = isHovered ? 0.35 : 0;
      }
    });
  }, [isHovered]);

  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0 || dimensions.depth <= 0) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      position={[position.x / 100, position.y / 100, position.z / 100]}
      onClick={onClick}
      castShadow
      receiveShadow
      material={materials}
    >
      <boxGeometry args={[dimensions.width / 100, dimensions.height / 100, dimensions.depth / 100]} />
      {/* =================================================================== */}
      {/* CORREÇÃO: A escala da borda agora é 1 (tamanho exato da peça)     */}
      {/* =================================================================== */}
      <Edges
        scale={1}
        threshold={15}
        color="#222222"
        linewidth={1}
      />
    </mesh>
  );
};
