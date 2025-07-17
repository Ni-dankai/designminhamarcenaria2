import { useState, useEffect } from 'react';
import { Scene3D } from './components/Scene3D';
import { Toolbar } from './components/Toolbar';
import { InstructionsPanel } from './components/InstructionsPanelNew';
import { FloatingActionButtons } from './components/FloatingActionButtons';
import { SpaceSelector } from './components/SpaceSelector';
import { useSimplifiedFurnitureDesign } from './hooks/useSimplifiedFurnitureDesign';

const App = () => {
  const {
    space,
    allPieces, // <--- Pegar a lista completa de peças
    insertionContext,
    addPiece,
    removePiece,
    clearAllPieces,
    setInsertionMode,
    defaultThickness,
    setDefaultThickness,
    selectedSpaceId,
    selectSpace,
    activeSpaces,
    feedbackMessage,
    updateDimensions,
  } = useSimplifiedFurnitureDesign();

  // Estado para peça selecionada
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('💾 Salvando projeto...', { space, insertionContext });
    // You could save to localStorage, export as JSON, etc.
    const projectData = {
      space,
      insertionContext,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('furniture-design-project', JSON.stringify(projectData));
    console.log('✅ Projeto salvo!');
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: 'var(--color-background-gradient)',
        overflow: 'hidden',
        transition: 'background 0.3s',
      }}
    >
      {/* Botão de alternância de tema - agora mais abaixo */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{
          position: 'fixed',
          top: 110,
          right: 24,
          zIndex: 2000,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontWeight: 600,
        }}
        aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        {theme === 'dark' ? '🌙 Noite' : '☀️ Claro'}
      </button>

      <Scene3D
        space={space}
        allPieces={allPieces} // <--- Garantir que a lista completa de peças seja passada
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={selectSpace}
        selectedPieceId={selectedPieceId}
        onSelectPiece={setSelectedPieceId}
      />

      <Toolbar
        insertionContext={insertionContext}
        onModeChange={setInsertionMode}
        onAddPiece={addPiece}
        onRemovePiece={removePiece}
        onClearAll={clearAllPieces}
        pieces={allPieces} // <--- Passar a lista completa de peças para o Toolbar
        currentDimensions={space.currentDimensions}
        originalDimensions={space.originalDimensions}
        onUpdateDimensions={updateDimensions}
        defaultThickness={defaultThickness}
        onThicknessChange={setDefaultThickness}
        selectedSpaceId={selectedSpaceId}
        activeSpaces={activeSpaces}
        // feedbackMessage removido pois não existe mais no hook
      />

      <SpaceSelector
        activeSpaces={activeSpaces}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={selectSpace}
        mainSpaceId={space.id}
        mainSpaceName={space.name}
      />

      <InstructionsPanel />

      <FloatingActionButtons
        onReset={clearAllPieces}
        onSave={handleSave}
        onFullscreen={handleFullscreen}
      />
    </div>
  );
};

export default App;
