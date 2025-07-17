import React from 'react';
import styled from 'styled-components';

const SpaceSelectorContainer = styled.div`
  position: fixed;
  top: 120px; /* Abaixo do toolbar */
  left: 24px;
  background: var(--color-toolbar-surface);
  color: var(--color-text);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  z-index: 900;
  padding: var(--space-4);
  min-width: 200px;
  max-width: 250px;
  animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  /* Glassmorphism effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05));
    border-radius: var(--radius-lg);
    pointer-events: none;
  }
`;

const Title = styled.h3`
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary), transparent);
    border-radius: var(--radius-sm);
  }
`;

const SpaceButton = styled.button<{ $isSelected: boolean; $isMain: boolean }>`
  width: 100%;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
  border: 2px solid;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: ${({ $isSelected, $isMain }) => 
    $isSelected 
      ? 'var(--color-primary)' 
      : $isMain 
        ? 'var(--color-background)' 
        : 'var(--color-surface)'
  };
  color: ${({ $isSelected }) => $isSelected ? 'white' : 'var(--color-text)'};
  border-color: ${({ $isSelected, $isMain }) => 
    $isSelected 
      ? 'var(--color-primary)' 
      : $isMain 
        ? 'var(--color-primary)' 
        : 'var(--color-border)'
  };
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SpaceInfo = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: var(--color-background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
`;

const SpaceCount = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
  padding: var(--space-2);
  background: var(--color-background);
  border-radius: var(--radius-sm);
  text-align: center;
  font-weight: 600;
`;

interface SpaceSelectorProps {
  selectedSpaceId: string | null;
  activeSpaces: any[];
  onSelectSpace: (spaceId: string | null) => void;
  mainSpaceId: string;
  mainSpaceName: string;
}

export const SpaceSelector = ({ 
  selectedSpaceId, 
  activeSpaces, 
  onSelectSpace, 
  mainSpaceId,
  mainSpaceName 
}: SpaceSelectorProps) => {
  const totalSpaces = activeSpaces.length + 1; // +1 para o espaço principal
  
  // Só mostrar se há espaços filhos ou se há pelo menos o espaço principal
  if (activeSpaces.length === 0) {
    return null;
  }
  
  return (
    <SpaceSelectorContainer>
      <Title>🎯 Seleção de Espaços</Title>
      
      <SpaceCount>
        {totalSpaces} espaço{totalSpaces !== 1 ? 's' : ''} disponível{totalSpaces !== 1 ? 'is' : ''}
      </SpaceCount>
      
      {/* Espaço Principal */}
      <SpaceButton
        $isSelected={selectedSpaceId === null}
        $isMain={true}
        onClick={() => onSelectSpace(null)}
        title={`${mainSpaceName} (Dimensões principais do móvel)`}
      >
        🏠 {mainSpaceName}
      </SpaceButton>
      
      {/* Espaços Filhos */}
      {activeSpaces.map((space) => (
        <SpaceButton
          key={space.id}
          $isSelected={selectedSpaceId === space.id}
          $isMain={false}
          onClick={() => onSelectSpace(space.id)}
          title={`${space.name} (${space.currentDimensions.width}×${space.currentDimensions.height}×${space.currentDimensions.depth}mm)`}
        >
          🔵 {space.name}
        </SpaceButton>
      ))}
      
      {activeSpaces.length > 0 && (
        <SpaceInfo>
          <div>💡 Clique em um espaço para selecioná-lo</div>
          <div>📏 Dimensões são mostradas no tooltip</div>
        </SpaceInfo>
      )}
    </SpaceSelectorContainer>
  );
}; 