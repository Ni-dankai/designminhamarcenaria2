import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { PieceType, FurniturePiece } from '../types/furniture';
import { InsertionMode, InsertionContext } from '../types/insertion';

const ToolbarContainer = styled.div`
  position: fixed;
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-toolbar-surface);
  color: var(--color-text);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  max-width: 98vw;
  width: auto;
  min-width: 1200px;
  height: 80px; /* Back to more compact height */
  overflow: visible;
  animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @media (max-width: 1400px) {
    min-width: 1000px;
    font-size: 0.95em;
    height: 90px;
  }
  
  @media (max-width: 1200px) {
    min-width: 900px;
    height: auto;
    flex-wrap: wrap;
    padding: var(--space-4);
    gap: var(--space-3);
  }
  
  @media (max-width: 1000px) {
    min-width: 800px;
    height: auto;
    flex-wrap: wrap;
    padding: var(--space-4);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-3);
    max-width: 90vw;
    min-width: unset;
    height: auto;
    padding: var(--space-4);
  }

  /* Glassmorphism effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05));
    border-radius: var(--radius-xl);
    pointer-events: none;
  }
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-right: 1px solid var(--color-border-light);
  flex-shrink: 0;
  position: relative;
  height: 100%;
  justify-content: center;
  
  &:last-child {
    border-right: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    right: -1px;
    top: 15%;
    bottom: 15%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--color-border), transparent);
  }
  
  &:last-child::after {
    display: none;
  }
  
  @media (max-width: 1200px) {
    border-right: none;
    padding: var(--space-3);
    height: auto;
    min-height: auto;
    
    &::after {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-2) 0;
    width: 100%;
    justify-content: center;
    height: auto;
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const SectionLabel = styled.span`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  margin-right: var(--space-2);
  
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
  
  @media (max-width: 1400px) {
    font-size: var(--font-size-xs);
  }
  
  @media (max-width: 1000px) {
    display: none; /* Hide labels on smaller screens to save space */
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
  height: 40px; /* Increased for better usability */
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
  
  /* Ripple effect */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s, height 0.3s;
  }
  
  &:active::before {
    width: 300px;
    height: 300px;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: var(--shadow-sm) !important;
    filter: none !important;
  }
  
  /* Accessibility */
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
  height: 36px; /* Good size for mode toggles */
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
  
  /* Smooth transition for active state */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(29, 78, 216, 0.1));
    opacity: ${({ $isActive }) => $isActive ? 1 : 0};
    transition: opacity 0.3s ease;
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-light);
    outline-offset: 2px;
  }
`;

const PiecesList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding: var(--space-2);
  
  /* Beautiful scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-background-alt);
    border-radius: var(--radius-sm);
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
    border-radius: var(--radius-sm);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  }
`;

const PieceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-1);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: var(--color-background-alt);
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  /* Subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.02), transparent);
    transition: opacity 0.2s ease;
    opacity: 0;
    pointer-events: none;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const PieceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
`;

const PieceMainInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const PieceDimensions = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  background: var(--color-background-alt);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: 500;
`;

const PieceColor = styled.div<{ $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: var(--radius-sm);
  background: ${({ $color }) => $color};
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
`;

const PieceName = styled.span`
  font-weight: 600;
  color: var(--color-text);
  font-size: var(--font-size-sm);
`;

const RemoveButton = styled.button`
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-error), #b91c1c);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    background: linear-gradient(135deg, #b91c1c, #991b1b);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Dropdown = styled.div<{ $isOpen: boolean; $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  background: var(--color-surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 1001;
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
  min-width: 320px;
  max-height: 400px;
  overflow: hidden;
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Glassmorphism effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05));
    border-radius: var(--radius-xl);
    pointer-events: none;
  }
`;

const DropdownHeader = styled.div`
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(135deg, var(--color-background-alt), var(--color-background));
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: var(--space-5);
    right: var(--space-5);
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  }
`;

const PieceCount = styled.span`
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

interface ToolbarProps {
  insertionContext: InsertionContext;
  onModeChange: (mode: InsertionMode) => void;
  onAddPiece: (pieceType: PieceType) => void;
  onRemovePiece: (pieceId: string) => void;
  onClearAll: () => void;
  pieces: FurniturePiece[];
  currentDimensions: { width: number; height: number; depth: number };
  originalDimensions: { width: number; height: number; depth: number };
  onUpdateDimensions: (dimensions: { width: number; height: number; depth: number }) => void;
  defaultThickness: number;
  onThicknessChange: (thickness: number) => void;
  feedbackMessage?: string | null;
}

export const Toolbar = ({ 
  insertionContext, 
  onModeChange, 
  onAddPiece,
  onRemovePiece,
  onClearAll,
  pieces,
  currentDimensions,
  originalDimensions,
  onUpdateDimensions,
  defaultThickness,
  onThicknessChange,
  feedbackMessage,
}: ToolbarProps) => {
  const [showPiecesList, setShowPiecesList] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados para controles de dimensão
  const [tempDimensions, setTempDimensions] = useState({
    width: currentDimensions.width,
    height: currentDimensions.height,
    depth: currentDimensions.depth
  });
  
  // Estado para erros de validação da chapa
  const [sheetValidationErrors, setSheetValidationErrors] = useState<string[]>([]);
  
  // Atualizar dimensões temporárias quando as atuais mudarem
  useEffect(() => {
    setTempDimensions({
      width: currentDimensions.width,
      height: currentDimensions.height,
      depth: currentDimensions.depth
    });
    setSheetValidationErrors([]); // Limpar erros ao resetar
  }, [currentDimensions]);
  
  // Validar em tempo real conforme o usuário digita
  useEffect(() => {
    const validation = validateSheetDimensions(tempDimensions.width, tempDimensions.height, tempDimensions.depth);
    if (!validation.valido && tempDimensions.width > 0 && tempDimensions.height > 0 && tempDimensions.depth > 0) {
      const erros = Object.values(validation.erros).filter(erro => erro !== null);
      setSheetValidationErrors(erros);
    } else {
      setSheetValidationErrors([]);
    }
  }, [tempDimensions]);
  
  // Aplicar novas dimensões
  const handleApplyDimensions = () => {
    if (tempDimensions.width > 0 && tempDimensions.height > 0 && tempDimensions.depth > 0) {
      // Validar dimensões baseadas na chapa
      const validation = validateSheetDimensions(tempDimensions.width, tempDimensions.height, tempDimensions.depth);
      
      if (!validation.valido) {
        const erros = Object.values(validation.erros).filter(erro => erro !== null);
        setSheetValidationErrors(erros);
        console.warn('❌ Dimensões inválidas para chapa padrão:', erros);
        return;
      }
      
      // Limpar erros se validação passou
      setSheetValidationErrors([]);
      onUpdateDimensions(tempDimensions);
    }
  };
  
  // Resetar para dimensões originais
  const handleResetDimensions = () => {
    setTempDimensions(originalDimensions);
    onUpdateDimensions(originalDimensions);
  };

  useEffect(() => {
    if (showPiecesList && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const minMargin = 16; // margem mínima
      const dropdownWidth = 320; // min-width do dropdown
      const toolbarHeight = 80; // altura do toolbar

      // Posição padrão: abaixo do toolbar, centralizado em relação ao botão
      let top = toolbarHeight + minMargin; // sempre abaixo do toolbar
      // Centralizar o dropdown em relação ao botão
      let left = buttonRect.left + (buttonRect.width / 2) - (dropdownWidth / 2);
      // Garantir que não ultrapasse a borda esquerda
      if (left < minMargin) left = minMargin;
      // Garantir que não ultrapasse a borda direita
      if (left + dropdownWidth > viewportWidth - minMargin) {
        left = viewportWidth - dropdownWidth - minMargin;
      }

      setDropdownPosition({ top, left });
    }
  }, [showPiecesList]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowPiecesList(false);
      }
    };

    if (showPiecesList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPiecesList]);

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

  const hasInternalSpace = currentDimensions.width > 0 && 
                          currentDimensions.height > 0 && 
                          currentDimensions.depth > 0;

  // Constantes da chapa padrão
  const CHAPA_MAX_COMPRIMENTO = 2750; // mm
  const CHAPA_MAX_LARGURA = 1850; // mm
  
  // Função para validar dimensões baseadas no tamanho da chapa
  const validateSheetDimensions = (width: number, height: number, depth: number) => {
    // Para móveis, consideramos as dimensões horizontais (width x depth)
    // A maior dimensão horizontal é o comprimento, a menor é a largura
    const horizontalDimensions = [width, depth].sort((a, b) => b - a);
    const comprimento = horizontalDimensions[0];
    const largura = horizontalDimensions[1];
    
    // Altura é sempre vertical, não afetada pelos limites da chapa para estrutura
    const alturaValida = height <= Math.max(CHAPA_MAX_COMPRIMENTO, CHAPA_MAX_LARGURA);
    const comprimentoValido = comprimento <= CHAPA_MAX_COMPRIMENTO;
    const larguraValida = largura <= CHAPA_MAX_LARGURA;
    
    return {
      valido: alturaValida && comprimentoValido && larguraValida,
      comprimento,
      largura,
      altura: height,
      erros: {
        comprimento: !comprimentoValido ? `Comprimento ${comprimento}mm excede limite da chapa (${CHAPA_MAX_COMPRIMENTO}mm)` : null,
        largura: !larguraValida ? `Largura ${largura}mm excede limite da chapa (${CHAPA_MAX_LARGURA}mm)` : null,
        altura: !alturaValida ? `Altura ${height}mm excede limite da chapa (${Math.max(CHAPA_MAX_COMPRIMENTO, CHAPA_MAX_LARGURA)}mm)` : null,
      }
    };
  };

  return (
    <>
      {feedbackMessage && (
        <div style={{ color: feedbackMessage.includes('❌') ? 'var(--color-error)' : 'var(--color-success)', marginBottom: 'var(--space-3)' }}>
          {feedbackMessage}
        </div>
      )}
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

      {/* Seção de Controles de Dimensão */}
      <ToolbarSection>
        <SectionLabel>Dimensões</SectionLabel>
        <label>
          L:
          <input
            type="number"
            value={tempDimensions.width}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempDimensions(prev => ({
              ...prev,
              width: Number(e.target.value) || 0
            }))}
            min="1"
            max="10000"
            title="Largura do móvel"
          />
        </label>
        <label>
          A:
          <input
            type="number"
            value={tempDimensions.height}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempDimensions(prev => ({
              ...prev,
              height: Number(e.target.value) || 0
            }))}
            min="1"
            max="10000"
            title="Altura do móvel"
          />
        </label>
        <label>
          P:
          <input
            type="number"
            value={tempDimensions.depth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempDimensions(prev => ({
              ...prev,
              depth: Number(e.target.value) || 0
            }))}
            min="1"
            max="10000"
            title="Profundidade do móvel"
          />
        </label>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text)' }}>mm</span>
        
        <ToolButton
          $variant="primary"
          onClick={handleApplyDimensions}
          disabled={
            (tempDimensions.width === currentDimensions.width &&
            tempDimensions.height === currentDimensions.height &&
            tempDimensions.depth === currentDimensions.depth) ||
            sheetValidationErrors.length > 0
          }
          title={sheetValidationErrors.length > 0 ? 
            "Corrija os erros de dimensão antes de aplicar" : 
            "Aplicar novas dimensões"}
          style={{ marginLeft: 'var(--space-2)' }}
        >
          ✓
        </ToolButton>
        <ToolButton
          $variant="secondary"
          onClick={handleResetDimensions}
          title="Resetar para dimensões originais"
        >
          ↺
        </ToolButton>
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
        
        <DropdownContainer>
          <ToolButton
            ref={buttonRef}
            $variant="secondary"
            disabled={pieces.length === 0}
            onClick={() => setShowPiecesList(!showPiecesList)}
            style={{ marginRight: 'var(--space-2)' }}
          >
            Peças ({pieces.length}) {pieces.length > 0 ? (showPiecesList ? '▲' : '▼') : ''}
          </ToolButton>
        </DropdownContainer>

        <ToolButton
          $variant="danger"
          onClick={onClearAll}
          disabled={pieces.length === 0}
        >
          Limpar
        </ToolButton>

        {pieces.length > 0 && (
          <Dropdown 
            ref={dropdownRef}
            $isOpen={showPiecesList}
            $top={dropdownPosition.top}
            $left={dropdownPosition.left}
          >
            <DropdownHeader>
              <span>Peças Adicionadas</span>
              <PieceCount>{pieces.length}</PieceCount>
            </DropdownHeader>
            <PiecesList>
              {pieces.map((piece) => (
                <PieceItem key={piece.id}>
                  <PieceInfo>
                    <PieceMainInfo>
                      <PieceColor $color={piece.color} />
                      <PieceName>{piece.name}</PieceName>
                    </PieceMainInfo>
                    <PieceDimensions>
                      <span style={{color: 'var(--color-text)'}}>{Math.round(piece.dimensions.width)}×{Math.round(piece.dimensions.height)}×{Math.round(piece.dimensions.depth)}mm</span>
                    </PieceDimensions>
                  </PieceInfo>
                  <RemoveButton 
                    onClick={e => { e.stopPropagation(); onRemovePiece(piece.id); }}
                    title={`Remover ${piece.name}`}
                  >
                    ✕
                  </RemoveButton>
                </PieceItem>
              ))}
            </PiecesList>
          </Dropdown>
        )}
      </ToolbarSection>

    </ToolbarContainer>
    </>
  );
};
