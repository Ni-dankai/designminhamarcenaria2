import { Scene3D } from './components/Scene3D';
import { SimplifiedControlPanel } from './components/SimplifiedControlPanel';
import { InstructionsPanel } from './components/InstructionsPanel';
import { useSimplifiedFurnitureDesign } from './hooks/useSimplifiedFurnitureDesign';
import { useState } from 'react';

const App = () => {
  const {
    space,
    insertionContext,
    addPiece,
    setInsertionMode,
    allPieces,
    currentTextureUrl, // Adicionado para passar para Scene3D
  } = useSimplifiedFurnitureDesign();

  // Estado para peça selecionada
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Scene3D
        space={space}
        allPieces={allPieces}
        selectedPieceId={selectedPieceId}
        onSelectPiece={setSelectedPieceId}
        textureUrl={currentTextureUrl} // Corrigido: prop obrigatória
      />

      <SimplifiedControlPanel
        insertionContext={insertionContext}
        onModeChange={setInsertionMode}
        onAddPiece={addPiece}
        currentDimensions={space.currentDimensions}
      />

      <InstructionsPanel />
    </div>
  );
};

export default App;
