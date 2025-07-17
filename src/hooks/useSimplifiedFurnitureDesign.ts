import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FurnitureSpace, Dimensions, PieceType, FurniturePiece } from '../types/furniture';
import { InsertionMode, InsertionContext } from '../types/insertion';
import { SpaceCuttingSystem } from '../utils/spaceCutting';

export const useSimplifiedFurnitureDesign = () => {
  const [defaultThickness, setDefaultThickness] = useState(18);
  // Usar mesma espessura para visual e corte - simplificado
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const [mainSpace, setMainSpace] = useState<FurnitureSpace>({
    id: uuidv4(),
    name: 'Móvel Principal',
    originalDimensions: { width: 800, height: 2100, depth: 600 },
    currentDimensions: { width: 800, height: 2100, depth: 600 },
    position: { x: 0, y: 0, z: 0 },
    pieces: [],
    isActive: true,
  });

  const [activeSpaces, setActiveSpaces] = useState<FurnitureSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // Getter para compatibilidade - retorna o espaço principal ou o primeiro espaço ativo
  const space = activeSpaces.length > 0 ? 
    { ...mainSpace, subSpaces: activeSpaces } : 
    mainSpace;

  // Debug: verificar estado dos espaços
  console.log('🏠 Hook - Estado dos espaços:', {
    mainSpace: {
      id: mainSpace.id,
      name: mainSpace.name,
      isActive: mainSpace.isActive,
      piecesCount: mainSpace.pieces.length
    },
    activeSpaces: {
      count: activeSpaces.length,
      spaces: activeSpaces.map(s => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        piecesCount: s.pieces.length,
        dimensions: s.currentDimensions
      }))
    },
    spaceObject: {
      id: space.id,
      name: space.name,
      subSpacesCount: space.subSpaces?.length || 0
    }
  });

  // Função para obter o espaço selecionado
  const getSelectedSpace = useCallback((): FurnitureSpace | null => {
    if (!selectedSpaceId) return null;
    
    // Verificar se é o espaço principal
    if (selectedSpaceId === mainSpace.id) {
      return mainSpace;
    }
    
    // Verificar se é um dos espaços ativos
    return activeSpaces.find(s => s.id === selectedSpaceId) || null;
  }, [selectedSpaceId, mainSpace, activeSpaces]);

  // Função para selecionar um espaço
  const selectSpace = useCallback((spaceId: string | null) => {
    setSelectedSpaceId(spaceId);
    console.log('🎯 Espaço selecionado:', {
      spaceId,
      isMainSpace: spaceId === mainSpace.id,
      isChildSpace: activeSpaces.some(s => s.id === spaceId),
      availableSpaces: {
        main: mainSpace.id,
        children: activeSpaces.map(s => ({ id: s.id, name: s.name, isActive: s.isActive }))
      }
    });
  }, [mainSpace.id, activeSpaces]);

  console.log('🏠 Estado atual:', {
    mainSpace: mainSpace.name,
    mainSpaceActive: mainSpace.isActive,
    activeSpacesCount: activeSpaces.length,
    totalPieces: mainSpace.pieces.length
  });

  const [insertionContext, setInsertionContext] = useState<InsertionContext>({
    mode: InsertionMode.STRUCTURAL,
  });

  const createNewSpace = useCallback((dimensions: Dimensions, name: string = 'Novo Móvel') => {
    const newSpace: FurnitureSpace = {
      id: uuidv4(),
      name,
      originalDimensions: dimensions,
      currentDimensions: dimensions,
      position: { x: 0, y: 0, z: 0 },
      pieces: [],
      isActive: true,
    };
    setMainSpace(newSpace);
    setActiveSpaces([]);
  }, []);

  const addPiece = useCallback((pieceType: PieceType, thickness?: number, customName?: string, cutThickness?: number) => {
    const finalThickness = thickness ?? defaultThickness;
    const finalCutThickness = cutThickness ?? defaultThickness; // Usar mesma espessura
    const isInternalPiece = [
      PieceType.SHELF,
      PieceType.DIVIDER_VERTICAL
    ].includes(pieceType);

    const isStructuralPiece = [
      PieceType.LATERAL_LEFT,
      PieceType.LATERAL_RIGHT,
      PieceType.LATERAL_FRONT,
      PieceType.LATERAL_BACK,
      PieceType.BOTTOM,
      PieceType.TOP
    ].includes(pieceType);

    // Para peças internas ou estruturais, usar o espaço selecionado ou o principal
    let targetSpace: FurnitureSpace;
    const selectedSpace = getSelectedSpace();
    if (isInternalPiece || isStructuralPiece) {
      console.log('🔍 Verificando espaço para peça:', {
        pieceType,
        isInternal: isInternalPiece,
        isStructural: isStructuralPiece,
        selectedSpace: selectedSpace?.name,
        selectedSpaceActive: selectedSpace?.isActive,
        activeSpacesCount: activeSpaces.length,
        mainSpaceActive: mainSpace.isActive
      });
      
      if (selectedSpace && selectedSpace.isActive !== false) {
        targetSpace = selectedSpace;
        console.log('✅ Usando espaço selecionado:', targetSpace.name);
      } else if (activeSpaces.length > 0) {
        targetSpace = activeSpaces[0];
        console.log('✅ Usando primeiro espaço ativo:', targetSpace.name);
      } else if (mainSpace.isActive !== false) {
        targetSpace = mainSpace;
        console.log('✅ Usando espaço principal:', targetSpace.name);
      } else {
        console.warn('❌ Nenhum espaço disponível para peças internas');
        setFeedbackMessage('❌ Nenhum espaço disponível para peças internas');
        setTimeout(() => setFeedbackMessage(null), 3000);
        return;
      }
      
      console.log('📏 Dimensões do espaço alvo:', {
        width: targetSpace.currentDimensions.width,
        height: targetSpace.currentDimensions.height,
        depth: targetSpace.currentDimensions.depth,
        isValid: targetSpace.currentDimensions.width > 0 && 
                 targetSpace.currentDimensions.height > 0 && 
                 targetSpace.currentDimensions.depth > 0
      });
      
      if (targetSpace.currentDimensions.width <= 0 || 
          targetSpace.currentDimensions.height <= 0 || 
          targetSpace.currentDimensions.depth <= 0) {
        console.warn('❌ Espaço selecionado não disponível. Adicione peças estruturais primeiro.');
        console.log('❌ Dimensões inválidas:', {
          width: targetSpace.currentDimensions.width,
          height: targetSpace.currentDimensions.height,
          depth: targetSpace.currentDimensions.depth
        });
        setFeedbackMessage('❌ Espaço interno não disponível. Adicione peças estruturais primeiro.');
        setTimeout(() => setFeedbackMessage(null), 3000);
        return;
      }
    } else {
      targetSpace = mainSpace;
    }

    const pieceNames: Record<PieceType, string> = {
      [PieceType.LATERAL_LEFT]: 'Lateral Esquerda',
      [PieceType.LATERAL_RIGHT]: 'Lateral Direita',
      [PieceType.LATERAL_FRONT]: 'Lateral Frontal',
      [PieceType.LATERAL_BACK]: 'Lateral Traseira',
      [PieceType.BOTTOM]: 'Fundo',
      [PieceType.TOP]: 'Tampo',
      [PieceType.SHELF]: 'Prateleira',
      [PieceType.DIVIDER_VERTICAL]: 'Divisória Vertical',
    };

    const pieceColors: Record<PieceType, string> = {
      [PieceType.LATERAL_LEFT]: '#8b5cf6',
      [PieceType.LATERAL_RIGHT]: '#8b5cf6',
      [PieceType.LATERAL_FRONT]: '#f59e0b',
      [PieceType.LATERAL_BACK]: '#f59e0b',
      [PieceType.BOTTOM]: '#ef4444',
      [PieceType.TOP]: '#ef4444',
      [PieceType.SHELF]: '#10b981',
      [PieceType.DIVIDER_VERTICAL]: '#3b82f6',
    };

    const newPiece: FurniturePiece = {
      id: uuidv4(),
      type: pieceType,
      name: customName || pieceNames[pieceType],
      thickness: finalThickness,
      color: pieceColors[pieceType],
      dimensions: { width: 0, height: 0, depth: 0 }, // Será calculado pelo sistema
      position: { x: 0, y: 0, z: 0 }, // Será calculado pelo sistema
    };

    // MELHORIA 1: Atribuir parentSpaceId correto já na criação (simplificado para evitar loops)
    if (isInternalPiece || isStructuralPiece) {
      // Para peças internas e estruturais, usar o espaço alvo como parent
      newPiece.parentSpaceId = targetSpace.id;
    }

    console.log(`🔧 Adicionando peça: visual=${finalThickness}mm, corte=${finalCutThickness}mm no espaço:`, targetSpace.name);

    if (isInternalPiece) {
      // Para peças internas que dividem o espaço
      console.log('🔧 Iniciando divisão do espaço para peça interna:', {
        pieceType,
        targetSpaceName: targetSpace.name,
        targetSpaceDimensions: targetSpace.currentDimensions,
        pieceThickness: finalCutThickness,
        targetSpaceId: targetSpace.id,
        mainSpaceId: mainSpace.id,
        isMainSpace: targetSpace.id === mainSpace.id
      });
      
      console.log('🔧 Espaço alvo antes da divisão:', {
        id: targetSpace.id,
        name: targetSpace.name,
        dimensions: targetSpace.currentDimensions,
        isActive: targetSpace.isActive,
        piecesCount: targetSpace.pieces.length
      });
      
      const dividedSpaces = SpaceCuttingSystem.divideSpace(targetSpace, newPiece, finalCutThickness);
      
      console.log('📦 Espaços divididos criados:', {
        count: dividedSpaces.length,
        spaces: dividedSpaces.map(s => ({ name: s.name, dimensions: s.currentDimensions }))
      });
      
      if (dividedSpaces.length === 0) {
        console.warn('❌ Nenhum espaço dividido foi criado');
        setFeedbackMessage('❌ Erro ao criar espaços divididos');
        setTimeout(() => setFeedbackMessage(null), 3000);
        return;
      }
      
      // Calcular posição e dimensões da peça
      const piecePosition = SpaceCuttingSystem.calculatePiecePosition(targetSpace, newPiece);
      const pieceDimensions = SpaceCuttingSystem.calculatePieceDimensions(targetSpace, newPiece.type, finalThickness);
      
      const updatedPiece: FurniturePiece = {
        ...newPiece,
        position: piecePosition,
        dimensions: pieceDimensions,
      };

      // Atualizar espaços ativos (remover o dividido, adicionar os novos)
      let newActiveSpaces;
      if (targetSpace.id === mainSpace.id) {
        newActiveSpaces = [
          ...activeSpaces,
          ...dividedSpaces
        ];
      } else {
        // Atualizar a peça no subespaço correto
        setActiveSpaces(prevSpaces => prevSpaces.map(s =>
          s.id === targetSpace.id
            ? { ...s, pieces: [...s.pieces, updatedPiece] }
            : s
        ));
        // Substituir o subespaço dividido pelos novos subespaços
        newActiveSpaces = [
          ...activeSpaces.filter(s => s.id !== targetSpace.id),
          ...dividedSpaces
        ];
      }
      setActiveSpaces(newActiveSpaces);

      // Adicionar a peça ao espaço dividido (sempre ao mainSpace)
      setMainSpace(prev => ({
        ...prev,
        pieces: [...prev.pieces, updatedPiece],
        // Marcar o espaço principal como inativo quando dividido
        isActive: targetSpace.id === mainSpace.id ? false : prev.isActive,
      }));

      // Selecionar automaticamente o primeiro espaço dividido
      if (dividedSpaces.length > 0) {
        setSelectedSpaceId(dividedSpaces[0].id);
      }
    } else {
      // Para peças estruturais, verificar se podem ser inseridas primeiro
      const isLateralPiece = [PieceType.LATERAL_LEFT, PieceType.LATERAL_RIGHT].includes(pieceType);
      if (isLateralPiece) {
        // Usar o espaço alvo (pode ser interno ou principal)
        const canInsert = SpaceCuttingSystem.canInsertLateralPiece(targetSpace, pieceType, finalThickness);
        if (!canInsert) {
          console.warn('❌ Não há espaço suficiente para inserir lateral');
          setFeedbackMessage(`❌ Não há espaço suficiente para inserir ${newPiece.name}`);
          setTimeout(() => setFeedbackMessage(null), 3000);
          return;
        }
      }
      
      // Para peças estruturais, verificar colisões primeiro
      console.log('🔍 Verificando colisões para peça estrutural:', newPiece.name);
      
      // Calcular posição e dimensões da peça estrutural
      const piecePosition = SpaceCuttingSystem.calculatePiecePosition(targetSpace, newPiece);
      const pieceDimensions = SpaceCuttingSystem.calculatePieceDimensions(targetSpace, newPiece.type, finalThickness);
      
      // Validar se a peça cabe na chapa padrão (só para peças no espaço principal)
      if (targetSpace.id === mainSpace.id) {
        const sheetValidation = SpaceCuttingSystem.validatePieceSheet(newPiece.type, pieceDimensions);
        if (!sheetValidation.valido) {
          console.warn('❌ Peça não cabe na chapa padrão:', sheetValidation.erro);
          setFeedbackMessage(`❌ ${sheetValidation.erro}`);
          setTimeout(() => setFeedbackMessage(null), 4000);
          return;
        }
      }
      
      // Criar peça temporária com posição e dimensões para verificação de colisão
      const tempPiece: FurniturePiece = {
        ...newPiece,
        position: piecePosition,
        dimensions: pieceDimensions,
      };
      
      // Verificar se há colisão com peças existentes no espaço alvo
      const hasCollision = SpaceCuttingSystem.checkCollisionWithExistingPieces(tempPiece, targetSpace.pieces);
      
      console.log('🔍 Resultado da verificação de colisão:', {
        pieceType: newPiece.type,
        pieceName: newPiece.name,
        targetSpace: targetSpace.name,
        hasCollision,
        existingPiecesCount: targetSpace.pieces.length,
        tempPiecePosition: tempPiece.position,
        tempPieceDimensions: tempPiece.dimensions
      });
      
      if (hasCollision) {
        console.warn('⚠️ Colisão detectada - tentando ajustar espessura automaticamente');
        
        // Calcular a espessura máxima permitida para evitar colisões
        const maxAllowedThickness = SpaceCuttingSystem.calculateMaxAllowedThickness(targetSpace, newPiece);
        
        if (maxAllowedThickness >= 1) {
          console.log(`✂️ Reduzindo espessura de ${finalThickness}mm para ${maxAllowedThickness}mm`);
          
          // Criar peça com espessura ajustada
          const adjustedPiece: FurniturePiece = {
            ...newPiece,
            thickness: maxAllowedThickness,
          };
          
          // Recalcular posição e dimensões com nova espessura
          const adjustedPosition = SpaceCuttingSystem.calculatePiecePosition(targetSpace, adjustedPiece);
          const adjustedDimensions = SpaceCuttingSystem.calculatePieceDimensions(targetSpace, adjustedPiece.type, maxAllowedThickness);
          
          const finalAdjustedPiece: FurniturePiece = {
            ...adjustedPiece,
            position: adjustedPosition,
            dimensions: adjustedDimensions,
          };
          
          // Verificar se ainda há colisão após o ajuste
          const stillHasCollision = SpaceCuttingSystem.checkCollisionWithExistingPieces(finalAdjustedPiece, targetSpace.pieces);
          const isWithinBounds = SpaceCuttingSystem.isPieceWithinSpaceBounds(targetSpace, finalAdjustedPiece);
          
          if (!stillHasCollision && isWithinBounds) {
            console.log('✅ Espessura ajustada com sucesso, inserindo peça');
            const thicknessReduction = finalThickness - maxAllowedThickness;
            if (thicknessReduction > 0) {
              setFeedbackMessage(`✅ ${newPiece.name} inserida com espessura ajustada (${maxAllowedThickness}mm, -${thicknessReduction.toFixed(1)}mm)`);
            } else {
              setFeedbackMessage(`✅ ${newPiece.name} inserida sem ajustes necessários`);
            }
            setTimeout(() => setFeedbackMessage(null), 4000);
            
            // Aplicar corte com a peça ajustada
            if (targetSpace.id === mainSpace.id) {
              const updatedMainSpace = SpaceCuttingSystem.applyCutToSpace(mainSpace, finalAdjustedPiece, finalCutThickness);
              setMainSpace(updatedMainSpace);
            } else {
              // Aplicar corte ao espaço interno e atualizar suas dimensões
              console.log('🔧 Aplicando corte ao espaço interno:', {
                targetSpaceName: targetSpace.name,
                targetSpaceDimensions: targetSpace.currentDimensions,
                pieceType: finalAdjustedPiece.type,
                pieceThickness: finalCutThickness
              });
              
              const updatedTargetSpace = SpaceCuttingSystem.applyCutToSpace(targetSpace, finalAdjustedPiece, finalCutThickness);
              
              console.log('✅ Espaço interno atualizado:', {
                newDimensions: updatedTargetSpace.currentDimensions,
                newPosition: updatedTargetSpace.position
              });
              
              // Atualizar o espaço interno com as novas dimensões
              setActiveSpaces(prevSpaces => prevSpaces.map(s =>
                s.id === targetSpace.id
                  ? updatedTargetSpace
                  : s
              ));
              
              // Também adicionar ao mainSpace para renderização
              setMainSpace(prev => ({
                ...prev,
                pieces: [...prev.pieces, finalAdjustedPiece],
              }));
            }
            return;
          } else {
            console.error('❌ Mesmo com espessura ajustada, ainda há problemas');
          }
        }
        
        // Se chegou até aqui, tentar calcular posição livre de colisões (fallback)
        const collisionFreePosition = SpaceCuttingSystem.calculateCollisionFreePosition(targetSpace, newPiece);
        
        console.log('🎯 Posição ajustada calculada:', {
          original: piecePosition,
          adjusted: collisionFreePosition
        });
        
        // Verificar se a nova posição ainda está dentro dos limites do espaço
        const adjustedPiece: FurniturePiece = {
          ...newPiece,
          position: collisionFreePosition,
          dimensions: pieceDimensions,
        };
        
        // Verificar se a peça ajustada está dentro dos limites do espaço
        const isWithinBounds = SpaceCuttingSystem.isPieceWithinSpaceBounds(targetSpace, adjustedPiece);
        
        console.log('📏 Verificação de limites:', {
          pieceType: adjustedPiece.type,
          isWithinBounds,
          adjustedPosition: adjustedPiece.position,
          dimensions: adjustedPiece.dimensions,
          spaceOriginalDimensions: mainSpace.originalDimensions
        });
        
        // Verificar novamente se a posição ajustada resolve o problema
        const stillHasCollision = SpaceCuttingSystem.checkCollisionWithExistingPieces(adjustedPiece, targetSpace.pieces);
        
        console.log('🔄 Verificação final:', {
          stillHasCollision,
          isWithinBounds,
          canInsert: !stillHasCollision && isWithinBounds
        });
        
        if (stillHasCollision || !isWithinBounds) {
          console.error('❌ Não foi possível encontrar posição válida para a peça');
          setFeedbackMessage(`❌ Não é possível inserir ${newPiece.name} - espaço insuficiente`);
          // Limpar mensagem após 3 segundos
          setTimeout(() => setFeedbackMessage(null), 3000);
          return;
        } else {
          console.log('✅ Posição ajustada encontrada, inserindo peça na nova posição');
          setFeedbackMessage(`✅ ${newPiece.name} foi inserida em posição ajustada para evitar colisão`);
          setTimeout(() => setFeedbackMessage(null), 3000);
          // Aplicar corte com a peça ajustada
          if (targetSpace.id === mainSpace.id) {
            const updatedMainSpace = SpaceCuttingSystem.applyCutToSpace(mainSpace, adjustedPiece, finalCutThickness);
            setMainSpace(updatedMainSpace);
          } else {
            // Aplicar corte ao espaço interno e atualizar suas dimensões
            console.log('🔧 Aplicando corte ao espaço interno (fallback):', {
              targetSpaceName: targetSpace.name,
              targetSpaceDimensions: targetSpace.currentDimensions,
              pieceType: adjustedPiece.type,
              pieceThickness: finalCutThickness
            });
            
            const updatedTargetSpace = SpaceCuttingSystem.applyCutToSpace(targetSpace, adjustedPiece, finalCutThickness);
            
            console.log('✅ Espaço interno atualizado (fallback):', {
              newDimensions: updatedTargetSpace.currentDimensions,
              newPosition: updatedTargetSpace.position
            });
            
            // Atualizar o espaço interno com as novas dimensões
            setActiveSpaces(prevSpaces => prevSpaces.map(s =>
              s.id === targetSpace.id
                ? updatedTargetSpace
                : s
            ));
            
            // Também adicionar ao mainSpace para renderização
            setMainSpace(prev => ({
              ...prev,
              pieces: [...prev.pieces, adjustedPiece],
            }));
          }
        }
      } else {
        console.log('✅ Nenhuma colisão detectada, inserindo peça normalmente');
        // Sem colisão, aplicar corte normalmente
        if (targetSpace.id === mainSpace.id) {
          const updatedMainSpace = SpaceCuttingSystem.applyCutToSpace(mainSpace, newPiece, finalCutThickness);
          setMainSpace(updatedMainSpace);
        } else {
          // Aplicar corte ao espaço interno e atualizar suas dimensões
          console.log('🔧 Aplicando corte ao espaço interno (sem colisão):', {
            targetSpaceName: targetSpace.name,
            targetSpaceDimensions: targetSpace.currentDimensions,
            pieceType: newPiece.type,
            pieceThickness: finalCutThickness
          });
          
          const updatedTargetSpace = SpaceCuttingSystem.applyCutToSpace(targetSpace, newPiece, finalCutThickness);
          
          console.log('✅ Espaço interno atualizado (sem colisão):', {
            newDimensions: updatedTargetSpace.currentDimensions,
            newPosition: updatedTargetSpace.position
          });
          
          // Atualizar o espaço interno com as novas dimensões
          setActiveSpaces(prevSpaces => prevSpaces.map(s =>
            s.id === targetSpace.id
              ? updatedTargetSpace
              : s
          ));
          
          // Também adicionar ao mainSpace para renderização
          setMainSpace(prev => ({
            ...prev,
            pieces: [...prev.pieces, tempPiece],
          }));
        }
      }
    }
  }, [mainSpace, activeSpaces, defaultThickness, getSelectedSpace]);

  const removePiece = useCallback((pieceId: string) => {
    console.log('🗑️ Removendo peça:', pieceId);
    
    // Buscar a peça em todos os espaços disponíveis
    let pieceToRemove: FurniturePiece | undefined;
    let foundInSpace: 'main' | 'child' | null = null;
    
    // Primeiro, procurar no espaço principal
    pieceToRemove = mainSpace.pieces.find(p => p.id === pieceId);
    if (pieceToRemove) {
      foundInSpace = 'main';
      console.log('🔍 Peça encontrada no espaço principal');
    } else {
      // Se não encontrou no principal, procurar nos espaços filhos
      for (const childSpace of activeSpaces) {
        pieceToRemove = childSpace.pieces.find(p => p.id === pieceId);
        if (pieceToRemove) {
          foundInSpace = 'child';
          console.log('🔍 Peça encontrada no espaço filho:', childSpace.name);
          break;
        }
      }
    }
    
    if (!pieceToRemove) {
      console.warn('❌ Peça não encontrada para remoção:', pieceId);
      console.log('🔍 Debug - Espaços disponíveis:', {
        mainSpacePieces: mainSpace.pieces.map(p => ({ id: p.id, name: p.name, parentSpaceId: p.parentSpaceId })),
        activeSpaces: activeSpaces.map(s => ({
          id: s.id,
          name: s.name,
          pieces: s.pieces.map(p => ({ id: p.id, name: p.name, parentSpaceId: p.parentSpaceId }))
        }))
      });
      return;
    }
    console.log('[DEBUG] Fluxo de remoção:', { foundInSpace, pieceType: pieceToRemove.type });

    // Verificar se a peça está em um espaço filho
    const isInChildSpace = foundInSpace === 'child' || (pieceToRemove.parentSpaceId && pieceToRemove.parentSpaceId !== mainSpace.id);
    
    // NOVA LÓGICA PARA REMOÇÃO DE PEÇAS INTERNAS (prateleira/divisória)
    if (isInChildSpace && [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(pieceToRemove.type)) {
      // 1. Identificar o espaço pai correto
      const parentSpaceId = pieceToRemove.parentSpaceId;
      let parentSpace = parentSpaceId === mainSpace.id ? mainSpace : activeSpaces.find(s => s.id === parentSpaceId);
      if (!parentSpace) {
        parentSpace = mainSpace;
      }
      // 2. Coletar todas as peças restantes do espaço pai (exceto a removida)
      const structuralAndDividerPieces = (parentSpace.pieces || []).filter(p =>
        ([PieceType.LATERAL_LEFT, PieceType.LATERAL_RIGHT, PieceType.LATERAL_FRONT, PieceType.LATERAL_BACK, PieceType.BOTTOM, PieceType.TOP, PieceType.DIVIDER_VERTICAL].includes(p.type)) && p.id !== pieceId
      );
      const shelfPieces: FurniturePiece[] = [];
      // Coletar prateleiras dos subespaços filhos
      const childSpacesOfThisParent = activeSpaces.filter(s => s.parentSpaceId === parentSpace.id);
      childSpacesOfThisParent.forEach(space => {
        const internalShelves = space.pieces.filter(p => p.type === PieceType.SHELF && p.id !== pieceId);
        shelfPieces.push(...internalShelves);
      });
      // 3. Reconstruir o espaço pai do zero
      let reconstructedSpace: FurnitureSpace = {
        ...parentSpace,
        currentDimensions: parentSpace.originalDimensions,
        position: parentSpace.position,
        pieces: [],
        isActive: true,
        subSpaces: undefined,
      };
      // 4. Aplicar peças estruturais e divisórias do próprio espaço pai
      for (const piece of structuralAndDividerPieces) {
        const pieceThickness = piece.thickness || defaultThickness;
        if ([PieceType.LATERAL_LEFT, PieceType.LATERAL_RIGHT, PieceType.LATERAL_FRONT, PieceType.LATERAL_BACK, PieceType.BOTTOM, PieceType.TOP].includes(piece.type)) {
          reconstructedSpace = SpaceCuttingSystem.applyCutToSpace(reconstructedSpace, piece, pieceThickness);
        } else if (piece.type === PieceType.DIVIDER_VERTICAL) {
          const dividedSpaces = SpaceCuttingSystem.divideSpace(reconstructedSpace, piece, pieceThickness);
          if (dividedSpaces.length > 0) {
            reconstructedSpace = {
              ...reconstructedSpace,
              subSpaces: dividedSpaces,
              isActive: false,
            };
          }
        }
      }
      // 5. Aplicar prateleiras dos subespaços
      for (const piece of shelfPieces) {
        const pieceThickness = piece.thickness || defaultThickness;
        const dividedSpaces = SpaceCuttingSystem.divideSpace(reconstructedSpace, piece, pieceThickness);
        if (dividedSpaces.length > 0) {
          if (reconstructedSpace.subSpaces && reconstructedSpace.subSpaces.length > 0) {
            const newSubSpaces: FurnitureSpace[] = [];
            for (const subSpace of reconstructedSpace.subSpaces) {
              const subDividedSpaces = SpaceCuttingSystem.divideSpace(subSpace, piece, pieceThickness);
              if (subDividedSpaces.length > 0) {
                newSubSpaces.push(...subDividedSpaces);
              } else {
                newSubSpaces.push(subSpace);
              }
            }
            reconstructedSpace = {
              ...reconstructedSpace,
              subSpaces: newSubSpaces,
              isActive: false,
            };
          } else {
            reconstructedSpace = {
              ...reconstructedSpace,
              subSpaces: dividedSpaces,
              isActive: false,
            };
          }
        }
      }
      // 6. Remover recursivamente todos os subespaços criados pela peça removida
      function collectDescendantSpacesByPieceId(spaces: FurnitureSpace[], pieceId: string): string[] {
        const directChildren = spaces.filter((s: FurnitureSpace) => s.createdByPieceId === pieceId);
        let allIds: string[] = directChildren.map((s: FurnitureSpace) => s.id);
        for (const child of directChildren) {
          allIds = allIds.concat(collectDescendantSpacesByPieceId(spaces, child.id));
        }
        return allIds;
      }
      console.log('[DEBUG] Antes da filtragem, activeSpaces:', activeSpaces.map(s => ({id: s.id, name: s.name, createdByPieceId: s.createdByPieceId, parentSpaceId: s.parentSpaceId})));
      setActiveSpaces(prevSpaces => {
        const idsToRemove = collectDescendantSpacesByPieceId(prevSpaces, pieceId);
        console.log('[DEBUG] idsToRemove (createdByPieceId):', idsToRemove);
        const filteredSpaces = prevSpaces.filter(s => !idsToRemove.includes(s.id) && s.createdByPieceId !== pieceId && s.parentSpaceId !== pieceId);
        console.log('[DEBUG] Depois da filtragem, activeSpaces:', filteredSpaces.map(s => ({id: s.id, name: s.name, createdByPieceId: s.createdByPieceId, parentSpaceId: s.parentSpaceId})));
        const newSubSpaces = reconstructedSpace.subSpaces || [];
        const updatedNewSpaces = newSubSpaces.map(space => ({
          ...space,
          isActive: true,
          parentSpaceId: parentSpace.id
        }));
        // Remover duplicados por id
        const allSpaces = [...filteredSpaces, ...updatedNewSpaces];
        const uniqueSpaces = allSpaces.filter((space, index, self) => self.findIndex(s => s.id === space.id) === index);
        return uniqueSpaces;
      });
      // 7. Atualizar o próprio espaço pai
      if (parentSpace.id === mainSpace.id) {
        setMainSpace(reconstructedSpace);
      } else {
        setActiveSpaces(prevSpaces => prevSpaces.map(space => space.id === parentSpace.id ? reconstructedSpace : space));
      }
      // 8. Ajustar seleção se necessário
      if (selectedSpaceId && childSpacesOfThisParent.some(s => s.id === selectedSpaceId)) {
        const newSubSpaces = reconstructedSpace.subSpaces || [];
        if (newSubSpaces.length > 0) {
          setSelectedSpaceId(newSubSpaces[0].id);
        } else {
          setSelectedSpaceId(parentSpace.id);
        }
      }
      // 9. Remover do mainSpace para renderização
      setMainSpace(prev => ({
        ...prev,
        pieces: prev.pieces.filter(p => p.id !== pieceId)
      }));
      return;
    }

    if (isInChildSpace) {
      console.log('🔧 Removendo peça de espaço filho');
      
      // Encontrar o espaço filho que contém a peça
      let childSpace: FurnitureSpace | undefined;
      
      if (foundInSpace === 'child') {
        // Se já sabemos onde está, usar essa informação
        childSpace = activeSpaces.find(space => 
          space.pieces.some(p => p.id === pieceId)
        );
      } else {
        // Procurar pelo parentSpaceId
        childSpace = activeSpaces.find(space => space.id === pieceToRemove.parentSpaceId);
      }
      
      if (!childSpace) {
        console.warn('❌ Espaço filho não encontrado para peça:', pieceId);
        console.log('🔍 Debug - Tentando encontrar espaço filho:', {
          pieceParentSpaceId: pieceToRemove.parentSpaceId,
          availableChildSpaces: activeSpaces.map(s => ({ id: s.id, name: s.name })),
          pieceFoundIn: foundInSpace
        });
        
        // Fallback: tentar remover do mainSpace mesmo que seja de espaço filho
        console.log('🔄 Fallback: removendo do espaço principal');
        setMainSpace(prev => ({
          ...prev,
          pieces: prev.pieces.filter(p => p.id !== pieceId)
        }));
        return;
      }
      
      console.log('🔍 Espaço filho encontrado:', {
        id: childSpace.id,
        name: childSpace.name,
        currentDimensions: childSpace.currentDimensions,
        piecesCount: childSpace.pieces.length
      });
      
      // Verificar se é uma peça estrutural que reduziu o espaço
      const isStructuralPiece = [
        PieceType.LATERAL_LEFT,
        PieceType.LATERAL_RIGHT,
        PieceType.LATERAL_FRONT,
        PieceType.LATERAL_BACK,
        PieceType.BOTTOM,
        PieceType.TOP
      ].includes(pieceToRemove.type);
      
      if (isStructuralPiece) {
        console.log('🔧 Removendo peça estrutural de espaço filho - recuperando dimensões');
        
        // Calcular as dimensões que devem ser recuperadas
        const pieceThickness = pieceToRemove.thickness || defaultThickness;
        let recoveredDimensions = { ...childSpace.currentDimensions };
        let recoveredPosition = { ...childSpace.position };
        
        // Reverter o corte baseado no tipo de peça
        switch (pieceToRemove.type) {
          case PieceType.LATERAL_LEFT:
            recoveredDimensions.width += pieceThickness;
            // Ajustar posição se necessário (mover para a esquerda)
            recoveredPosition.x -= pieceThickness / 2;
            break;
          case PieceType.LATERAL_RIGHT:
            recoveredDimensions.width += pieceThickness;
            // Ajustar posição se necessário (mover para a direita)
            recoveredPosition.x += pieceThickness / 2;
            break;
          case PieceType.LATERAL_FRONT:
            recoveredDimensions.depth += pieceThickness;
            // Ajustar posição se necessário (mover para frente)
            recoveredPosition.z += pieceThickness / 2;
            break;
          case PieceType.LATERAL_BACK:
            recoveredDimensions.depth += pieceThickness;
            // Ajustar posição se necessário (mover para trás)
            recoveredPosition.z -= pieceThickness / 2;
            break;
          case PieceType.BOTTOM:
            recoveredDimensions.height += pieceThickness;
            // Ajustar posição se necessário (mover para baixo)
            recoveredPosition.y -= pieceThickness / 2;
            break;
          case PieceType.TOP:
            recoveredDimensions.height += pieceThickness;
            // Ajustar posição se necessário (mover para cima)
            recoveredPosition.y += pieceThickness / 2;
            break;
        }
        
        console.log('📏 Dimensões recuperadas:', {
          original: childSpace.currentDimensions,
          recovered: recoveredDimensions,
          originalPosition: childSpace.position,
          recoveredPosition: recoveredPosition,
          pieceType: pieceToRemove.type,
          pieceThickness
        });
        
        // Validar se as dimensões recuperadas são válidas
        const isValidRecovery = recoveredDimensions.width > 0 && 
                               recoveredDimensions.height > 0 && 
                               recoveredDimensions.depth > 0;
        
        if (!isValidRecovery) {
          console.warn('❌ Dimensões recuperadas inválidas:', recoveredDimensions);
          // Usar dimensões mínimas seguras
          recoveredDimensions = {
            width: Math.max(50, recoveredDimensions.width),
            height: Math.max(50, recoveredDimensions.height),
            depth: Math.max(50, recoveredDimensions.depth)
          };
          console.log('🔧 Usando dimensões mínimas seguras:', recoveredDimensions);
        }
        
        // Atualizar o espaço filho com as dimensões recuperadas
        setActiveSpaces(prevSpaces => prevSpaces.map(space => {
          if (space.id === childSpace!.id) {
            console.log('✅ Recuperando dimensões do espaço filho:', space.name);
            return {
              ...space,
              currentDimensions: recoveredDimensions,
              position: recoveredPosition,
              pieces: space.pieces.filter(p => p.id !== pieceId)
            };
          }
          return space;
        }));
      } else {
        console.log('🔧 Removendo peça não-estrutural de espaço filho');
        
        // Verificar se é uma peça divisora que criou espaços filhos
        const isDividerPiece = [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(pieceToRemove.type);
        
        if (isDividerPiece) {
          // Nova lógica: reconstruir o espaço pai do zero, reaplicando todas as peças restantes
          const parentSpaceId = childSpace.parentSpaceId;
          if (!parentSpaceId) {
            console.warn('❌ Espaço pai não encontrado para reconstrução');
            return;
          }
          // Buscar o espaço pai original
          const parentSpace = parentSpaceId === mainSpace.id ? mainSpace : activeSpaces.find(s => s.id === parentSpaceId);
          if (!parentSpace) {
            console.warn('❌ Espaço pai não encontrado para reconstrução');
            return;
          }
          // Função recursiva para coletar todas as peças internas (prateleiras/divisórias) de um espaço e seus filhos, exceto a removida
          function collectAllInternalPiecesRecursive(space: FurnitureSpace, pieceIdToRemove: string): FurniturePiece[] {
            let pieces: FurniturePiece[] = [];
            if (space.pieces && space.pieces.length > 0) {
              pieces = pieces.concat(space.pieces.filter(p => [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(p.type) && p.id !== pieceIdToRemove));
            }
            if (space.subSpaces && space.subSpaces.length > 0) {
              for (const sub of space.subSpaces) {
                pieces = pieces.concat(collectAllInternalPiecesRecursive(sub, pieceIdToRemove));
              }
            }
            return pieces;
          }
          // 2. Coletar todas as peças internas daquele ramo (inclusive aninhadas), exceto a removida
          const allInternalPieces = collectAllInternalPiecesRecursive(parentSpace, pieceId);
          // Criar espaço base limpo
          let reconstructedSpace: FurnitureSpace = {
            ...parentSpace,
            currentDimensions: parentSpace.originalDimensions,
            position: parentSpace.position,
            pieces: [],
            isActive: true,
            subSpaces: undefined, // Garante que não há subespaços herdados
          };
          // Reaplicar todas as peças restantes
          for (const piece of allInternalPieces) {
            const pieceThickness = piece.thickness || defaultThickness;
            if ([PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(piece.type)) {
              // Dividir espaço - aplicar sequencialmente
              const dividedSpaces = SpaceCuttingSystem.divideSpace(reconstructedSpace, piece, pieceThickness);
              if (dividedSpaces.length > 0) {
                // Se já há subespaços, aplicar a divisão a cada um deles
                if (reconstructedSpace.subSpaces && reconstructedSpace.subSpaces.length > 0) {
                  const newSubSpaces: FurnitureSpace[] = [];
                  for (const subSpace of reconstructedSpace.subSpaces) {
                    const subDividedSpaces = SpaceCuttingSystem.divideSpace(subSpace, piece, pieceThickness);
                    if (subDividedSpaces.length > 0) {
                      newSubSpaces.push(...subDividedSpaces);
                    } else {
                      newSubSpaces.push(subSpace);
                    }
                  }
                  reconstructedSpace = {
                    ...reconstructedSpace,
                    subSpaces: newSubSpaces,
                    isActive: false,
                  };
                } else {
                  // Primeira divisão
                  reconstructedSpace = {
                    ...reconstructedSpace,
                    subSpaces: dividedSpaces,
                    isActive: false,
                  };
                }
              }
            }
          }
          // Atualizar activeSpaces para conter apenas os novos subespaços desse pai e manter os outros
          // Remover recursivamente todos os subespaços descendentes do espaço pai
          function collectDescendantSpacesByPieceId(spaces: FurnitureSpace[], pieceId: string): string[] {
            const directChildren = spaces.filter((s: FurnitureSpace) => s.parentSpaceId === pieceId);
            let allIds: string[] = directChildren.map((s: FurnitureSpace) => s.id);
            for (const child of directChildren) {
              allIds = allIds.concat(collectDescendantSpacesByPieceId(spaces, child.id));
            }
            return allIds;
          }
          // LOG antes da filtragem
          console.log('[DEBUG] Antes da filtragem, activeSpaces:', activeSpaces.map(s => ({id: s.id, name: s.name, createdByPieceId: s.createdByPieceId, parentSpaceId: s.parentSpaceId})));
          setActiveSpaces(prevSpaces => {
            const idsToRemove = collectDescendantSpacesByPieceId(prevSpaces, pieceId);
            console.log('[DEBUG] idsToRemove (createdByPieceId):', idsToRemove);
            const filteredSpaces = prevSpaces.filter(s => !idsToRemove.includes(s.id) && s.createdByPieceId !== pieceId);
            console.log('[DEBUG] Depois da filtragem, activeSpaces:', filteredSpaces.map(s => ({id: s.id, name: s.name, createdByPieceId: s.createdByPieceId, parentSpaceId: s.parentSpaceId})));
            const newSubSpaces = reconstructedSpace.subSpaces || [];
            const updatedNewSpaces = newSubSpaces.map(space => ({
              ...space,
              isActive: true,
              parentSpaceId: parentSpaceId
            }));
            return [...filteredSpaces, ...updatedNewSpaces];
          });
          // Atualizar o próprio espaço pai
          if (parentSpaceId === mainSpace.id) {
            setMainSpace(reconstructedSpace);
          } else {
            setActiveSpaces(prevSpaces => prevSpaces.map(space =>
              space.id === parentSpaceId ? reconstructedSpace : space
            ));
          }
          // Ajustar seleção se necessário
          if (selectedSpaceId && activeSpaces.some(s => s.id === selectedSpaceId)) {
            const newSubSpaces = reconstructedSpace.subSpaces || [];
            if (newSubSpaces.length > 0) {
              setSelectedSpaceId(newSubSpaces[0].id);
            } else {
              setSelectedSpaceId(parentSpaceId);
            }
          }
        } else {
          // Para peças não-divisoras, apenas remover a peça
          setActiveSpaces(prevSpaces => prevSpaces.map(space => {
            if (space.id === childSpace!.id) {
              console.log('✅ Removendo peça do espaço filho:', space.name);
              return {
                ...space,
                pieces: space.pieces.filter(p => p.id !== pieceId)
              };
            }
            return space;
          }));
        }
      }
      
      // Também remover do mainSpace para renderização
      setMainSpace(prev => ({
        ...prev,
        pieces: prev.pieces.filter(p => p.id !== pieceId)
      }));
      
    } else {
      console.log('🔧 Removendo peça do espaço principal');
      
      // Para peças do espaço principal, verificar se são peças que criaram espaços filhos
      const isDividerPiece = [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(pieceToRemove.type);
      
      if (isDividerPiece) {
        console.log('⚠️ Removendo peça divisora - isso pode afetar espaços filhos');
        
        // Remover a peça do espaço principal
        setMainSpace(prev => ({
          ...prev,
          pieces: prev.pieces.filter(p => p.id !== pieceId)
        }));
        
        // Reconstruir espaços filhos sem a peça removida
        const remainingPieces = mainSpace.pieces.filter(p => p.id !== pieceId);
        const dividerPieces = remainingPieces.filter(p => 
          [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(p.type)
        );
        
        if (dividerPieces.length === 0) {
          // Se não há mais peças divisoras, limpar espaços filhos e restaurar espaço principal
          console.log('🧹 Não há mais peças divisoras, limpando espaços filhos e restaurando espaço principal');
          setActiveSpaces([]);
          setSelectedSpaceId(null);
          // Restaurar o espaço principal como ativo
          setMainSpace(prev => ({
            ...prev,
            isActive: true,
            pieces: remainingPieces // Manter as peças estruturais restantes
          }));
        } else {
          // Reconstruir espaços filhos com as peças restantes
          console.log('🔄 Reconstruindo espaços filhos com peças restantes');
          
          // Começar com o espaço principal limpo
          let reconstructedSpace: FurnitureSpace = {
            ...mainSpace,
            currentDimensions: mainSpace.originalDimensions,
            position: { x: 0, y: 0, z: 0 },
            pieces: [],
            isActive: true,
          };
          
          // Reaplicar peças estruturais primeiro
          const structuralPieces = remainingPieces.filter(p => 
            [PieceType.LATERAL_LEFT, PieceType.LATERAL_RIGHT, PieceType.LATERAL_FRONT, 
             PieceType.LATERAL_BACK, PieceType.BOTTOM, PieceType.TOP].includes(p.type)
          );
          
          for (const piece of structuralPieces) {
            const pieceThickness = piece.thickness || defaultThickness;
            reconstructedSpace = SpaceCuttingSystem.applyCutToSpace(reconstructedSpace, piece, pieceThickness);
          }
          
          // Aplicar peças divisoras para recriar espaços filhos
          const newActiveSpaces: FurnitureSpace[] = [];
          
          for (const piece of dividerPieces) {
            const pieceThickness = piece.thickness || defaultThickness;
            
            // Dividir o espaço com a peça
            const dividedSpaces = SpaceCuttingSystem.divideSpace(reconstructedSpace, piece, pieceThickness);
            
            if (dividedSpaces.length > 0) {
              // Calcular posição e dimensões da peça
              const piecePosition = SpaceCuttingSystem.calculatePiecePosition(reconstructedSpace, piece);
              const pieceDimensions = SpaceCuttingSystem.calculatePieceDimensions(reconstructedSpace, piece.type, pieceThickness);
              
              const updatedPiece: FurniturePiece = {
                ...piece,
                position: piecePosition,
                dimensions: pieceDimensions,
              };
              
              // Adicionar a peça ao espaço principal
              reconstructedSpace = {
                ...reconstructedSpace,
                pieces: [...reconstructedSpace.pieces, updatedPiece],
                isActive: false,
              };
              
              // Adicionar espaços divididos - GARANTIR QUE SEJAM ATIVOS
              const activeDividedSpaces = dividedSpaces.map(space => ({
                ...space,
                isActive: true, // IMPORTANTE: marcar como ativo
                parentSpaceId: mainSpace.id
              }));
              
              console.log('✅ Espaços filhos recriados do principal (ativos):', activeDividedSpaces.map(s => ({
                id: s.id,
                name: s.name,
                isActive: s.isActive,
                dimensions: s.currentDimensions,
                parentSpaceId: s.parentSpaceId
              })));
              
              newActiveSpaces.push(...activeDividedSpaces);
            }
          }
          
          // Atualizar estados
          setMainSpace(reconstructedSpace);
          setActiveSpaces(newActiveSpaces);
          
          // Ajustar seleção se necessário
          if (selectedSpaceId && !newActiveSpaces.find(s => s.id === selectedSpaceId) && selectedSpaceId !== reconstructedSpace.id) {
            setSelectedSpaceId(null);
          }
        }
      } else {
        // Para peças estruturais do espaço principal, reconstruir normalmente
        console.log('🔧 Reconstruindo espaço principal após remoção de peça estrutural');
        
        const remainingPieces = mainSpace.pieces.filter(p => p.id !== pieceId);
        
        // Começar com um espaço limpo
        let reconstructedSpace: FurnitureSpace = {
          ...mainSpace,
          currentDimensions: mainSpace.originalDimensions,
          position: { x: 0, y: 0, z: 0 },
          pieces: [],
          isActive: true,
        };
        
        // Reaplicar cada peça restante na ordem original
        for (const piece of remainingPieces) {
          const pieceThickness = piece.thickness || defaultThickness;
          reconstructedSpace = SpaceCuttingSystem.applyCutToSpace(reconstructedSpace, piece, pieceThickness);
        }
        
        // Atualizar espaços ativos (subSpaces) se existirem
        let newActiveSpaces: FurnitureSpace[] = [];
        if (reconstructedSpace.subSpaces && reconstructedSpace.subSpaces.length > 0) {
          newActiveSpaces = reconstructedSpace.subSpaces;
        }
        
        // Aplicar estado reconstruído
        setMainSpace(reconstructedSpace);
        setActiveSpaces(newActiveSpaces);
        
        // Ajustar seleção se necessário
        if (selectedSpaceId && !newActiveSpaces.find(s => s.id === selectedSpaceId) && selectedSpaceId !== reconstructedSpace.id) {
          setSelectedSpaceId(null);
        }
      }
    }
    
    setFeedbackMessage('✅ Peça removida com sucesso');
    setTimeout(() => setFeedbackMessage(null), 2000);
  }, [mainSpace, activeSpaces, defaultThickness, selectedSpaceId]);

  const updateDimensions = useCallback((newDimensions: Dimensions) => {
    console.log('📐 Atualizando dimensões:', newDimensions);
    
    const newSpace: FurnitureSpace = {
      ...mainSpace,
      originalDimensions: newDimensions,
      currentDimensions: newDimensions,
      position: { x: 0, y: 0, z: 0 },
      pieces: [], // Por enquanto limpa as peças
      isActive: true,
    };

    setActiveSpaces([]);
    setMainSpace(newSpace);

    console.log('📐 Dimensões atualizadas, sistema de reconstrução precisa ser implementado');
  }, [mainSpace]);

  const clearAllPieces = useCallback(() => {
    setActiveSpaces([]);
    setSelectedSpaceId(null);
    setFeedbackMessage(null); // Limpar mensagens ao resetar
    setMainSpace(currentSpace => ({
      ...currentSpace,
      originalDimensions: currentSpace.originalDimensions,
      currentDimensions: currentSpace.originalDimensions,
      position: { x: 0, y: 0, z: 0 }, // Resetar posição para centro
      pieces: [],
      isActive: true,
    }));
  }, []);

  const setInsertionMode = useCallback((mode: InsertionMode) => {
    setInsertionContext({ mode });
  }, []);

  // Função utilitária para coletar todas as peças do móvel, inclusive de subSpaces
  function collectAllPieces(space: FurnitureSpace): FurniturePiece[] {
    let pieces = [...(space.pieces || [])];
    if (space.subSpaces && space.subSpaces.length > 0) {
      for (const sub of space.subSpaces) {
        pieces = pieces.concat(collectAllPieces(sub));
      }
    }
    return pieces;
  }



  // MELHORIA 2: Após qualquer alteração estrutural, reatribuir parentSpaceId de todas as peças internas
  function reassignParentSpaceIds(pieces: FurniturePiece[], rootSpace: FurnitureSpace): FurniturePiece[] {
    return pieces.map(piece => {
      if ([PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(piece.type)) {
        const subSpace = SpaceCuttingSystem.findSubSpaceByPosition(rootSpace, piece);
        return { ...piece, parentSpaceId: subSpace.id };
      }
      return piece;
    });
  }

  // Exemplo de uso após reconstrução:
  // const reassignedPieces = reassignParentSpaceIds(mainSpace.pieces, mainSpace);
  // ... use reassignedPieces na próxima reconstrução ...

  return {
    space,
    insertionContext,
    addPiece,
    removePiece,
    clearAllPieces,
    createNewSpace,
    updateDimensions,
    setInsertionMode,
    defaultThickness,
    setDefaultThickness,
    // Funções de seleção de espaços
    activeSpaces,
    selectedSpaceId,
    selectSpace,
    getSelectedSpace,
    // Feedback para o usuário
    feedbackMessage,
    clearFeedback: () => setFeedbackMessage(null),
  };
};


