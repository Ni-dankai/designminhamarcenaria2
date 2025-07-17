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

        // 1. Calcula o vão interno principal com base nas peças estruturais
        let structuralSpace: FurnitureSpace = {
            ...mainSpaceInfo,
            currentDimensions: mainSpaceInfo.originalDimensions,
            position: { x: 0, y: 0, z: 0 },
            pieces: [], isActive: true,
        };
        const structuralPieces = allPieces.filter(p => ![PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(p.type));
        structuralPieces.forEach(p => {
            const positioned = { ...p,
                position: SpaceCuttingSystem.calculatePiecePosition(structuralSpace, p),
                dimensions: SpaceCuttingSystem.calculatePieceDimensions(structuralSpace, p.type, p.thickness),
            };
            positionedPieces.push(positioned);
            structuralSpace = SpaceCuttingSystem.applyCutToSpace(structuralSpace, p);
        });

        const internalPieces = allPieces.filter(p => [PieceType.SHELF, PieceType.DIVIDER_VERTICAL].includes(p.type));

        // 2. Lógica de construção da árvore em 2 fases
        const buildTree = (parentSpace: FurnitureSpace, availablePieces: FurniturePiece[]): FurnitureSpace => {
            // FASE 1: DIVISÕES HORIZONTAIS (PRATELEIRAS)
            const shelves = availablePieces.filter(p => p.type === PieceType.SHELF).sort((a,b) => b.position.y - a.position.y);
            let horizontalSlices = [parentSpace];

            shelves.forEach(shelf => {
                const sliceIndex = horizontalSlices.findIndex(s => SpaceCuttingSystem.isPieceWithinSpaceBounds(s, shelf));
                if(sliceIndex > -1) {
                    const sliceToDivide = horizontalSlices[sliceIndex];
                    const positionedShelf = {...shelf, position: SpaceCuttingSystem.calculatePiecePosition(sliceToDivide, shelf), dimensions: SpaceCuttingSystem.calculatePieceDimensions(sliceToDivide, shelf.type, shelf.thickness)};
                    positionedPieces.push(positionedShelf);
                    const newSlices = SpaceCuttingSystem.divideSpace(sliceToDivide, positionedShelf);
                    horizontalSlices.splice(sliceIndex, 1, ...newSlices);
                }
            });

            // FASE 2: DIVISÕES VERTICAIS (PARA CADA FATIA HORIZONTAL)
            const verticalDividers = availablePieces.filter(p => p.type === PieceType.DIVIDER_VERTICAL);
            const finalSubSpaces = horizontalSlices.map(hSlice => {
                const dividersForSlice = verticalDividers.filter(d => SpaceCuttingSystem.isPieceWithinSpaceBounds(hSlice, d));
                return buildVerticalTree(hSlice, dividersForSlice);
            });
            
            parentSpace.subSpaces = finalSubSpaces;
            if (internalPieces.length > 0) parentSpace.isActive = false;
            return parentSpace;
        };
        
        const buildVerticalTree = (parentSpace: FurnitureSpace, availableDividers: FurniturePiece[]): FurnitureSpace => {
             availableDividers.sort((a, b) => a.position.x - b.position.x);
             const divider = availableDividers[0];
             if(!divider) return parentSpace;

             const positionedDivider = {...divider, position: SpaceCuttingSystem.calculatePiecePosition(parentSpace, divider), dimensions: SpaceCuttingSystem.calculatePieceDimensions(parentSpace, divider.type, divider.thickness)};
             positionedPieces.push(positionedDivider);
             
             const subSpaces = SpaceCuttingSystem.divideSpace(parentSpace, positionedDivider);
             const remainingDividers = availableDividers.slice(1);
             
             parentSpace.isActive = false;
             parentSpace.subSpaces = subSpaces.map(sub => {
                 const dividersForSub = remainingDividers.filter(d => SpaceCuttingSystem.isPieceWithinSpaceBounds(sub, d));
                 return buildVerticalTree(sub, dividersForSub);
             });
             return parentSpace;
        };

        const finalSpace = buildTree(structuralSpace, internalPieces);

        const collectActiveSpaces = (s: FurnitureSpace, visited = new Set()): FurnitureSpace[] => {
            if (visited.has(s.id)) return [];
            visited.add(s.id);
            if (!s.isActive && s.subSpaces?.length) return s.subSpaces.flatMap(sub => collectActiveSpaces(sub, visited));
            return s.isActive ? [s] : [];
        };
        
        return { space: finalSpace, activeSpaces: collectActiveSpaces(finalSpace, new Set()), positionedPieces };
    }, [allPieces, mainSpaceInfo]);

    const getSelectedSpace = useCallback(() => {
        if (!selectedSpaceId) return null;
        const findSpace = (s: FurnitureSpace): FurnitureSpace | null => {
            if (s.id === selectedSpaceId) return s;
            if (s.subSpaces) {
                for (const sub of s.subSpaces) {
                    const found = findSpace(sub);
                    if (found) return found;
                }
            }
            return null;
        };
        return findSpace(memoizedState.space);
    }, [selectedSpaceId, memoizedState.space]);

    const addPiece = useCallback((pieceType: PieceType) => {
        const targetSpace = getSelectedSpace();
        if (!targetSpace) return;
        
        const config = PIECE_CONFIG[pieceType];
        const newPiece: FurniturePiece = {
            id: uuidv4(),
            type: pieceType,
            name: config.name,
            thickness: defaultThickness,
            color: config.color,
            // A posição e dimensão são relativas e serão calculadas no useMemo
            position: targetSpace.position, 
            dimensions: { width: 0, height: 0, depth: 0 },
            parentSpaceId: targetSpace.id,
        };
        setAllPieces(prev => [...prev, newPiece]);
    }, [getSelectedSpace, defaultThickness]);

    const removePiece = useCallback((pieceId: string) => {
        setAllPieces(prev => prev.filter(p => p.id !== pieceId));
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

    // Exporta tudo que a UI precisa
    return {
        space: memoizedState.space,
        activeSpaces: memoizedState.activeSpaces,
        allPieces: memoizedState.positionedPieces, // <--- Importante!
        addPiece, removePiece, updateDimensions, clearAllPieces, selectedSpaceId, selectSpace: setSelectedSpaceId,
        insertionContext, setInsertionMode, defaultThickness, setDefaultThickness,
    };
};


