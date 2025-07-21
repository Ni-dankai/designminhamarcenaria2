import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { PieceType, FurniturePiece } from '../types/furniture';
import { InsertionMode, InsertionContext } from '../types/insertion';

// Componentes Estilizados (Styled Components)
const ToolbarContainer = styled.div`
  position: fixed;
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-toolbar-surface, #ffffffcc);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl, 12px);
  box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1));
  border: 1px solid var(--color-border, #e5e7eb);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -2px;
    top: 25%;
    bottom: 25%;
    width: 1px;
    background-color: var(--color-border);
  }
`;

const SectionLabel = styled.span`
  font-size: var(--font-size-xs, 12px);
  font-weight: 600;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
`;

// CORREÇÃO: Props $isActive e $imageUrl agora são "transient"
const TextureSwatch = styled.button<{ $imageUrl: string; $isActive: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid ${({ $isActive }) => ($isActive ? 'var(--color-primary)' : 'var(--color-border)')};
  background-image: url(${({ $imageUrl }) => $imageUrl});
  background-size: cover;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ $isActive }) => ($isActive ? '0 0 0 4px var(--color-primary)' : 'none')};

  &:hover {
    transform: scale(1.1);
  }
`;

const ToolButton = styled.button<{ $color?: string; $variant?: 'primary' | 'secondary' | 'danger'; $isActive?: boolean }>`
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  min-width: auto;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Base styles */
  ${({ $variant, $color, $isActive }) => {
    if ($variant === 'danger') {
      return `
        background: linear-gradient(135deg, var(--color-error), #b91c1c);
        color: white;
        box-shadow: var(--shadow-sm);
        
        &:hover {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
      `;
    }
    if ($variant === 'secondary') {
      return `
        background: var(--color-background);
        color: var(--color-text);
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
        
        &:hover {
          background: var(--color-background-alt);
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
      `;
    }
    return `
      background: ${$isActive 
        ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))'
        : `linear-gradient(135deg, ${$color || 'var(--color-primary)'}, ${$color ? $color + 'dd' : 'var(--color-primary-hover)'})`
      };
      color: white;
      box-shadow: var(--shadow-sm);
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
        filter: brightness(1.1);
      }
    `;
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: var(--shadow-sm) !important;
    filter: none !important;
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-light);
    outline-offset: 2px;
  }
`;

const ModeToggle = styled.button<{ $isActive: boolean }>`
  padding: var(--space-2) var(--space-4);
  border: 1px solid ${({ $isActive }) => $isActive ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: var(--radius-md);
  background: ${({ $isActive }) => 
    $isActive 
      ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' 
      : 'var(--color-surface)'
  };
  color: ${({ $isActive }) => $isActive ? 'white' : 'var(--color-text-secondary)'};
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ $isActive }) => $isActive ? 'var(--shadow-sm)' : 'var(--shadow-sm)'};
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  
  &:hover {
    background: ${({ $isActive }) => 
      $isActive 
        ? 'linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))' 
        : 'var(--color-background-alt)'
    };
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-light);
    outline-offset: 2px;
  }
`;

const DimensionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const DimensionInput = styled.input`
  width: 60px;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }
`;

// Cole aqui todos os seus "styled-components" para o Toolbar
// (ToolbarContainer, ToolbarSection, ToolButton, etc.)
// ...

// Certifique-se de que o Dropdown e outros componentes estilizados estejam definidos.
const Dropdown = styled.div<{ $isOpen: boolean; }>`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 1001;
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
  min-width: 320px;
  max-height: 400px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DropdownHeader = styled.div`
  padding: var(--space-3) var(--space-4);
  background: var(--color-background-alt);
  font-weight: 600;
  color: var(--color-text);
`;

const PiecesList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding: var(--space-2);
`;

const PieceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  transition: background 0.2s ease;
  
  &:hover {
    background: var(--color-background-alt);
  }
`;

const PieceName = styled.span`
  font-weight: 500;
  color: var(--color-text-secondary);
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-error);
    background: var(--color-error)15;
  }
`;


// Interface e Componente Principal
interface ToolbarProps {
  insertionContext: InsertionContext;
  onModeChange: (mode: InsertionMode) => void;
  onAddPiece: (pieceType: PieceType) => void;
  onRemovePiece: (pieceId: string) => void;
  onClearAll: () => void;
  pieces: FurniturePiece[];
  originalDimensions: { width: number; height: number; depth: number }; // Usaremos esta
  onUpdateDimensions: (dimensions: { width: number; height: number; depth: number }) => void;
  defaultThickness: number;
  onThicknessChange: (thickness: number) => void;
  availableTextures: { name: string; url: string; }[];
  currentTextureUrl: string;
  onTextureChange: (url: string) => void;
  onHoverPiece: (id: string | null) => void; // Nova prop para a função
  [key: string]: any; // Permite outras props
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  insertionContext, 
  onModeChange, 
  onAddPiece,
  onRemovePiece,
  onClearAll,
  pieces,
  originalDimensions, // Usando a prop de dimensões originais
  onUpdateDimensions,
  defaultThickness,
  onThicknessChange,
  availableTextures,
  currentTextureUrl,
  onTextureChange,
  onHoverPiece,
  // ... outras props
}) => {
  // =====================================================================================
  // CORREÇÃO: Lógica para controlar a visibilidade do dropdown
  // =====================================================================================
  const [showPiecesList, setShowPiecesList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook para fechar o dropdown ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPiecesList(false);
      }
    };
    // Adiciona o listener quando o dropdown está aberto
    if (showPiecesList) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    // Remove o listener ao limpar o efeito
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPiecesList]);

  // =====================================================================================
  // CORREÇÃO: O state dos inputs agora é baseado em `originalDimensions`
  // =====================================================================================
  const [tempDimensions, setTempDimensions] = useState(originalDimensions);

  // O state só é atualizado se a prop `originalDimensions` mudar externamente
  useEffect(() => {
    setTempDimensions(originalDimensions);
  }, [originalDimensions]);

  const handleApplyDimensions = () => {
    onUpdateDimensions(tempDimensions);
  };
  
  const handleResetDimensions = () => {
    // Apenas reseta os valores nos campos de input para as dimensões totais atuais
    setTempDimensions(originalDimensions);
  };

  // A lógica de "mudanças" agora compara com as dimensões totais
  const hasChanges = tempDimensions.width !== originalDimensions.width || 
                     tempDimensions.height !== originalDimensions.height || 
                     tempDimensions.depth !== originalDimensions.depth;

  const structuralPieces = [
    { type: PieceType.LATERAL_LEFT, name: 'L.Esq', color: '#8b5cf6', position: 1 },
    { type: PieceType.LATERAL_RIGHT, name: 'L.Dir', color: '#8b5cf6', position: 2 },
    { type: PieceType.LATERAL_FRONT, name: 'Front', color: '#f59e0b', position: 3 },
    { type: PieceType.LATERAL_BACK, name: 'Tras', color: '#f59e0b', position: 4 },
    { type: PieceType.BOTTOM, name: 'Fundo', color: '#ef4444', position: 5 },
    { type: PieceType.TOP, name: 'Tampo', color: '#ef4444', position: 6 },
  ];

  const internalPieces = [
    { type: PieceType.SHELF, name: 'Pratel.', color: '#10b981', position: 1 },
    { type: PieceType.DIVIDER_VERTICAL, name: 'Div.V', color: '#3b82f6', position: 2 },
  ];

  const hasInternalSpace = originalDimensions.width > 0 && 
                          originalDimensions.height > 0 && 
                          originalDimensions.depth > 0;

  return (
    <ToolbarContainer>
        {/* Seção de Modo */}
        <ToolbarSection>
            <SectionLabel>Modo</SectionLabel>
            <ModeToggle
              $isActive={insertionContext.mode === InsertionMode.STRUCTURAL}
              onClick={() => onModeChange(InsertionMode.STRUCTURAL)}
            >
              Estrutural
            </ModeToggle>
            <ModeToggle
              $isActive={insertionContext.mode === InsertionMode.INTERNAL}
              onClick={() => onModeChange(InsertionMode.INTERNAL)}
            >
              Interno
            </ModeToggle>
        </ToolbarSection>

        {/* Seção de Espessura */}
        <ToolbarSection>
            <SectionLabel>Espessura</SectionLabel>
            <input
              type="number"
              value={defaultThickness}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onThicknessChange(Number(e.target.value))}
              min="1"
              max="200"
              title="Espessura das peças em milímetros"
            />
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>mm</span>
        </ToolbarSection>

        {/* Seção de Dimensões */}
        <ToolbarSection>
            <SectionLabel>Dimensões</SectionLabel>
            <DimensionGroup>
                <SectionLabel style={{marginLeft: '4px'}}>L</SectionLabel>
                <DimensionInput type="number" value={tempDimensions.width} onChange={(e) => setTempDimensions(p => ({...p, width: Number(e.target.value)}))} />
                <SectionLabel>A</SectionLabel>
                <DimensionInput type="number" value={tempDimensions.height} onChange={(e) => setTempDimensions(p => ({...p, height: Number(e.target.value)}))} />
                <SectionLabel>P</SectionLabel>
                <DimensionInput type="number" value={tempDimensions.depth} onChange={(e) => setTempDimensions(p => ({...p, depth: Number(e.target.value)}))} />
                <span style={{color: 'var(--color-text-muted)', paddingRight: '4px'}}>mm</span>
            </DimensionGroup>
            <ToolButton $variant="secondary" onClick={handleApplyDimensions} disabled={!hasChanges} title="Aplicar dimensões">✓</ToolButton>
            <ToolButton $variant="secondary" onClick={handleResetDimensions} title="Resetar dimensões">↺</ToolButton>
        </ToolbarSection>

        {/* Seção de Acabamento (Textura) */}
        <ToolbarSection>
            <SectionLabel>Acabamento</SectionLabel>
            {availableTextures.map(texture => (
                <TextureSwatch
                    key={texture.url}
                    $imageUrl={texture.url}
                    $isActive={currentTextureUrl === texture.url}
                    onClick={() => onTextureChange(texture.url)}
                    title={texture.name}
                />
            ))}
        </ToolbarSection>

        {/* Seção de Adição de Peças */}
        <ToolbarSection>
            <SectionLabel>
              {insertionContext.mode === InsertionMode.STRUCTURAL ? 'Estrutural' : 'Interno'}
            </SectionLabel>
            
            {insertionContext.mode === InsertionMode.STRUCTURAL ? (
              <>
                {structuralPieces.map((piece) => (
                  <ToolButton
                    key={piece.type}
                    $color={piece.color}
                    onClick={() => onAddPiece(piece.type)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2', marginRight: 'var(--space-1)' }}
                  >
                    {piece.name}
                  </ToolButton>
                ))}
              </>
            ) : (
              <>
                {hasInternalSpace ? (
                  <>
                    {internalPieces.map((piece) => (
                      <ToolButton
                        key={piece.type}
                        $color={piece.color}
                        onClick={() => onAddPiece(piece.type)}
                        style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2', marginRight: 'var(--space-1)' }}
                      >
                        {piece.name}
                      </ToolButton>
                    ))}
                  </>
                ) : (
                  <span style={{ fontSize: '11px', padding: '8px', color: 'var(--color-text-muted)' }}>
                    ⚠️ Adicione peças estruturais primeiro
                  </span>
                )}
              </>
            )}
        </ToolbarSection>

        {/* Seção de Gerenciamento */}
        <ToolbarSection>
            <SectionLabel>Gerenciar</SectionLabel>
            
            {/* CORREÇÃO: `ref` adicionado para detectar cliques fora */}
            <div style={{position: 'relative'}} ref={dropdownRef}>
                <ToolButton 
                    $variant="secondary"
                    disabled={pieces.length === 0}
                    // A função de toggle do estado
                    onClick={() => setShowPiecesList(s => !s)}>
                    Peças ({pieces.length}) {showPiecesList ? '▲' : '▼'}
                </ToolButton>
                {/* O estado `showPiecesList` controla a propriedade `$isOpen` */}
                <Dropdown $isOpen={showPiecesList}>
                    <DropdownHeader>Peças Adicionadas</DropdownHeader>
                    <PiecesList>
                        {pieces.length > 0 ? pieces.map((piece) => (
                            <PieceItem 
                              key={piece.id}
                              // NOVO: Eventos de mouse para destacar a peça
                              onMouseEnter={() => onHoverPiece(piece.id)}
                              onMouseLeave={() => onHoverPiece(null)}
                            >
                                <PieceName>{piece.name}</PieceName>
                                <RemoveButton onClick={() => onRemovePiece(piece.id)} title={`Remover ${piece.name}`}>×</RemoveButton>
                            </PieceItem>
                        )) : <div style={{padding: '16px', color: 'var(--color-text-muted)'}}>Nenhuma peça.</div>}
                    </PiecesList>
                </Dropdown>
            </div>

            <ToolButton
              $variant="danger"
              onClick={onClearAll}
              disabled={pieces.length === 0}
            >
              Limpar
            </ToolButton>
        </ToolbarSection>

    </ToolbarContainer>
  );
};
