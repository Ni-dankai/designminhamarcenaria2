import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FurnitureSpace, Dimensions, PieceType, FurniturePiece } from '../types/furniture';
import { InsertionMode, InsertionContext } from '../types/insertion';
import { SpaceCuttingSystem } from '../utils/spaceCutting';

const PIECE_CONFIG: Record<string, { name: string; color: string }> = {
    [PieceType.LATERAL_LEFT]: { name: 'Lateral Esquerda', color: '#8b5cf6' },
    [PieceType.LATERAL_RIGHT]: { name: 'Lateral Direita', color: '#8b5cf6' },
    [PieceType.LATERAL_FRONT]: { name: 'Lateral Frontal', color: '#f59e0b' },
    [PieceType.LATERAL_BACK]: { name: 'Lateral Traseira', color: '#f59e0b' },
    [PieceType.BOTTOM]: { name: 'Fundo', color: '#ef4444' },
    [PieceType.TOP]: { name: 'Tampo', color: '#ef4444' },
    [PieceType.SHELF]: { name: 'Prateleira', color: '#10b981' },
    [PieceType.DIVIDER_VERTICAL]: { name: 'Divisória Vertical', color: '#3b82f6' },
};

export const useSimplifiedFurnitureDesign = () => {
    const [defaultThickness, setDefaultThickness] = useState(18);
    const [allPieces, setAllPieces] = useState<FurniturePiece[]>([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>('main');
    const [mainSpaceInfo, setMainSpaceInfo] = useState({
        id: 'main',
        name: 'Móvel Principal',
        originalDimensions: { width: 800, height: 2100, depth: 600 },
    });
    const [insertionContext, setInsertionContext] = useState<InsertionContext>({ mode: InsertionMode.STRUCTURAL });

    const memoizedState = useMemo(() => {
        const positionedPieces: FurniturePiece[] = [];
        let activeSpaces: FurnitureSpace[] = [];

        // 1. Processa peças estruturais, que definem o vão principal
        let currentVoid: FurnitureSpace = {
            ...mainSpaceInfo,
            currentDimensions: mainSpaceInfo.originalDimensions,
            position: { x: 0, y: 0, z: 0 },
            pieces: [], isActive: true,
        };
        const structuralPieces = allPieces.filter(p => ![PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(p.type));
        
        structuralPieces.forEach(piece => {
            // A cada peça, calcula a posição e dimensão com base no espaço ATUALMENTE disponível
            const positioned = { ...piece,
                position: SpaceCuttingSystem.calculatePiecePosition(currentVoid, piece),
                dimensions: SpaceCuttingSystem.calculatePieceDimensions(currentVoid, piece.type, piece.thickness),
            };
            positionedPieces.push(positioned);
            // Atualiza o vão para a próxima peça
            currentVoid = SpaceCuttingSystem.applyCutToSpace(currentVoid, piece);
        });
        
        // O resultado do processo estrutural é o primeiro espaço ativo
        activeSpaces.push(currentVoid);
        
        // 2. Processa peças internas, que dividem os espaços ativos
        const internalPieces = allPieces.filter(p => [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(p.type));
        internalPieces.forEach(piece => {
            const parentSpaceIndex = activeSpaces.findIndex(s => s.id === piece.parentSpaceId);
            if (parentSpaceIndex > -1) {
                const parentSpace = activeSpaces[parentSpaceIndex];
                
                const positioned = { ...piece,
                    position: SpaceCuttingSystem.calculatePiecePosition(parentSpace, piece),
                    dimensions: SpaceCuttingSystem.calculatePieceDimensions(parentSpace, piece.type, piece.thickness)
                };
                positionedPieces.push(positioned);
                
                const newSubSpaces = SpaceCuttingSystem.divideSpace(parentSpace, positioned);
                activeSpaces.splice(parentSpaceIndex, 1, ...newSubSpaces);
            }
        });

        // 3. Monta o objeto final para o renderer
        const finalSpace = { ...mainSpaceInfo,
            currentDimensions: mainSpaceInfo.originalDimensions,
            position: {x:0, y:0, z:0},
            pieces: positionedPieces, // Renderiza a lista completa e posicionada
            subSpaces: activeSpaces, // Passa os espaços ativos finais
        };
        
        return { space: finalSpace, activeSpaces, positionedPieces };
    }, [allPieces, mainSpaceInfo]);

    const getSelectedSpace = useCallback((): FurnitureSpace | null => {
        return memoizedState.activeSpaces.find(s => s.id === selectedSpaceId) || memoizedState.space;
    }, [selectedSpaceId, memoizedState.activeSpaces, memoizedState.space]);

    const addPiece = useCallback((pieceType: PieceType) => {
        const targetSpace = getSelectedSpace();
        if (!targetSpace) return;
        
        const config = PIECE_CONFIG[pieceType];
        const newPiece: FurniturePiece = {
            id: uuidv4(), type: pieceType, name: config.name,
            thickness: defaultThickness, color: config.color,
            position: targetSpace.position,
            dimensions: { width: 0, height: 0, depth: 0 },
            parentSpaceId: targetSpace.id,
        };
        setAllPieces(prev => [...prev, newPiece]);
    }, [getSelectedSpace, defaultThickness]);

    const removePiece = useCallback((pieceId: string) => {
        setAllPieces(prev => {
            const pieceToRemove = prev.find(p => p.id === pieceId);
            if (!pieceToRemove) return prev;
            // Remove a peça e todas as peças que dependem dela (foram adicionadas em seus subespaços)
            const idsToRemove = new Set([pieceId]);
            const findChildren = (parentId: string) => {
                prev.forEach(p => {
                    if (p.parentSpaceId?.includes(parentId)) {
                        idsToRemove.add(p.id);
                        findChildren(p.id);
                    }
                });
            };
            findChildren(pieceId);
            return prev.filter(p => !idsToRemove.has(p.id));
        });

        if (selectedSpaceId?.includes(pieceId)) {
            setSelectedSpaceId('main');
        }
    }, [selectedSpaceId]);

    const updateDimensions = useCallback((newDimensions: Dimensions) => {
        setAllPieces([]);
        setMainSpaceInfo(prev => ({ ...prev, originalDimensions: newDimensions }));
        setSelectedSpaceId('main');
    }, []);

    const clearAllPieces = useCallback(() => {
        setAllPieces([]);
        setSelectedSpaceId('main');
    }, []);

    const setInsertionMode = useCallback((mode: InsertionMode) => {
        setInsertionContext({ mode });
    }, []);

    return {
        space: memoizedState.space,
        activeSpaces: memoizedState.activeSpaces,
        allPieces: memoizedState.positionedPieces,
        addPiece, removePiece, updateDimensions, clearAllPieces,
        selectedSpaceId, selectSpace: setSelectedSpaceId,
        insertionContext, setInsertionMode,
        defaultThickness, setDefaultThickness,
    };
};


