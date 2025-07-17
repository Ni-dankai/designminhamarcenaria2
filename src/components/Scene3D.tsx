import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html, Text, Line } from '@react-three/drei';
import { FurnitureSpace, FurniturePiece } from '../types/furniture';
import { SingleSpaceVisualizer } from './SingleSpaceVisualizer';
import { PieceVisualizer } from './PieceVisualizer';
import { Loading3D } from './Loading3D';
import { LoadingSpinner } from './LoadingSpinner';
import React, { useState, useEffect } from 'react';

interface Scene3DProps {
  space: FurnitureSpace;
  selectedSpaceId?: string | null;
  onSelectSpace?: (spaceId: string) => void;
  selectedPieceId?: string | null;
  onSelectPiece?: (pieceId: string) => void;
}

export const Scene3D = ({ space, selectedSpaceId, onSelectSpace, selectedPieceId, onSelectPiece }: Scene3DProps) => {
  // Debug: verificar se os espaços filhos estão sendo recebidos
  console.log('🎨 Scene3D - Espaços recebidos:', {
    mainSpace: {
      id: space.id,
      name: space.name,
      isActive: space.isActive,
      dimensions: space.currentDimensions,
      piecesCount: space.pieces.length
    },
    subSpaces: space.subSpaces ? {
      count: space.subSpaces.length,
      spaces: space.subSpaces.map(s => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        dimensions: s.currentDimensions,
        piecesCount: s.pieces.length
      }))
    } : 'Nenhum subSpace'
  });

  // Calcular a posição da base do móvel considerando sua posição atual e dimensões
  const spaceHeight = space.currentDimensions?.height || space.originalDimensions?.height || 2100;
  const spaceYPosition = space.position?.y || 0; // Posição Y do espaço em mm

  // Converter para unidades Three.js e calcular base do espaço
  const spaceYInUnits = spaceYPosition / 100; // Posição do centro do espaço
  const halfHeight = (spaceHeight / 100) / 2; // Metade da altura do espaço
  const spaceBottomY = spaceYInUnits - halfHeight; // Base do espaço

  // Posicionar grid ligeiramente abaixo da base
  const gridYPosition = spaceBottomY - 0.2; // Pequeno offset para separação visual

  // Calcular dimensões do móvel em metros
  const width = (space.currentDimensions?.width || space.originalDimensions?.width || 800) / 100;
  const height = (space.currentDimensions?.height || space.originalDimensions?.height || 2100) / 100;
  const depth = (space.currentDimensions?.depth || space.originalDimensions?.depth || 600) / 100;

  // Calcular centro do móvel
  const centerX = width / 2;
  const centerY = height / 2;
  const centerZ = depth / 2;

  // Parâmetros da câmera
  const fov = 55; // Field of view em graus
  const aspect = 16 / 9; // Supondo tela widescreen, pode ser ajustado conforme necessário

  // Calcular diagonal máxima do móvel (bounding sphere radius)
  const boundingRadius = 0.5 * Math.sqrt(width * width + height * height + depth * depth);

  // Converter FOV para radianos e calcular distância ideal
  const fovRad = (fov * Math.PI) / 180;
  // Distância mínima para caber o bounding sphere inteiro na vertical ou horizontal
  const distance = boundingRadius / Math.sin(fovRad / 2) * 1.15; // 1.15 = margem extra

  // Posição da câmera: centralizada em X e Y, afastada no eixo Z positivo (olhando de frente)
  // O centro do móvel é usado para X e Y, mas a câmera é afastada no Z para garantir enquadramento
  const cameraPosition: [number, number, number] = [centerX, centerY, depth / 2 + distance];

  console.log('🎯 Posicionamento do grid:', {
    spaceHeight: spaceHeight + 'mm',
    spaceYPosition: spaceYPosition + 'mm', 
    spaceYInUnits,
    halfHeight,
    spaceBottomY,
    gridYPosition
  });

  // Função para calcular a distância entre duas peças (centro a centro)
  function calcularDistancia(p1: FurniturePiece, p2: FurniturePiece) {
    return {
      x: Math.abs((p1.position.x + p1.dimensions.width / 2) - (p2.position.x + p2.dimensions.width / 2)),
      y: Math.abs((p1.position.y + p1.dimensions.height / 2) - (p2.position.y + p2.dimensions.height / 2)),
      z: Math.abs((p1.position.z + p1.dimensions.depth / 2) - (p2.position.z + p2.dimensions.depth / 2)),
    };
  }

  // Encontrar peça selecionada
  const selectedPiece = space.pieces.find(p => p.id === selectedPieceId);

  // Calcular cotas (intervalos) entre faces das peças (principalmente prateleiras)
  let cotas: Array<{id: string, pos: [number, number, number], valor: number, eixo: 'y', start: [number, number, number], end: [number, number, number]}> = [];
  if (selectedPiece) {
    const baseEspaco = (space.position.y - (space.currentDimensions.height / 2)) / 100;
    const topoEspaco = (space.position.y + (space.currentDimensions.height / 2)) / 100;
    // Ordenar peças pelo eixo Y (de baixo para cima)
    const ordered = [...space.pieces]
      .filter(p => p.type === selectedPiece.type)
      .sort((a, b) => a.position.y - b.position.y);
    // Encontrar o índice da peça selecionada
    const idx = ordered.findIndex(p => p.id === selectedPiece.id);
    // Funções para faces corrigidas (em metros)
    const faceInferior = (p: FurniturePiece) => (p.position.y - (space.currentDimensions.height / 2)) / 100;
    const faceSuperior = (p: FurniturePiece) => (p.position.y - (space.currentDimensions.height / 2) + p.dimensions.height) / 100;
    // Debug: imprimir posições das peças e do espaço
    console.log('Espaço:', {
      pos: space.position,
      baseEspaco,
      topoEspaco,
      currentDimensions: space.currentDimensions
    });
    ordered.forEach((p, i) => {
      console.log(`Peça ${i} (${p.id}): pos=`, p.position, 'faceInf=', faceInferior(p), 'faceSup=', faceSuperior(p), 'dim=', p.dimensions);
    });
    // Cota inferior (entre a face inferior da peça e a superior da peça abaixo, ou fundo do espaço)
    let yFaceInferior, yFaceSuperiorAbaixo;
    if (idx > 0) {
      const abaixo = ordered[idx - 1];
      yFaceSuperiorAbaixo = faceSuperior(abaixo);
      yFaceInferior = faceInferior(selectedPiece);
    } else {
      yFaceSuperiorAbaixo = baseEspaco;
      yFaceInferior = faceInferior(selectedPiece);
    }
    const valorInf = yFaceInferior - yFaceSuperiorAbaixo;
    console.log('valorInf:', valorInf);
    if (valorInf > 0 && valorInf < 100) {
      cotas.push({
        id: selectedPiece.id + (idx > 0 ? '-baixo' : '-fundo'),
        pos: [selectedPiece.position.x / 100 - 0.25, (yFaceInferior + yFaceSuperiorAbaixo) / 2, selectedPiece.position.z / 100],
        valor: valorInf,
        eixo: 'y',
        start: [selectedPiece.position.x / 100 - 0.25, yFaceSuperiorAbaixo, selectedPiece.position.z / 100],
        end: [selectedPiece.position.x / 100 - 0.25, yFaceInferior, selectedPiece.position.z / 100],
      });
    }
    // Cota superior (entre a face superior da peça e a inferior da próxima, ou topo do espaço)
    let yFaceSuperior, yFaceInferiorAcima;
    if (idx < ordered.length - 1) {
      const acima = ordered[idx + 1];
      yFaceSuperior = faceSuperior(selectedPiece);
      yFaceInferiorAcima = faceInferior(acima);
    } else {
      yFaceSuperior = faceSuperior(selectedPiece);
      yFaceInferiorAcima = topoEspaco;
    }
    const valorSup = yFaceInferiorAcima - yFaceSuperior;
    console.log('valorSup:', valorSup);
    if (valorSup > 0 && valorSup < 100) {
      cotas.push({
        id: selectedPiece.id + (idx < ordered.length - 1 ? '-cima' : '-topo'),
        pos: [selectedPiece.position.x / 100 + 0.25, (yFaceSuperior + yFaceInferiorAcima) / 2, selectedPiece.position.z / 100],
        valor: valorSup,
        eixo: 'y',
        start: [selectedPiece.position.x / 100 + 0.25, yFaceSuperior, selectedPiece.position.z / 100],
        end: [selectedPiece.position.x / 100 + 0.25, yFaceInferiorAcima, selectedPiece.position.z / 100],
      });
    }
  }

  const [editingCotaId, setEditingCotaId] = useState<string | null>(null);
  const [editingCotaValue, setEditingCotaValue] = useState<string>('');

  // Função para lidar com edição da cota
  function handleEditCota(cotaId: string, valorAtual: number) {
    setEditingCotaId(cotaId);
    setEditingCotaValue(valorAtual.toFixed(0));
  }

  function handleCotaInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditingCotaValue(e.target.value.replace(/[^0-9]/g, ''));
  }

  function handleCotaInputBlur(cota: any) {
    // Aqui você pode chamar uma função para atualizar a posição da peça
    // Exemplo: onEditCota(cota, Number(editingCotaValue))
    setEditingCotaId(null);
  }

  function handleCotaInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cota: any) {
    if (e.key === 'Enter') {
      // Aqui você pode chamar uma função para atualizar a posição da peça
      // Exemplo: onEditCota(cota, Number(editingCotaValue))
      setEditingCotaId(null);
    } else if (e.key === 'Escape') {
      setEditingCotaId(null);
    }
  }

  const [localPieces, setLocalPieces] = useState<FurniturePiece[]>(space.pieces);

  // Atualiza localPieces quando o espaço muda (ex: ao adicionar/remover peças)
  useEffect(() => {
    setLocalPieces(space.pieces);
  }, [space.pieces]);

  return (
    <Suspense fallback={<LoadingSpinner message="Carregando visualização 3D..." />}>
        <Canvas
          camera={{ position: cameraPosition, fov }}
          style={{
            height: '100vh',
            background: 'var(--color-background-gradient)',
            borderRadius: 'var(--radius-lg)',
            margin: 'var(--space-1)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Suspense fallback={<Loading3D />}> 
          {/* Enhanced Lighting */}
          <ambientLight intensity={0.7} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.2} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.6} />
          <spotLight 
            position={[0, 10, 0]} 
            intensity={0.8} 
            angle={Math.PI / 6}
            penumbra={0.5}
            castShadow
          />

          {/* Enhanced Environment */}
          <Environment preset="studio" />
          
          {/* Beautiful Grid with Enhanced Styling */}
          <Grid 
            position={[0, gridYPosition, 0]}
            args={[25, 25]} 
            cellSize={1} 
            cellThickness={0.8} 
            cellColor="var(--color-border)" 
            sectionSize={5} 
            sectionThickness={2} 
            sectionColor="var(--color-primary)"
            fadeDistance={60}
            infiniteGrid
          />

          {/* Fog for depth */}
          <fog attach="fog" args={['#f8fafc', 30, 100]} />

          {/* Espaço principal (se ainda ativo) */}
          {space.isActive !== false && (!space.subSpaces || space.subSpaces.length === 0) && (
            <SingleSpaceVisualizer 
              space={space} 
              isSelected={selectedSpaceId === space.id}
              onSelect={onSelectSpace}
            />
          )}

          {/* Espaços filhos (subSpaces) - criados após inserir peças divisórias */}
          {space.subSpaces && space.subSpaces.map((subSpace) => {
            console.log('🎨 Renderizando subSpace:', {
              id: subSpace.id,
              name: subSpace.name,
              dimensions: subSpace.currentDimensions,
              isSelected: selectedSpaceId === subSpace.id
            });
            return (
              <SingleSpaceVisualizer 
                key={subSpace.id} 
                space={subSpace} 
                isSelected={selectedSpaceId === subSpace.id}
                onSelect={onSelectSpace}
              />
            );
          })}

          {/* Peças do móvel */}
          {localPieces.map((piece) => (
            <group key={piece.id}>
              <PieceVisualizer 
                piece={piece} 
                // Selecionar peça ao clicar
                onClick={() => onSelectPiece && onSelectPiece(piece.id)}
              />
            </group>
          ))}

          {/* Enhanced Camera Controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={2}
            maxDistance={100}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </Suspense>
  );
};
