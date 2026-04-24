import '../styles/pages/GameBoard1v1v1v1.css'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../components/Modal'
import InGameChat, { type ChatMessage } from '../components/InGameChat'
import '../styles/components/InGameChat.css'
import { api, WS_BASE_URL } from '../services/api'
import { PIECE_STYLES_4P, decodePiecePreference } from '../config/pieceStyles'
import { resolveUserAvatar } from '../config/avatarOptions'
import { getArenaAssetsByRr } from '../config/arenaThemes'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import blockGameFrame from '../assets/Ingame/bloqueJuego4Jugadores.png'
import questionCellDefault from '../assets/Ingame/casillaInterrogante.png'
import skillSlotImage from '../assets/Ingame/HuecoHabilidades.png'
import abilityBombIcon from '../assets/Ingame/Bomba.png'
import abilityFixPieceIcon from '../assets/Ingame/FichaFija.png'
import abilityUnfixPieceIcon from '../assets/Ingame/QuitarFichaFija.png'
import abilityFlipRivalIcon from '../assets/Ingame/VoltearFicha.png'
import abilityPlaceFreeIcon from '../assets/Ingame/FichaLibre.png'
import abilitySkipRivalIcon from '../assets/Ingame/SaltarTurno.png'
import abilityStealSkillIcon from '../assets/Ingame/RobarHabilidad.png'
import abilityExchangeSkillIcon from '../assets/Ingame/IntercambiarHabilidad.png'
import abilityGiveSkillIcon from '../assets/Ingame/DarHabilidad.png'
import abilitySwapColorsIcon from '../assets/Ingame/IntercambioColor.png'
import abilityLoseTurnIcon from '../assets/Ingame/PerderTurno.png'
import abilityGravityIcon from '../assets/Ingame/gravedad.png'
import pauseButtonImage from '../assets/Ingame/BotonPausa.png'
import leaveRoomButtonImage from '../assets/salaEspera/Abandonar.png'

type Piece = 'black' | 'white' | 'red' | 'blue'
interface BoardCell {
    piece: Piece | null
    fixed: boolean
}

type AbilityId =
    | 'bomb'
    | 'fix_piece'
    | 'unfix_piece'
    | 'flip_rival'
    | 'place_free'
    | 'skip_rival'
    | 'steal_skill'
    | 'exchange_skill'
    | 'give_skill'
    | 'swap_colors'
    | 'lose_turn'
    | 'gravity'
    | 'gravity_up'
    | 'gravity_down'
    | 'gravity_left'
    | 'gravity_right'

interface PendingAbility {
    id: AbilityId
    inventoryIndex: number
}

type GravityDirection = 'up' | 'down' | 'left' | 'right'

interface SkillAnnouncement {
    actorLabel: string
    abilityLabel: string
    iconSrc: string
    tone: 'self' | 'opponent'
    theme: 'bomb' | 'gravity' | 'trick' | 'control'
}

interface GameBoard1v1v1v1Props {
    onNavigate: (screen: string, data?: any) => void
    matchData?: MatchData4Players | null
}

interface MatchData4Players {
    online?: boolean
    gameId?: string
    myUsername?: string
    players: Array<{
        id?: number
        name: string
        rr: number
        avatar_url?: string
    }>
    returnTo?: string
}

interface InGameTheme {
    frame: string
    boardBackground: string
    board: string
    questionCell: string
}

interface QuadPlayer {
    id: number
    name: string
    rr: number
    avatar_url?: string
    piece: Piece
    color: string
}

const BOARD_SIZE = 16
const QUESTION_COUNT = 16
const PIECE_ORDER: Piece[] = ['black', 'white', 'red', 'blue']
const ANNOUNCEMENT_DURATION_MS = 2000

const ABILITY_META: Record<string, { name: string; iconSrc: string; needsTarget: boolean }> = {
    bomb: { name: 'Bomba', iconSrc: abilityBombIcon, needsTarget: true },
    fix_piece: { name: 'Fijar ficha', iconSrc: abilityFixPieceIcon, needsTarget: true },
    unfix_piece: { name: 'Quitar fijacion', iconSrc: abilityUnfixPieceIcon, needsTarget: true },
    flip_rival: { name: 'Girar ficha rival', iconSrc: abilityFlipRivalIcon, needsTarget: true },
    place_free: { name: 'Poner ficha libre', iconSrc: abilityPlaceFreeIcon, needsTarget: true },
    skip_rival: { name: 'Saltar turno rival', iconSrc: abilitySkipRivalIcon, needsTarget: false },
    steal_skill: { name: 'Robar habilidad', iconSrc: abilityStealSkillIcon, needsTarget: false },
    exchange_skill: { name: 'Intercambiar habilidad', iconSrc: abilityExchangeSkillIcon, needsTarget: false },
    give_skill: { name: 'Regalar habilidad', iconSrc: abilityGiveSkillIcon, needsTarget: false },
    swap_colors: { name: 'Cambiar colores', iconSrc: abilitySwapColorsIcon, needsTarget: false },
    lose_turn: { name: 'Perder turno', iconSrc: abilityLoseTurnIcon, needsTarget: false },
    gravity: { name: 'Gravedad', iconSrc: abilityGravityIcon, needsTarget: false },
}

const ENABLE_SPECIAL_MECHANICS_4V4 = true
const ABILITY_PENALTY = 2
const ABILITY_DESCRIPTIONS: Record<AbilityId, string> = {
    gravity: 'Desplaza todas las fichas del tablero hacia la direccion elegida, excepto las fichas fijas.',
    gravity_up: 'Desplaza todas las fichas del tablero hacia la direccion elegida, excepto las fichas fijas.',
    gravity_down: 'Desplaza todas las fichas del tablero hacia la direccion elegida, excepto las fichas fijas.',
    gravity_left: 'Desplaza todas las fichas del tablero hacia la direccion elegida, excepto las fichas fijas.',
    gravity_right: 'Desplaza todas las fichas del tablero hacia la direccion elegida, excepto las fichas fijas.',
    bomb: 'En el area 3x3 seleccionada, todas las fichas se voltean sin importar su dueño.',
    fix_piece: 'Convierte una ficha propia colocada en una ficha fija que no puede moverse ni voltearse.',
    unfix_piece: 'Libera una ficha fija para que vuelva a ser normal. Si no hay fichas fijas, no se puede usar.',
    place_free: 'Permite colocar una ficha propia en cualquier casilla vacia sin necesidad de capturar.',
    skip_rival: 'El siguiente rival pierde su turno.',
    lose_turn: 'Al usarla, pierdes tu turno actual.',
    flip_rival: 'Convierte una ficha rival elegida a tu color.',
    swap_colors: 'Intercambia todas tus fichas del tablero con las del rival seleccionado.',
    steal_skill: 'Robas una habilidad aleatoria de un rival. Si nadie tiene habilidades, no se puede usar.',
    exchange_skill: 'Das una habilidad tuya y recibes una del rival. Si no hay habilidades en origen o destino, no se puede usar.',
    give_skill: 'Entregas una habilidad de tu mano a otro jugador. Si no tienes ninguna, no se puede usar.',
}
const ABILITY_POOL = Object.keys(ABILITY_META) as AbilityId[]
const GRAVITY_DIRECTION_LABELS: Record<GravityDirection, string> = {
    up: 'arriba',
    down: 'abajo',
    left: 'izquierda',
    right: 'derecha',
}
const ABILITY_RULE_NAMES: Record<AbilityId, string> = {
    gravity: 'Gravedad',
    gravity_up: 'Gravedad (arriba)',
    gravity_down: 'Gravedad (abajo)',
    gravity_left: 'Gravedad (izquierda)',
    gravity_right: 'Gravedad (derecha)',
    bomb: 'Bomba 3x3',
    fix_piece: 'Poner ficha fija',
    unfix_piece: 'Quitar ficha fija',
    place_free: 'Poner ficha libre',
    skip_rival: 'Saltar turno del rival',
    lose_turn: 'Pierdes tu turno',
    flip_rival: 'Voltear una ficha rival',
    swap_colors: 'Cambiar colores con otro jugador',
    steal_skill: 'Robar habilidad',
    exchange_skill: 'Intercambiar habilidad',
    give_skill: 'Dar habilidad',
}
const ANNOUNCEMENT_PRIORITY: AbilityId[] = [
    'give_skill',
    'exchange_skill',
    'steal_skill',
    'skip_rival',
    'swap_colors',
    'lose_turn',
    'gravity',
    'bomb',
    'fix_piece',
    'unfix_piece',
    'flip_rival',
    'place_free',
]
const getAbilityDisplayName = (ability: AbilityId) => ABILITY_RULE_NAMES[ability] ?? ABILITY_META[ability]?.name ?? 'Habilidad'

const isInsideBoard = (row: number, col: number) =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
]

function createInitialBoard(): BoardCell[][] {
    const board = Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => ({ piece: null, fixed: false }) as BoardCell),
    )

    const topRow = 3
    const bottomRow = 11
    const leftCol = 3
    const rightCol = 11

    const placeCluster = (
        startRow: number,
        startCol: number,
        topLeft: Piece,
        topRight: Piece,
        bottomLeft: Piece,
        bottomRight: Piece,
    ) => {
        board[startRow][startCol].piece = topLeft
        board[startRow][startCol + 1].piece = topRight
        board[startRow + 1][startCol].piece = bottomLeft
        board[startRow + 1][startCol + 1].piece = bottomRight
    }

    placeCluster(topRow, leftCol, 'black', 'white', 'red', 'blue')
    placeCluster(topRow, rightCol, 'white', 'black', 'blue', 'red')
    placeCluster(bottomRow, leftCol, 'red', 'blue', 'black', 'white')
    placeCluster(bottomRow, rightCol, 'blue', 'red', 'white', 'black')

    return board
}

function cloneBoard(board: BoardCell[][]): BoardCell[][] {
    return board.map(row => row.map(cell => ({ ...cell })))
}

function createQuestionCells(board: BoardCell[][]) {
    const available: string[] = []
    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (board[row][col].piece === null) {
                available.push(`${row}-${col}`)
            }
        }
    }

    const result = new Set<string>()
    const count = Math.min(QUESTION_COUNT, available.length)
    for (let i = 0; i < count; i += 1) {
        const index = Math.floor(Math.random() * available.length)
        result.add(available[index])
        available.splice(index, 1)
    }

    return result
}

function applyGravity(board: BoardCell[][], direction: GravityDirection, questionCells: Set<string>) {
    const next = cloneBoard(board)
    const nextQuestions = new Set<string>()

    const rebuildSegment = (coords: Array<[number, number]>, towardStart: boolean) => {
        const items: Array<{ type: 'piece', piece: Piece } | { type: 'question' }> = []

        coords.forEach(([r, c]) => {
            const key = `${r}-${c}`
            if (next[r][c].piece) {
                items.push({ type: 'piece', piece: next[r][c].piece! })
            } else if (questionCells.has(key)) {
                items.push({ type: 'question' })
            }
            next[r][c].piece = null
        })

        if (towardStart) {
            items.forEach((item, i) => {
                const [r, c] = coords[i]
                if (item.type === 'piece') {
                    next[r][c].piece = item.piece
                } else {
                    nextQuestions.add(`${r}-${c}`)
                }
            })
            return
        }

        const reversed = [...items].reverse()
        reversed.forEach((item, i) => {
            const [r, c] = coords[coords.length - 1 - i]
            if (item.type === 'piece') {
                next[r][c].piece = item.piece
            } else {
                nextQuestions.add(`${r}-${c}`)
            }
        })
    }

    const processLine = (line: Array<[number, number]>, towardStart: boolean) => {
        let segment: Array<[number, number]> = []
        line.forEach(([r, c]) => {
            if (next[r][c].fixed) {
                if (segment.length > 0) {
                    rebuildSegment(segment, towardStart)
                }
                segment = []
                if (questionCells.has(`${r}-${c}`)) {
                    nextQuestions.add(`${r}-${c}`)
                }
                return
            }
            segment.push([r, c])
        })
        if (segment.length > 0) {
            rebuildSegment(segment, towardStart)
        }
    }

    if (direction === 'left' || direction === 'right') {
        const towardStart = direction === 'left'
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            const line = Array.from({ length: BOARD_SIZE }, (_, col) => [row, col] as [number, number])
            processLine(line, towardStart)
        }
    } else {
        const towardStart = direction === 'up'
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            const line = Array.from({ length: BOARD_SIZE }, (_, row) => [row, col] as [number, number])
            processLine(line, towardStart)
        }
    }

    return { board: next, questionCells: nextQuestions }
}

function getFlips(board: BoardCell[][], row: number, col: number, piece: Piece) {
    if (board[row][col].piece !== null) {
        return [] as Array<[number, number]>
    }

    const flips: Array<[number, number]> = []

    DIRECTIONS.forEach(([dr, dc]) => {
        const line: Array<[number, number]> = []
        let r = row + dr
        let c = col + dc

        while (isInsideBoard(r, c)) {
            const cell = board[r][c]
            if (cell.piece === null) {
                line.length = 0
                break
            }
            if (cell.piece !== piece) {
                if (cell.fixed) {
                    line.length = 0
                    break
                }
                line.push([r, c])
                r += dr
                c += dc
                continue
            }
            break
        }

        if (line.length > 0 && isInsideBoard(r, c) && board[r][c].piece === piece) {
            flips.push(...line)
        }
    })

    return flips
}

function getValidMoves(board: BoardCell[][], piece: Piece) {
    const moves = new Set<string>()
    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (getFlips(board, row, col, piece).length > 0) {
                moves.add(`${row}-${col}`)
            }
        }
    }
    return moves
}

function countPieces(board: BoardCell[][]) {
    const result: Record<Piece, number> = {
        black: 0,
        white: 0,
        red: 0,
        blue: 0,
    }
    board.forEach(row => {
        row.forEach(cell => {
            if (cell.piece) result[cell.piece] += 1
        })
    })
    return result
}

function GameBoard1v1v1v1({ onNavigate, matchData }: GameBoard1v1v1v1Props) {
    const isOnlineMatch = Boolean(matchData?.online && matchData?.gameId)
    const postGameScreen = matchData?.returnTo || (isOnlineMatch ? 'friends' : 'online-game')
    const [selectedPieceStyle4p, setSelectedPieceStyle4p] = useState(PIECE_STYLES_4P[0])
    const [myUsername, setMyUsername] = useState(matchData?.myUsername ?? '')
    const [myAvatar, setMyAvatar] = useState<string | undefined>(undefined)
    const [arenaRr, setArenaRr] = useState(matchData?.players?.[0]?.rr ?? 1000)
    const [playersFromRoom, setPlayersFromRoom] = useState(matchData?.players ?? [])

    const [board, setBoard] = useState<BoardCell[][]>(() => createInitialBoard())
    const [currentTurn, setCurrentTurn] = useState<Piece>('black')
    const [gameOver, setGameOver] = useState(false)
    const [winner, setWinner] = useState<Piece | null>(null)
    const [inventories, setInventories] = useState<Record<Piece, AbilityId[]>>({
        black: [], white: [], red: [], blue: []
    })
    const [questionCells, setQuestionCells] = useState<Set<string>>(() =>
        ENABLE_SPECIAL_MECHANICS_4V4 ? createQuestionCells(createInitialBoard()) : new Set(),
    )
    const [pendingAbility, setPendingAbility] = useState<PendingAbility | null>(null)
    const [selectingGravityDirection, setSelectingGravityDirection] = useState<{ inventoryIndex: number } | null>(null)
    const [localPiece, setLocalPiece] = useState<Piece>('black')
    const [, setStatusMessage] = useState('Conectando...')
    const [abilityError, setAbilityError] = useState<string | null>(null)
    const [skillAnnouncement, setSkillAnnouncement] = useState<SkillAnnouncement | null>(null)
    const [expandedSkillKey, setExpandedSkillKey] = useState<string | null>(null)
    const [skipTurns, setSkipTurns] = useState<Record<Piece, number>>({
        black: 0, white: 0, red: 0, blue: 0,
    })
    const [abandonedPieces, setAbandonedPieces] = useState<Piece[]>([])
    const [, setAbandonNotice] = useState<string>('')
    const [onlineValidMoves, setOnlineValidMoves] = useState<Set<string>>(new Set())
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [showPauseConfirm, setShowPauseConfirm] = useState(false)
    const [pausedUsernames, setPausedUsernames] = useState<string[]>([])

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

    const wsRef = useRef<WebSocket | null>(null)
    const skillAnnouncementTimeoutRef = useRef<number | null>(null)
    const abilityErrorTimeoutRef = useRef<number | null>(null)
    const pendingOnlineSkillRef = useRef<{ actor: Piece; ability: AbilityId; direction?: GravityDirection } | null>(null)
    const previousOnlineInventoriesRef = useRef<Record<Piece, AbilityId[]>>({
        black: [], white: [], red: [], blue: [],
    })

    const playerColorNames = [
        selectedPieceStyle4p.p1Name,
        selectedPieceStyle4p.p2Name,
        selectedPieceStyle4p.p3Name,
        selectedPieceStyle4p.p4Name,
    ]
    const activeTheme: InGameTheme = useMemo(() => {
        const arenaAssets = getArenaAssetsByRr(arenaRr)
        return {
            frame: blockGameFrame,
            boardBackground: arenaAssets.background,
            board: arenaAssets.board4p,
            questionCell: questionCellDefault,
        }
    }, [arenaRr])

    const normalizedPlayers: QuadPlayer[] = useMemo(() => {
        const fallbackPlayers = Array.from({ length: 4 }, (_, index) => ({
            id: index,
            name: matchData?.players?.[index]?.name ?? `Jugador ${index + 1}`,
            rr: matchData?.players?.[index]?.rr ?? 1000,
            avatar_url: matchData?.players?.[index]?.avatar_url,
            piece: PIECE_ORDER[index],
            color: playerColorNames[index] ?? `Color ${index + 1}`,
        }))

        if (!playersFromRoom || playersFromRoom.length === 0) {
            return fallbackPlayers
        }

        return PIECE_ORDER.map((piece, index) => {
            const source = playersFromRoom[index] ?? fallbackPlayers[index]
            return {
                id: source.id ?? index,
                name: source.name,
                rr: source.rr ?? 1000,
                avatar_url: source.avatar_url,
                piece,
                color: playerColorNames[index] ?? `Color ${index + 1}`,
            }
        })
    }, [matchData?.players, playerColorNames, playersFromRoom])

    const playerByPiece = useMemo(() => {
        const map = {} as Record<Piece, QuadPlayer>
        normalizedPlayers.forEach((player) => {
            map[player.piece] = player
        })
        return map
    }, [normalizedPlayers])

    const rawScoreByPiece = useMemo(() => countPieces(board), [board])
    const penaltyScoreByPiece = useMemo(() => {
        const penalties = {} as Record<Piece, number>
        PIECE_ORDER.forEach(piece => {
            penalties[piece] = ENABLE_SPECIAL_MECHANICS_4V4 ? (inventories[piece]?.length || 0) * ABILITY_PENALTY : 0
        })
        return penalties
    }, [inventories])

    const scoreByPiece = useMemo(() => {
        const scores = {} as Record<Piece, number>
        PIECE_ORDER.forEach(piece => {
            scores[piece] = rawScoreByPiece[piece] - penaltyScoreByPiece[piece]
        })
        return scores
    }, [rawScoreByPiece, penaltyScoreByPiece])
    const finalRankingRows = useMemo(() => {
        const activeRows = PIECE_ORDER
            .filter((piece) => !abandonedPieces.includes(piece))
            .map((piece) => ({
                piece,
                player: playerByPiece[piece],
                score: scoreByPiece[piece],
                abandoned: false,
            }))
            .sort((a, b) => b.score - a.score || PIECE_ORDER.indexOf(a.piece) - PIECE_ORDER.indexOf(b.piece))
            .map((row, index) => ({
                ...row,
                rank: index + 1,
            }))

        const abandonedRows = PIECE_ORDER
            .filter((piece) => abandonedPieces.includes(piece))
            .map((piece) => ({
                piece,
                player: playerByPiece[piece],
                score: scoreByPiece[piece],
                abandoned: true,
                rank: 4,
            }))

        return [...activeRows, ...abandonedRows].sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank
            return b.score - a.score || PIECE_ORDER.indexOf(a.piece) - PIECE_ORDER.indexOf(b.piece)
        })
    }, [abandonedPieces, playerByPiece, scoreByPiece])

    const localRank = useMemo(() => {
        const localRow = finalRankingRows.find((row) => row.piece === localPiece)
        return localRow?.rank ?? 4
    }, [finalRankingRows, localPiece])

    const myPlayer = normalizedPlayers.find(player => player.piece === localPiece)
    const currentTurnPlayer = playerByPiece[currentTurn]
    const localPlayerName = playerByPiece[localPiece]?.name ?? ''
    const validMoves = isOnlineMatch ? onlineValidMoves : getValidMoves(board, currentTurn)
    const isAiMatch = useMemo(() => {
        if (!normalizedPlayers.length || !myPlayer) return false
        const opponents = normalizedPlayers.filter(player => player.piece !== myPlayer.piece)
        return opponents.length === 3 && opponents.every(player => player.name.startsWith('IA'))
    }, [myPlayer, normalizedPlayers])
    const playerNameByPiece = (piece: Piece) => playerByPiece[piece]?.name ?? piece
    const getPrimaryOpponentPiece = (player: Piece) =>
        PIECE_ORDER.find(piece => piece !== player && !abandonedPieces.includes(piece)) ?? getNextPiece(player)
    const getAliveOpponents = (player: Piece) =>
        PIECE_ORDER.filter(piece => piece !== player && !abandonedPieces.includes(piece))
    const getRandomOpponentPiece = (player: Piece) => {
        const candidates = getAliveOpponents(player)
        if (candidates.length === 0) return getNextPiece(player)
        return candidates[Math.floor(Math.random() * candidates.length)]
    }

    const clearSkillAnnouncement = () => {
        if (skillAnnouncementTimeoutRef.current !== null) {
            window.clearTimeout(skillAnnouncementTimeoutRef.current)
            skillAnnouncementTimeoutRef.current = null
        }
    }

    const showAbilityError = (message: string) => {
        if (abilityErrorTimeoutRef.current !== null) {
            window.clearTimeout(abilityErrorTimeoutRef.current)
            abilityErrorTimeoutRef.current = null
        }

        setAbilityError(message)
        setStatusMessage(message)
        abilityErrorTimeoutRef.current = window.setTimeout(() => {
            setAbilityError(null)
            abilityErrorTimeoutRef.current = null
        }, 2600)
    }

    const showSkillAnnouncement = (actor: Piece, ability: AbilityId, direction?: GravityDirection) => {
        const normalizedAbility = normalizeAbilityForAnnouncement(ability)
        const abilityMeta = ABILITY_META[normalizedAbility] ?? { name: 'Habilidad', iconSrc: questionCellDefault, needsTarget: false }
        const tone = actor === localPiece ? 'self' : 'opponent'
        const actorLabel = tone === 'self' ? 'Has usado' : `${playerNameByPiece(actor)} ha usado`
        const abilityLabel =
            normalizedAbility === 'gravity' && direction
                ? `Gravedad hacia ${GRAVITY_DIRECTION_LABELS[direction]}`
                : getAbilityDisplayName(normalizedAbility)

        clearSkillAnnouncement()
        setSkillAnnouncement({
            actorLabel,
            abilityLabel,
            iconSrc: abilityMeta.iconSrc,
            tone,
            theme: getAnnouncementTheme(normalizedAbility),
        })
        skillAnnouncementTimeoutRef.current = window.setTimeout(() => {
            setSkillAnnouncement(null)
            skillAnnouncementTimeoutRef.current = null
        }, ANNOUNCEMENT_DURATION_MS)
    }
    const rrDelta = useMemo(() => {
        if (isAiMatch) return 0

        const rrByRank: Record<number, number> = {
            1: 50,
            2: 25,
            3: 0,
            4: -25,
        }

        return rrByRank[localRank] ?? -25
    }, [isAiMatch, localRank])

    useEffect(() => {
        let isMounted = true

        const loadUserCustomization = async () => {
            try {
                const me = await api.users.getMe()
                if (!isMounted) return
                const { quadIndex } = decodePiecePreference(me.preferred_piece_color)
                setSelectedPieceStyle4p(PIECE_STYLES_4P[quadIndex] ?? PIECE_STYLES_4P[0])
                setMyAvatar(me.avatar_url)
                setArenaRr(me.elo ?? matchData?.players?.[0]?.rr ?? 1000)
                if (!myUsername) setMyUsername(me.username)
            } catch {
                if (!isMounted) return
                setSelectedPieceStyle4p(PIECE_STYLES_4P[0])
                setArenaRr(matchData?.players?.[0]?.rr ?? 1000)
            }
        }

        loadUserCustomization()
        return () => {
            isMounted = false
        }
    }, [matchData?.players, myUsername])

    useEffect(() => () => {
        if (skillAnnouncementTimeoutRef.current !== null) {
            window.clearTimeout(skillAnnouncementTimeoutRef.current)
            skillAnnouncementTimeoutRef.current = null
        }
        if (abilityErrorTimeoutRef.current !== null) {
            window.clearTimeout(abilityErrorTimeoutRef.current)
            abilityErrorTimeoutRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!isOnlineMatch || !matchData?.gameId) {
            return
        }

        const token = localStorage.getItem('token')
        if (!token) {
            setStatusMessage('No hay sesion activa')
            return
        }

        const wsUrl = `${WS_BASE_URL}/ws/play/${encodeURIComponent(matchData.gameId)}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => setStatusMessage('Partida online conectada')

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data?.type === 'player_assignment') {
                    const assigned = data?.payload?.color as Piece
                    if (PIECE_ORDER.includes(assigned)) {
                        setLocalPiece(assigned)
                    }
                }

                if (data?.type === 'room_sync' && data?.payload?.players) {
                    const roomPlayers = data.payload.players.map((player: any, index: number) => ({
                        id: player.id ?? index,
                        name: player.username,
                        rr: player.rr ?? 1000,
                        avatar_url: player.avatar_url,
                    }))
                    setPlayersFromRoom(roomPlayers)
                }

                if (data?.type === 'waiting_for_player') {
                    setStatusMessage('Esperando a que todos esten listos...')
                }

                if (data?.type === 'game_state_update' && data?.payload) {
                    const payload = data.payload
                    if (Array.isArray(payload.board)) {
                        const fixedPieces = Array.isArray(payload.fixed_pieces) ? payload.fixed_pieces : []
                        const fixedSet = new Set(fixedPieces.map((p: any) => `${p[0]}-${p[1]}`))

                        setBoard(payload.board.map((row: any, r: number) =>
                            row.map((piece: any, c: number) => ({
                                piece,
                                fixed: fixedSet.has(`${r}-${c}`)
                            }))
                        ))
                    }
                    if (PIECE_ORDER.includes(payload.current_player)) {
                        setCurrentTurn(payload.current_player as Piece)
                    }
                    if (payload.skill_tiles) {
                        setQuestionCells(new Set(payload.skill_tiles.map((p: any) => `${p[0]}-${p[1]}`)))
                    }
                    if (payload.skills_inventory) {
                        const nextInventories = {
                            black: payload.skills_inventory.black || [],
                            white: payload.skills_inventory.white || [],
                            red: payload.skills_inventory.red || [],
                            blue: payload.skills_inventory.blue || [],
                        }

                        const previousInventories = previousOnlineInventoriesRef.current
                        const pendingSkill = pendingOnlineSkillRef.current

                        PIECE_ORDER.forEach(piece => {
                            if (piece === localPiece && pendingSkill?.actor === piece) {
                                return
                            }

                            const inferredAbility = inferAnnouncementAbility(previousInventories[piece], nextInventories[piece])
                            if (inferredAbility) {
                                showSkillAnnouncement(piece, inferredAbility)
                            }
                        })

                        if (pendingSkill && pendingSkill.actor === localPiece) {
                            showSkillAnnouncement(localPiece, pendingSkill.ability, pendingSkill.direction)
                            pendingOnlineSkillRef.current = null
                        }

                        previousOnlineInventoriesRef.current = nextInventories
                        setInventories(nextInventories)
                    }
                    setGameOver(Boolean(payload.game_over))
                    setWinner(PIECE_ORDER.includes(payload.winner) ? payload.winner as Piece : null)
                    setOnlineValidMoves(new Set(
                        ((payload.valid_moves ?? []) as Array<{ row: number; col: number }>).map(move => `${move.row}-${move.col}`),
                    ))
                    const nextAbandonedPieces = ((payload.abandoned_pieces ?? []) as Piece[])
                        .filter((piece) => PIECE_ORDER.includes(piece))
                    setAbandonedPieces((previous) => {
                        const newlyAbandoned = nextAbandonedPieces.find(piece => !previous.includes(piece))
                        if (newlyAbandoned) {
                            const abandonedName =
                                payload?.username_by_piece?.[newlyAbandoned] ?? playerByPiece[newlyAbandoned]?.name ?? newlyAbandoned
                            setAbandonNotice(`${abandonedName} ha abandonado la partida`)
                        }
                        return nextAbandonedPieces
                    })

                    if (Array.isArray(payload.paused_usernames)) {
                        setPausedUsernames(payload.paused_usernames)
                    }

                    if (payload.game_over) {
                        setStatusMessage('Partida finalizada')
                    } else if (payload.current_player === localPiece) {
                        setStatusMessage('')
                    } else {
                        setStatusMessage('')
                    }
                }

                if (data?.type === 'error' && data?.payload?.message) {
                    setStatusMessage('Partida online conectada')
                    showAbilityError(data.payload.message)
                    pendingOnlineSkillRef.current = null
                }

                if (data?.type === 'chat_message' && data?.payload) {
                    const sender = data.payload.sender || '?'
                    const message = data.payload.message || ''
                    setChatMessages(prev => [...prev, { sender, message }])
                }
            } catch {
                // Ignore malformed payloads
            }
        }

        ws.onclose = () => {
            if (!gameOver) {
                setStatusMessage('Conexion cerrada')
            }
        }

        return () => {
            ws.close()
            wsRef.current = null
        }
    }, [gameOver, isOnlineMatch, localPiece, matchData?.gameId])

    const applyQuestionReward = (
        row: number,
        col: number,
        player: Piece,
        nextQuestions: Set<string>,
        nextInventories: Record<Piece, AbilityId[]>,
    ) => {
        const key = `${row}-${col}`
        if (!ENABLE_SPECIAL_MECHANICS_4V4 || !nextQuestions.has(key)) {
            return ''
        }

        nextQuestions.delete(key)
        const reward = ABILITY_POOL[Math.floor(Math.random() * ABILITY_POOL.length)]
        nextInventories[player] = [...nextInventories[player], reward]
        return `${playerNameByPiece(player)} obtuvo habilidad: ${getAbilityDisplayName(reward)}.`
    }

    const advanceLocalTurn = (
        nextBoard: BoardCell[][],
        nextInventories: Record<Piece, AbilityId[]>,
        nextSkipTurns: Record<Piece, number>,
        actingPiece: Piece,
    ) => {
        let candidate = getNextPiece(actingPiece)
        const updatedSkipTurns = { ...nextSkipTurns }

        for (let i = 0; i < PIECE_ORDER.length; i += 1) {
            if (abandonedPieces.includes(candidate)) {
                candidate = getNextPiece(candidate)
                continue
            }

            if (updatedSkipTurns[candidate] > 0) {
                updatedSkipTurns[candidate] -= 1
                candidate = getNextPiece(candidate)
                continue
            }

            const hasMoves = getValidMoves(nextBoard, candidate).size > 0
            const hasAbilities = nextInventories[candidate].length > 0

            if (hasMoves || hasAbilities) {
                return {
                    nextTurn: candidate,
                    nextSkipTurns: updatedSkipTurns,
                    gameEnded: false,
                }
            }

            candidate = getNextPiece(candidate)
        }

        return {
            nextTurn: actingPiece,
            nextSkipTurns: updatedSkipTurns,
            gameEnded: true,
        }
    }

    const finishLocalAction = (
        nextBoard: BoardCell[][],
        nextQuestions: Set<string>,
        nextInventories: Record<Piece, AbilityId[]>,
        nextSkipTurns: Record<Piece, number>,
        actionMessage: string,
    ) => {
        const advance = advanceLocalTurn(nextBoard, nextInventories, nextSkipTurns, currentTurn)

        setBoard(nextBoard)
        setQuestionCells(nextQuestions)
        setInventories(nextInventories)
        setSkipTurns(advance.nextSkipTurns)
        setPendingAbility(null)
        setSelectingGravityDirection(null)
        setStatusMessage(actionMessage)
        setCurrentTurn(advance.nextTurn)
        setGameOver(advance.gameEnded)

        if (advance.gameEnded) {
            const finalScores = countPieces(nextBoard)
            const alivePieces = PIECE_ORDER.filter(piece => !abandonedPieces.includes(piece))
            const localWinner = alivePieces.reduce((best, piece) => {
                if (!best) return piece
                return finalScores[piece] > finalScores[best] ? piece : best
            }, null as Piece | null)
            setWinner(localWinner)
            setStatusMessage('Partida finalizada')
        }
    }

    const useInstantAbility = (ability: AbilityId, inventoryIndex: number, direction?: GravityDirection) => {
        if (isOnlineMatch) {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
            if (currentTurn !== localPiece) return
            const targetPlayer = ability === 'steal_skill'
                ? getRandomOpponentPiece(localPiece)
                : getPrimaryOpponentPiece(localPiece)

            pendingOnlineSkillRef.current = { actor: localPiece, ability, direction }
            wsRef.current.send(JSON.stringify({
                action: 'use_skill',
                type: ability,
                direction,
                target_player: targetPlayer,
                inventory_index: inventoryIndex,
            }))
            return
        }

        const player = currentTurn
        const opponent = getPrimaryOpponentPiece(player)
        const nextBoard = cloneBoard(board)
        const nextQuestions = new Set(questionCells)
        const nextInventories: Record<Piece, AbilityId[]> = {
            black: [...inventories.black],
            white: [...inventories.white],
            red: [...inventories.red],
            blue: [...inventories.blue],
        }
        const nextSkipTurns = { ...skipTurns }

        nextInventories[player].splice(inventoryIndex, 1)
        let message = `${playerNameByPiece(player)} usó ${getAbilityDisplayName(ability)}.`

        if (ability === 'skip_rival') {
            nextSkipTurns[opponent] += 1
            message = `${playerNameByPiece(player)} hará que ${playerNameByPiece(opponent)} pierda su próximo turno.`
        }

        if (ability === 'steal_skill') {
            const stealTargets = getAliveOpponents(player).filter(piece => nextInventories[piece].length > 0)
            if (stealTargets.length > 0) {
                const stealTarget = stealTargets[Math.floor(Math.random() * stealTargets.length)]
                const stolenIndex = Math.floor(Math.random() * nextInventories[stealTarget].length)
                const [stolen] = nextInventories[stealTarget].splice(stolenIndex, 1)
                nextInventories[player].push(stolen)
                message = `${playerNameByPiece(player)} robo una habilidad a ${playerNameByPiece(stealTarget)}.`
            } else {
                message = 'Ningun rival tiene habilidades para robar.'
            }
        }

        if (ability === 'exchange_skill') {
            if (nextInventories[player].length > 0 && nextInventories[opponent].length > 0) {
                const playerIndex = Math.floor(Math.random() * nextInventories[player].length)
                const opponentIndex = Math.floor(Math.random() * nextInventories[opponent].length)
                const playerAbility = nextInventories[player][playerIndex]
                nextInventories[player][playerIndex] = nextInventories[opponent][opponentIndex]
                nextInventories[opponent][opponentIndex] = playerAbility
                message = `${playerNameByPiece(player)} intercambió una habilidad con ${playerNameByPiece(opponent)}.`
            } else {
                message = 'No se pudo intercambiar: faltan habilidades en alguno de los dos jugadores.'
            }
        }

        if (ability === 'give_skill') {
            if (nextInventories[player].length > 0) {
                const giveIndex = Math.floor(Math.random() * nextInventories[player].length)
                const [given] = nextInventories[player].splice(giveIndex, 1)
                nextInventories[opponent].push(given)
                message = `${playerNameByPiece(player)} dio una habilidad a ${playerNameByPiece(opponent)}.`
            } else {
                message = 'No tenías otra habilidad para regalar.'
            }
        }

        if (ability === 'swap_colors') {
            for (let row = 0; row < BOARD_SIZE; row += 1) {
                for (let col = 0; col < BOARD_SIZE; col += 1) {
                    if (nextBoard[row][col].piece === player) nextBoard[row][col].piece = opponent
                    else if (nextBoard[row][col].piece === opponent) nextBoard[row][col].piece = player
                }
            }
            message = `${playerNameByPiece(player)} cambió colores con ${playerNameByPiece(opponent)}.`
        }

        if (ability === 'lose_turn') {
            nextSkipTurns[player] += 1
            message = `${playerNameByPiece(player)} perderá su próximo turno.`
        }

        if (ability === 'gravity' && direction) {
            const { board: gravityBoard, questionCells: gravityQuestions } = applyGravity(nextBoard, direction, nextQuestions)
            showSkillAnnouncement(player, 'gravity', direction)
            finishLocalAction(gravityBoard, gravityQuestions, nextInventories, nextSkipTurns, `Gravedad aplicada hacia ${GRAVITY_DIRECTION_LABELS[direction]}.`)
            return
        }

        showSkillAnnouncement(player, ability)
        finishLocalAction(nextBoard, nextQuestions, nextInventories, nextSkipTurns, message)
    }

    const resolveTargetAbility = (row: number, col: number) => {
        if (!pendingAbility || isOnlineMatch) {
            return
        }

        const player = currentTurn
        const ability = pendingAbility.id
        const nextBoard = cloneBoard(board)
        const nextQuestions = new Set(questionCells)
        const nextInventories: Record<Piece, AbilityId[]> = {
            black: [...inventories.black],
            white: [...inventories.white],
            red: [...inventories.red],
            blue: [...inventories.blue],
        }
        const nextSkipTurns = { ...skipTurns }
        const targetCell = nextBoard[row][col]
        let validTarget = false
        let message = `${playerNameByPiece(player)} usó ${getAbilityDisplayName(ability)}.`

        if (ability === 'bomb') {
            validTarget = targetCell.piece !== null && !targetCell.fixed
            if (validTarget) {
                const activePieces = PIECE_ORDER.filter(piece => !abandonedPieces.includes(piece))
                if (!canApplyBombKeepingActiveColors(nextBoard, row, col, activePieces)) {
                    showAbilityError('No puedes usar Bomba 3x3 aquí: debe quedar al menos una ficha de cada color activo.')
                    return
                }

                for (let dr = -1; dr <= 1; dr += 1) {
                    for (let dc = -1; dc <= 1; dc += 1) {
                        const rr = row + dr
                        const cc = col + dc
                        if (isInsideBoard(rr, cc) && !nextBoard[rr][cc].fixed) {
                            nextBoard[rr][cc].piece = null
                        }
                    }
                }
                message = 'Bomba aplicada en un área de 3x3.'
            }
        }

        if (ability === 'fix_piece') {
            validTarget = targetCell.piece === null
            if (validTarget) {
                targetCell.piece = player
                targetCell.fixed = true
                const rewardText = applyQuestionReward(row, col, player, nextQuestions, nextInventories)
                message = rewardText || 'Se colocó una ficha fija.'
            }
        }

        if (ability === 'unfix_piece') {
            validTarget = targetCell.piece !== null && targetCell.fixed
            if (validTarget) {
                targetCell.piece = null
                targetCell.fixed = false
                message = 'Se eliminó una ficha fija.'
            }
        }

        if (ability === 'flip_rival') {
            validTarget = targetCell.piece !== null && targetCell.piece !== player && !targetCell.fixed
            if (validTarget) {
                targetCell.piece = player
                message = 'Se volteó una ficha rival a tu color.'
            }
        }

        if (ability === 'place_free') {
            validTarget = targetCell.piece === null
            if (validTarget) {
                targetCell.piece = player
                const rewardText = applyQuestionReward(row, col, player, nextQuestions, nextInventories)
                message = rewardText || 'Se colocó una ficha libre.'
            }
        }

        if (!validTarget) {
            showAbilityError(`No puedes usar ${getAbilityDisplayName(ability)} sobre esa casilla.`)
            return
        }

        nextInventories[player].splice(pendingAbility.inventoryIndex, 1)
        showSkillAnnouncement(player, ability)
        finishLocalAction(nextBoard, nextQuestions, nextInventories, nextSkipTurns, message)
    }

    const handleUseAbility = (ability: AbilityId, inventoryIndex: number) => {
        if (!ENABLE_SPECIAL_MECHANICS_4V4 || gameOver || currentTurn !== localPiece) {
            return
        }

        if (pendingAbility?.inventoryIndex === inventoryIndex) {
            setPendingAbility(null)
            return
        }

        if (ABILITY_META[ability].needsTarget) {
            setSelectingGravityDirection(null)
            setPendingAbility({ id: ability, inventoryIndex })
            setStatusMessage(`Selecciona casilla para ${getAbilityDisplayName(ability)}.`)
            return
        }

        if (ability === 'gravity') {
            setPendingAbility(null)
            setSelectingGravityDirection({ inventoryIndex })
            setStatusMessage('Selecciona dirección para la gravedad.')
            return
        }

        useInstantAbility(ability, inventoryIndex)
    }

    const handleCellClick = (row: number, col: number) => {
        if (gameOver) return

        if (isOnlineMatch) {
            if (pendingAbility) {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
                if (currentTurn !== localPiece) return

                pendingOnlineSkillRef.current = { actor: localPiece, ability: pendingAbility.id }
                wsRef.current.send(JSON.stringify({
                    action: 'use_skill',
                    type: pendingAbility.id,
                    row,
                    col,
                    target_player: getPrimaryOpponentPiece(localPiece),
                    inventory_index: pendingAbility.inventoryIndex,
                }))
                setPendingAbility(null)
                return
            }

            const key = `${row}-${col}`
            if (!validMoves.has(key)) return
            if (currentTurn !== localPiece) return
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

            wsRef.current.send(JSON.stringify({
                action: 'make_move',
                row,
                col,
            }))
            return
        }

        if (pendingAbility) {
            resolveTargetAbility(row, col)
            return
        }

        const key = `${row}-${col}`
        if (!validMoves.has(key)) return
        const flips = getFlips(board, row, col, currentTurn)
        if (flips.length === 0) return

        const nextBoard = cloneBoard(board)
        const nextQuestions = new Set(questionCells)
        const nextInventories: Record<Piece, AbilityId[]> = {
            black: [...inventories.black],
            white: [...inventories.white],
            red: [...inventories.red],
            blue: [...inventories.blue],
        }

        nextBoard[row][col].piece = currentTurn
        flips.forEach(([flipRow, flipCol]) => {
            nextBoard[flipRow][flipCol].piece = currentTurn
        })

        const rewardText = applyQuestionReward(row, col, currentTurn, nextQuestions, nextInventories)
        finishLocalAction(
            nextBoard,
            nextQuestions,
            nextInventories,
            { ...skipTurns },
            rewardText || `${playerNameByPiece(currentTurn)} colocó una ficha.`,
        )
    }

    const handleAttemptLeave = () => {
        if (gameOver) {
            onNavigate(postGameScreen)
            return
        }
        setShowLeaveConfirm(true)
    }

    const handleConfirmLeave = async () => {
        if (isLeaving) return
        setIsLeaving(true)

        if (isOnlineMatch && matchData?.gameId) {
            try {
                await api.games.leaveLobby(matchData.gameId)
            } catch {
                // Ignore if already closed server-side.
            }
            setShowLeaveConfirm(false)
            onNavigate(postGameScreen)
            return
        }

        setShowLeaveConfirm(false)
        onNavigate(postGameScreen)
    }

    const handleAttemptPause = () => {
        if (isAiMatch) return
        setShowPauseConfirm(true)
    }

    const handleConfirmPause = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'pause' }))
            onNavigate(postGameScreen)
        } else {
            setShowPauseConfirm(false)
        }
    }

    const handleSendChat = (message: string) => {
        if (isAiMatch) return
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'chat',
                message
            }))
        } else {
            setChatMessages(prev => [...prev, { sender: myUsername, message }])
        }
    }

    const renderSkillCard = (ability: AbilityId, index: number) => {
        const skillKey = `${localPiece}-${ability}-${index}`
        const isExpanded = expandedSkillKey === skillKey
        const isActive = pendingAbility?.inventoryIndex === index && currentTurn === localPiece
        const meta = ABILITY_META[ability] || { iconSrc: questionCellDefault, name: 'Desconocida', needsTarget: false }
        const displayName = getAbilityDisplayName(ability)
        const description = ABILITY_DESCRIPTIONS[ability] || 'Sin descripcion disponible.'
        const canUse = currentTurn === localPiece && !gameOver

        return (
            <div
                key={skillKey}
                className={`duel-quad__skill-card ${isActive ? 'duel-quad__skill-card--active' : ''} ${isExpanded ? 'duel-quad__skill-card--expanded' : ''}`}
            >
                <button
                    className="duel-quad__skill-main"
                    onClick={() => canUse && handleUseAbility(ability, index)}
                    type="button"
                    disabled={!canUse}
                >
                    <span className="duel-quad__skill-icon">
                        <img src={meta.iconSrc} alt="" aria-hidden="true" />
                    </span>
                    <div className="duel-quad__skill-text">
                        <span className="duel-quad__skill-name">{displayName}</span>
                    </div>
                </button>
                <button
                    className={`duel-quad__skill-info-toggle ${isExpanded ? 'duel-quad__skill-info-toggle--open' : ''}`}
                    type="button"
                    onClick={() => setExpandedSkillKey(current => (current === skillKey ? null : skillKey))}
                    aria-expanded={isExpanded}
                    aria-label={`Ver descripcion de ${displayName}`}
                >
                    <span className="duel-quad__skill-info-icon" aria-hidden="true">i</span>
                </button>
                {isExpanded && <div className="duel-quad__skill-description">{description}</div>}
            </div>
        )
    }

    const leftPlayers = normalizedPlayers.slice(0, 2)
    const rightPlayers = normalizedPlayers.slice(2, 4)

    return (
        <div className="duel-quad">
            <img className="duel-quad__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="duel-quad__overlay" aria-hidden="true" />
            <h1 className="sr-only">Partida de cuatro jugadores</h1>
            {!gameOver && !isAiMatch && pausedUsernames.length > 0 && (
                <div className="duel__paused-status">
                    <p className="duel__paused-text">
                        Partida pausada: espera a que vuelva(n) {pausedUsernames.join(', ')}.
                    </p>
                </div>
            )}
            {skillAnnouncement && (
                <div
                    className={`duel-quad__skill-announcement duel-quad__skill-announcement--${skillAnnouncement.tone} duel-quad__skill-announcement--${skillAnnouncement.theme}`}
                    aria-live="polite"
                >
                    <span className="duel-quad__skill-announcement-icon">
                        <img src={skillAnnouncement.iconSrc} alt="" aria-hidden="true" />
                    </span>
                    <div className="duel-quad__skill-announcement-copy">
                        <span className="duel-quad__skill-announcement-actor">{skillAnnouncement.actorLabel}</span>
                        <span className="duel-quad__skill-announcement-name">{skillAnnouncement.abilityLabel}</span>
                    </div>
                </div>
            )}
            {abilityError && (
                <div
                    className="duel-quad__skill-announcement duel-quad__skill-announcement--error"
                    aria-live="assertive"
                    role="alert"
                >
                    <span className="duel-quad__skill-announcement-icon" aria-hidden="true">
                        🚫
                    </span>
                    <div className="duel-quad__skill-announcement-copy">
                        <span className="duel-quad__skill-announcement-actor">Movimiento inválido</span>
                        <span className="duel-quad__skill-announcement-name">{abilityError}</span>
                    </div>
                </div>
            )}

            <div
                className="duel-quad__container"
                style={{
                    '--duel-quad-frame-image': `url(${activeTheme.frame})`,
                    '--duel-quad-board-background-image': `url(${activeTheme.boardBackground})`,
                    '--duel-quad-question-image': `url(${activeTheme.questionCell})`,
                    '--dq-skill-slot-image': `url(${skillSlotImage})`,
                } as CSSProperties}
            >
                <div className="duel-quad__actions duel-quad__actions--corner">
                    {!isAiMatch && isOnlineMatch && matchData?.returnTo === 'friends' && (
                        <button type="button" className="duel-quad__pause-btn duel-quad__pause-btn--image" onClick={handleAttemptPause} aria-label="Pausar partida">
                            <img src={pauseButtonImage} alt="" aria-hidden="true" />
                        </button>
                    )}
                    <button
                        type="button"
                        className="duel-quad__leave-btn duel-quad__leave-btn--image"
                        onClick={handleAttemptLeave}
                        aria-label="Abandonar partida"
                    >
                        <img src={leaveRoomButtonImage} alt="" aria-hidden="true" />
                    </button>
                </div>

                <main className="duel-quad__layout">
                    <aside className="duel-quad__left-column">
                        <div className="duel-quad__players-stack duel-quad__players-stack--left">
                            {leftPlayers.map((player, index) => (
                                <article
                                    key={`${player.name}-${player.id}-left`}
                                    className={`duel-quad__panel duel-quad__panel--slot-l${index + 1} ${player.piece === currentTurn && !gameOver ? 'duel-quad__panel--active' : ''} ${abandonedPieces.includes(player.piece) ? 'duel-quad__panel--abandoned' : ''} ${pausedUsernames.includes(player.name) ? 'duel-quad__panel--paused' : ''}`}
                                >
                                    <div className="duel-quad__player-card">
                                        <img
                                            className="duel-quad__avatar"
                                            src={resolveUserAvatar(player.piece === localPiece ? myAvatar : player.avatar_url, player.name)}
                                            alt={`Avatar de ${player.name}`}
                                        />
                                        <div className="duel-quad__player-data">
                                            <span className="duel-quad__player-row">
                                                <span className="duel-quad__player-name">{player.name}</span>
                                                <span className="duel-quad__player-score">{rawScoreByPiece[player.piece]} pts</span>
                                            </span>
                                            <span className="duel-quad__player-meta">{player.color}</span>
                                            {abandonedPieces.includes(player.piece) && (
                                                <span className="duel-quad__player-abandoned">Ha abandonado</span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="duel-quad__chat-slot">
                            {isAiMatch ? (
                                <div className="duel-quad__chat-placeholder">Chat desactivado en partida contra IA.</div>
                            ) : (
                                <InGameChat
                                    messages={chatMessages}
                                    myUsername={myUsername}
                                    onSend={handleSendChat}
                                    mode="panel"
                                />
                            )}
                        </div>
                    </aside>

                    <section className="duel-quad__board-column">
                        <header className="duel-quad__center-info">
                            <span className="duel-quad__turn-label">Turno actual</span>
                            <span className="duel-quad__turn-value">
                                {gameOver ? 'Partida finalizada' : `${currentTurnPlayer?.name ?? '-'} (${currentTurnPlayer?.color ?? '-'})`}
                            </span>

                            {(pendingAbility || selectingGravityDirection) && (
                                <div className="duel-quad__ability-pending-bar">
                                    <span className="duel-quad__ability-pending-text">
                                        {pendingAbility
                                            ? `Usando: ${getAbilityDisplayName(pendingAbility.id)}`
                                            : 'Selecciona direccion de gravedad'}
                                    </span>
                                    <button
                                        className="duel-quad__ability-cancel-btn"
                                        type="button"
                                        onClick={() => {
                                            setPendingAbility(null)
                                            setSelectingGravityDirection(null)
                                            setStatusMessage('Accion cancelada.')
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            {selectingGravityDirection && (
                                <div className="duel-quad__gravity-direction-picker">
                                    {(['up', 'down', 'left', 'right'] as const).map((dir) => (
                                        <button
                                            key={dir}
                                            className={`duel-quad__gravity-btn duel-quad__gravity-btn--${dir}`}
                                            type="button"
                                            onClick={() => {
                                                const { inventoryIndex } = selectingGravityDirection
                                                if (isOnlineMatch) {
                                                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                                                        pendingOnlineSkillRef.current = { actor: localPiece, ability: 'gravity', direction: dir }
                                                        wsRef.current.send(JSON.stringify({
                                                            action: 'use_skill',
                                                            type: 'gravity',
                                                            direction: dir,
                                                            inventory_index: inventoryIndex,
                                                        }))
                                                    }
                                                } else {
                                                    useInstantAbility('gravity', inventoryIndex, dir)
                                                }
                                                setSelectingGravityDirection(null)
                                            }}
                                        >
                                            {dir === 'up' ? '⬆️' : dir === 'down' ? '⬇️' : dir === 'left' ? '⬅️' : '➡️'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </header>

                        <div className="duel-quad__board-area">
                            <div
                                className="duel-quad__board"
                                style={{ backgroundImage: `url(${activeTheme.board})` }}
                            >
                                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
                                    const row = Math.floor(index / BOARD_SIZE)
                                    const col = index % BOARD_SIZE
                                    const key = `${row}-${col}`
                                    const cell = board[row][col]
                                    const hasQuestion = ENABLE_SPECIAL_MECHANICS_4V4 && questionCells.has(key)
                                    const canShowPlayableMove = !isOnlineMatch || currentTurn === localPiece
                                    const isPlayable = !pendingAbility && validMoves.has(key) && !gameOver && canShowPlayableMove

                                    return (
                                        <button
                                            key={key}
                                            className={`duel-quad__cell ${(row + col) % 2 === 0 ? 'duel-quad__cell--dark' : 'duel-quad__cell--light'} ${isPlayable ? 'duel-quad__cell--playable' : ''} ${hasQuestion ? 'duel-quad__cell--question' : ''}`}
                                            type="button"
                                            aria-label={`Casilla ${row + 1}-${col + 1}`}
                                            onClick={() => handleCellClick(row, col)}
                                            disabled={gameOver || pausedUsernames.length > 0}
                                            tabIndex={isPlayable ? 0 : -1}
                                        >
                                            {hasQuestion && <span className="duel-quad__question" aria-hidden="true" />}
                                            {cell.piece && (
                                                <>
                                                    <span
                                                        className={`duel-quad-piece duel-quad-piece--${cell.piece} ${cell.fixed ? 'duel-quad-piece--fixed' : ''}`}
                                                        style={{
                                                            background:
                                                                cell.piece === 'black' ? selectedPieceStyle4p.p1
                                                                    : cell.piece === 'white' ? selectedPieceStyle4p.p2
                                                                        : cell.piece === 'red' ? selectedPieceStyle4p.p3
                                                                            : selectedPieceStyle4p.p4,
                                                        }}
                                                    />
                                                    {cell.fixed && <span className="duel-quad-piece-lock">{"\u{1F512}"}</span>}
                                                </>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    <aside className="duel-quad__right-column">
                        <div className="duel-quad__players-stack duel-quad__players-stack--right">
                            {rightPlayers.map((player, index) => (
                                <article
                                    key={`${player.name}-${player.id}-right`}
                                    className={`duel-quad__panel duel-quad__panel--slot-r${index + 1} ${player.piece === currentTurn && !gameOver ? 'duel-quad__panel--active' : ''} ${abandonedPieces.includes(player.piece) ? 'duel-quad__panel--abandoned' : ''} ${pausedUsernames.includes(player.name) ? 'duel-quad__panel--paused' : ''}`}
                                >
                                    <div className="duel-quad__player-card">
                                        <img
                                            className="duel-quad__avatar"
                                            src={resolveUserAvatar(player.piece === localPiece ? myAvatar : player.avatar_url, player.name)}
                                            alt={`Avatar de ${player.name}`}
                                        />
                                        <div className="duel-quad__player-data">
                                            <span className="duel-quad__player-row">
                                                <span className="duel-quad__player-name">{player.name}</span>
                                                <span className="duel-quad__player-score">{rawScoreByPiece[player.piece]} pts</span>
                                            </span>
                                            <span className="duel-quad__player-meta">{player.color}</span>
                                            {abandonedPieces.includes(player.piece) && (
                                                <span className="duel-quad__player-abandoned">Ha abandonado</span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {ENABLE_SPECIAL_MECHANICS_4V4 && (
                            <section className={`duel-quad__skills-panel ${pausedUsernames.includes(localPlayerName) ? 'duel-quad__panel--paused' : ''}`}>
                                <div className={`duel-quad__skills ${inventories[localPiece].length === 0 ? 'duel-quad__skills--empty' : ''}`}>
                                    {inventories[localPiece].length === 0 && (
                                        <span className="duel-quad__empty-skills">Sin habilidades</span>
                                    )}

                                    {inventories[localPiece].map((ability, idx) => renderSkillCard(ability, idx))}
                                </div>
                            </section>
                        )}
                    </aside>
                </main>
            </div>

            <Modal
                isOpen={gameOver}
                onClose={() => onNavigate(postGameScreen)}
                maxWidth="600px"
                showCloseButton={false}
                overlayClassName="popup-overlay"
                boxClassName="popup-box popup-box--game"
                closeButtonClassName="popup-close"
                ariaLabelledBy="duel-quad-result-title"
            >
                <div className="duel-quad-result popup-surface">
                    <div className="duel-quad-result__top">
                        <h2 className="duel-quad-result__title" id="duel-quad-result-title">Partida finalizada</h2>
                        <p className={`duel-quad-result__rr duel-quad-result__rr--badge ${rrDelta > 0 ? 'duel-quad-result__rr--up' : rrDelta < 0 ? 'duel-quad-result__rr--down' : 'duel-quad-result__rr--neutral'}`}>
                            {`${rrDelta >= 0 ? '+' : ''}${rrDelta} RR`}
                        </p>
                    </div>

                    <div className="duel-quad-result__top">
                        <p className="duel-quad-result__status">
                            {winner ? `Ganador: ${playerByPiece[winner]?.name ?? winner}` : 'Sin ganador'}
                        </p>
                        <p className="duel-quad-result__status">{`Has quedado en ${localRank}º puesto`}</p>
                    </div>

                    <div className="duel-quad-result__scores">
                        {finalRankingRows.map((row, index) => (
                            <div key={`result-${row.player?.id ?? index}`} className="duel-quad-result__row">
                                <span>{`${row.rank}º - ${row.player?.name ?? row.piece}`}</span>
                                <span>{row.abandoned ? 'Abandonó' : `${rawScoreByPiece[row.piece]} - ${penaltyScoreByPiece[row.piece]} = ${row.score} pts`}</span>
                            </div>
                        ))}
                    </div>

                    {ENABLE_SPECIAL_MECHANICS_4V4 && (
                        <p className="duel-quad-result__note" style={{ fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                            Penalización aplicada: -{ABILITY_PENALTY} pts por cada habilidad sin usar.
                        </p>
                    )}

                    <button type="button" className="duel-quad-result__back-btn" onClick={() => onNavigate(postGameScreen)}>
                        {postGameScreen === 'menu'
                            ? 'Volver al menu'
                            : postGameScreen === 'friends'
                                ? 'Volver a amigos'
                                : 'Volver a partidas'}
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={showLeaveConfirm}
                onClose={() => setShowLeaveConfirm(false)}
                maxWidth="520px"
                overlayClassName="popup-overlay"
                boxClassName="popup-box popup-box--compact"
                closeButtonClassName="popup-close"
                ariaLabelledBy="duel-quad-leave-confirm-title"
            >
                <div className="duel-quad-leave-confirm popup-surface">
                    <h2 className="duel-quad-leave-confirm__title" id="duel-quad-leave-confirm-title">Abandonar partida</h2>
                    <p className="duel-modal__text">
                        {isAiMatch
                            ? "Si abandonas esta partida contra la IA, no se contara como una derrota y no perderas puntos RR."
                            : pausedUsernames.length > 0
                                ? "Como la partida está pausada por el otro jugador, si abandonas ahora no perderás RR y la partida quedará invalidada."
                                : "Si abandonas la partida, se te registrará automáticamente como 4º puesto."
                        }
                    </p>
                    <div className="duel-quad-leave-confirm__actions">
                        <button
                            className="duel-quad-leave-confirm__btn duel-quad-leave-confirm__btn--cancel"
                            onClick={() => setShowLeaveConfirm(false)}
                            disabled={isLeaving}
                        >
                            Seguir jugando
                        </button>
                        <button
                            className="duel-quad-leave-confirm__btn duel-quad-leave-confirm__btn--confirm"
                            onClick={handleConfirmLeave}
                            disabled={isLeaving}
                        >
                            {isLeaving ? 'Abandonando...' : 'Abandonar partida'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!isAiMatch && showPauseConfirm}
                onClose={() => setShowPauseConfirm(false)}
                maxWidth="520px"
                overlayClassName="popup-overlay"
                boxClassName="popup-box popup-box--compact"
                closeButtonClassName="popup-close"
                ariaLabelledBy="duel-quad-pause-confirm-title"
            >
                <div className="duel-quad-leave-confirm popup-surface">
                    <h2 className="duel-quad-leave-confirm__title" id="duel-quad-pause-confirm-title">Pausar partida</h2>
                    <p className="duel-quad-leave-confirm__text">
                        ¿Estás seguro de que quieres pausar la partida? Podrás reanudarla después desde la sección de Amigos.
                    </p>
                    <div className="duel-quad-leave-confirm__actions">
                        <button
                            className="duel-quad-leave-confirm__btn duel-quad-leave-confirm__btn--cancel"
                            onClick={() => setShowPauseConfirm(false)}
                        >
                            Volver al juego
                        </button>
                        <button
                            className="duel-quad-leave-confirm__btn duel-quad-leave-confirm__btn--confirm"
                            onClick={handleConfirmPause}
                        >
                            Pausar partida
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    )
}

function getRemovedAbilities(previous: AbilityId[], next: AbilityId[]) {
    const nextCounts = new Map<AbilityId, number>()
    next.forEach(ability => {
        nextCounts.set(ability, (nextCounts.get(ability) ?? 0) + 1)
    })

    const removed: AbilityId[] = []
    previous.forEach(ability => {
        const remaining = nextCounts.get(ability) ?? 0
        if (remaining > 0) {
            nextCounts.set(ability, remaining - 1)
            return
        }

        removed.push(ability)
    })

    return removed
}

function inferAnnouncementAbility(previous: AbilityId[], next: AbilityId[], preferred?: AbilityId) {
    const removed = getRemovedAbilities(previous, next)
    if (removed.length === 0) {
        return null
    }

    if (preferred && removed.includes(preferred)) {
        return preferred
    }

    if (removed.length === 1) {
        return removed[0]
    }

    return ANNOUNCEMENT_PRIORITY.find(ability => removed.includes(ability)) ?? removed[0]
}

function normalizeAbilityForAnnouncement(ability: AbilityId): AbilityId {
    if (ability === 'gravity_up' || ability === 'gravity_down' || ability === 'gravity_left' || ability === 'gravity_right') {
        return 'gravity'
    }

    return ability
}

function getAnnouncementTheme(ability: AbilityId): SkillAnnouncement['theme'] {
    if (ability === 'bomb') return 'bomb'
    if (
        ability === 'gravity' ||
        ability === 'gravity_up' ||
        ability === 'gravity_down' ||
        ability === 'gravity_left' ||
        ability === 'gravity_right'
    ) {
        return 'gravity'
    }
    if (ability === 'skip_rival' || ability === 'lose_turn' || ability === 'fix_piece' || ability === 'unfix_piece') {
        return 'control'
    }
    return 'trick'
}

function canApplyBombKeepingActiveColors(board: BoardCell[][], row: number, col: number, activePieces: Piece[]) {
    const simulated = cloneBoard(board)

    for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
            const rr = row + dr
            const cc = col + dc
            if (isInsideBoard(rr, cc) && !simulated[rr][cc].fixed) {
                simulated[rr][cc].piece = null
            }
        }
    }

    const counts = countPieces(simulated)
    return activePieces.every(piece => counts[piece] > 0)
}

function getNextPiece(piece: Piece) {
    return PIECE_ORDER[(PIECE_ORDER.indexOf(piece) + 1) % PIECE_ORDER.length]
}

export default GameBoard1v1v1v1
