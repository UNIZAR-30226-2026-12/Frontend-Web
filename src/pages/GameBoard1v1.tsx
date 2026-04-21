import '../styles/pages/GameBoard1v1.css'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../components/Modal'
import InGameChat, { type ChatMessage } from '../components/InGameChat'
import '../styles/components/InGameChat.css'
import { api, WS_BASE_URL } from '../services/api'
import { PIECE_STYLES_1V1, decodePiecePreference } from '../config/pieceStyles'
import { resolveUserAvatar } from '../config/avatarOptions'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import blockGameFrame from '../assets/Ingame/bloqueJuego.png'
import boardBackgroundDefault from '../assets/Ingame/Fondo1.png'
import boardDefault from '../assets/Ingame/Tablero1v1.png'
import questionCellDefault from '../assets/Ingame/casillaInterrogante.png'
import leaveRoomButtonImage from '../assets/salaEspera/Abandonar.png'

interface GameBoard1v1Props {
    onNavigate: (screen: string, data?: any) => void
    matchData?: MatchData | null
}

interface MatchData {
    online?: boolean
    gameId?: string
    playerName: string
    playerRR: number
    playerAvatarUrl?: string
    opponentName: string
    opponentRR: number
    opponentAvatarUrl?: string
    returnTo?: string
}

type Piece = 'black' | 'white'
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

interface BoardCell {
    piece: Piece | null
    fixed: boolean
}

interface PendingAbility {
    id: AbilityId
    inventoryIndex: number
}

type GravityDirection = 'up' | 'down' | 'left' | 'right'

interface SkillAnnouncement {
    actorLabel: string
    abilityLabel: string
    icon: string
    tone: 'self' | 'opponent'
    theme: 'bomb' | 'gravity' | 'trick' | 'control'
}

const BOARD_SIZE = 8
const QUESTION_COUNT = 8
const ABILITY_PENALTY = 2
// Enable mechanics for online matches or testing
const ENABLE_SPECIAL_MECHANICS_1V1 = true
const ANNOUNCEMENT_DURATION_MS = 2000

const PLAYER = {
    name: 'Jugador',
    rr: 1000,
    piece: 'black' as Piece,
}

const OPPONENT = {
    name: 'Gamer_Pro',
    rr: 1420,
    piece: 'white' as Piece,
}

const ABILITY_META: Record<string, { name: string; icon: string; needsTarget: boolean }> = {
    bomb: { name: 'Bomba', icon: '💣', needsTarget: true },
    fix_piece: { name: 'Fijar ficha', icon: '🔒', needsTarget: true },
    unfix_piece: { name: 'Quitar fijación', icon: '🔓', needsTarget: true },
    flip_rival: { name: 'Girar ficha rival', icon: '🔄', needsTarget: true },
    place_free: { name: 'Poner ficha libre', icon: '➕', needsTarget: true },
    skip_rival: { name: 'Saltar turno rival', icon: '⏭️', needsTarget: false },
    steal_skill: { name: 'Robar habilidad', icon: '🕵️', needsTarget: false },
    exchange_skill: { name: 'Intercambiar habilidad', icon: '🔀', needsTarget: false },
    give_skill: { name: 'Regalar habilidad', icon: '🎁', needsTarget: false },
    swap_colors: { name: 'Cambiar colores', icon: '🎨', needsTarget: false },
    lose_turn: { name: 'Perder turno', icon: '🚫', needsTarget: false },
    gravity: { name: 'Gravedad', icon: '🌌', needsTarget: false },
}

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
    steal_skill: 'Robas una habilidad aleatoria de un rival. Si los rivales no tienen habilidades, no se puede usar.',
    exchange_skill: 'Das una habilidad aleatoria tuya y recibes una aleatoria del rival. Si no hay habilidades en origen o destino, no se puede usar.',
    give_skill: 'Entregas una habilidad aleatoria de tu mano a otro jugador. Si no tienes ninguna, no se puede usar.',
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
    swap_colors: 'Cambiar colores',
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

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
]

const getOpponent = (piece: Piece): Piece => (piece === 'black' ? 'white' : 'black')

const isInsideBoard = (row: number, col: number) =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

const randomInt = (max: number) => Math.floor(Math.random() * max)

interface InGameTheme {
    frame: string
    boardBackground: string
    board: string
    questionCell: string
}

const INGAME_THEME_PRESETS: Record<'classic', InGameTheme> = {
    classic: {
        frame: blockGameFrame,
        boardBackground: boardBackgroundDefault,
        board: boardDefault,
        questionCell: questionCellDefault,
    },
}

function createInitialBoard(): BoardCell[][] {
    const createEmptyCell = (): BoardCell => ({ piece: null, fixed: false })
    const board = Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => createEmptyCell()),
    )

    board[3][3].piece = 'white'
    board[3][4].piece = 'black'
    board[4][3].piece = 'black'
    board[4][4].piece = 'white'

    return board
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
        const index = randomInt(available.length)
        result.add(available[index])
        available.splice(index, 1)
    }

    return result
}

function cloneBoard(board: BoardCell[][]) {
    return board.map(row => row.map(cell => ({ ...cell })))
}

function countPieces(board: BoardCell[][]) {
    let black = 0
    let white = 0

    board.forEach(row => {
        row.forEach(cell => {
            if (cell.piece === 'black') black += 1
            if (cell.piece === 'white') white += 1
        })
    })

    return { black, white }
}

function getFlips(board: BoardCell[][], row: number, col: number, piece: Piece) {
    if (board[row][col].piece !== null) {
        return [] as Array<[number, number]>
    }

    const opponent = getOpponent(piece)
    const flips: Array<[number, number]> = []

    DIRECTIONS.forEach(([dr, dc]) => {
        const line: Array<[number, number]> = []
        let r = row + dr
        let c = col + dc

        while (isInsideBoard(r, c)) {
            const cell = board[r][c]
            if (cell.piece === opponent) {
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

function applyGravity(board: BoardCell[][], direction: 'up' | 'down' | 'left' | 'right', questionCells: Set<string>) {
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
            // Limpiamos
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
                // Las fijas que son interrogantes (si existieran) permanecen
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

function normalizeAbilityForAnnouncement(ability: AbilityId): AbilityId {
    if (ability === 'gravity_up' || ability === 'gravity_down' || ability === 'gravity_left' || ability === 'gravity_right') {
        return 'gravity'
    }

    return ability
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

function getAnnouncementTheme(ability: AbilityId): SkillAnnouncement['theme'] {
    if (ability === 'bomb') {
        return 'bomb'
    }

    if (ability === 'gravity') {
        return 'gravity'
    }

    if (ability === 'steal_skill' || ability === 'exchange_skill' || ability === 'give_skill') {
        return 'trick'
    }

    return 'control'
}

function canApplyBombKeepingBothColors(board: BoardCell[][], row: number, col: number) {
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

    const { black, white } = countPieces(simulated)
    return black > 0 && white > 0
}

function GameBoard1v1({ onNavigate, matchData }: GameBoard1v1Props) {
    const isOnlineMatch = Boolean(matchData?.online && matchData?.gameId)
    const [selectedPieceStyle1v1, setSelectedPieceStyle1v1] = useState(PIECE_STYLES_1V1[0])
    const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined)
    const [currentUserElo, setCurrentUserElo] = useState(PLAYER.rr)
    const [localPiece, setLocalPiece] = useState<Piece>('black')
    const [onlineStatusMessage, setOnlineStatusMessage] = useState('')
    const [onlineValidMoves, setOnlineValidMoves] = useState<Set<string>>(new Set())
    const [onlineWinner, setOnlineWinner] = useState<Piece | null>(null)
    const onlineWsRef = useRef<WebSocket | null>(null)
    const localPieceRef = useRef<Piece>('black')
    const [hasPersistedRank, setHasPersistedRank] = useState(false)
    const [hasPersistedHistory, setHasPersistedHistory] = useState(false)
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [isAbandoning, setIsAbandoning] = useState(false)
    const [showPauseConfirm, setShowPauseConfirm] = useState(false)
    const [pausedUsernames, setPausedUsernames] = useState<string[]>([])

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const playerPieceColorName = selectedPieceStyle1v1.sideAName
    const opponentPieceColorName = selectedPieceStyle1v1.sideBName
    const isAiMatch = (matchData?.opponentName ?? '').trim().toUpperCase() === 'IA'

    const playerProfile = {
        ...PLAYER,
        name: matchData?.playerName ?? PLAYER.name,
        rr: currentUserElo,
        piece: localPiece,
        color: localPiece === 'black' ? playerPieceColorName : opponentPieceColorName,
    }
    const opponentProfile = {
        ...OPPONENT,
        name: matchData?.opponentName ?? OPPONENT.name,
        rr: matchData?.opponentRR ?? OPPONENT.rr,
        piece: getOpponent(localPiece),
        color: localPiece === 'black' ? opponentPieceColorName : playerPieceColorName,
    }
    const playerNameByPiece = (piece: Piece) => (piece === playerProfile.piece ? playerProfile.name : opponentProfile.name)
    const activeTheme = INGAME_THEME_PRESETS.classic

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
        setSystemMessage(message)
        abilityErrorTimeoutRef.current = window.setTimeout(() => {
            setAbilityError(null)
            abilityErrorTimeoutRef.current = null
        }, 2600)
    }

    const showSkillAnnouncement = (actor: Piece, ability: AbilityId, direction?: GravityDirection) => {
        const normalizedAbility = normalizeAbilityForAnnouncement(ability)
        const abilityMeta = ABILITY_META[normalizedAbility] ?? { name: 'Habilidad', icon: '❓', needsTarget: false }
        const isSelf = actor === localPieceRef.current
        const tone: SkillAnnouncement['tone'] = isSelf ? 'self' : 'opponent'
        const actorLabel = isSelf ? 'Has usado' : `${matchData?.opponentName ?? opponentProfile.name} ha usado`
        const abilityLabel =
            normalizedAbility === 'gravity' && direction
                ? `Gravedad hacia ${GRAVITY_DIRECTION_LABELS[direction]}`
                : getAbilityDisplayName(normalizedAbility)

        clearSkillAnnouncement()
        setSkillAnnouncement({
            actorLabel,
            abilityLabel,
            icon: abilityMeta.icon,
            tone,
            theme: getAnnouncementTheme(normalizedAbility),
        })
        skillAnnouncementTimeoutRef.current = window.setTimeout(() => {
            setSkillAnnouncement(null)
            skillAnnouncementTimeoutRef.current = null
        }, ANNOUNCEMENT_DURATION_MS)
    }

    const [board, setBoard] = useState<BoardCell[][]>(() => createInitialBoard())
    const [questionCells, setQuestionCells] = useState<Set<string>>(() =>
        ENABLE_SPECIAL_MECHANICS_1V1 ? createQuestionCells(createInitialBoard()) : new Set<string>(),
    )
    const [currentTurn, setCurrentTurn] = useState<Piece>('black')
    const [inventories, setInventories] = useState<Record<Piece, AbilityId[]>>({ black: [], white: [] })
    const [skipTurns, setSkipTurns] = useState<Record<Piece, number>>({ black: 0, white: 0 })
    const [pendingAbility, setPendingAbility] = useState<PendingAbility | null>(null)
    const [selectingGravityDirection, setSelectingGravityDirection] = useState<{ inventoryIndex: number } | null>(null)
    const [gameOver, setGameOver] = useState(false)
    const [systemMessage, setSystemMessage] = useState('Haz una jugada o usa una habilidad.')
    const [abilityError, setAbilityError] = useState<string | null>(null)
    const [skillAnnouncement, setSkillAnnouncement] = useState<SkillAnnouncement | null>(null)
    const [expandedSkillKey, setExpandedSkillKey] = useState<string | null>(null)
    const validMoves = useMemo(
        () => (isOnlineMatch ? onlineValidMoves : getValidMoves(board, currentTurn)),
        [board, currentTurn, isOnlineMatch, onlineValidMoves],
    )
    const skillAnnouncementTimeoutRef = useRef<number | null>(null)
    const abilityErrorTimeoutRef = useRef<number | null>(null)
    const pendingOnlineSkillRef = useRef<{ actor: Piece; ability: AbilityId; direction?: GravityDirection } | null>(null)
    const previousOnlineInventoriesRef = useRef<Record<Piece, AbilityId[]>>({ black: [], white: [] })

    const rawScore = useMemo(() => countPieces(board), [board])
    const penaltyScore = useMemo(
        () => ({
            black: ENABLE_SPECIAL_MECHANICS_1V1 ? inventories.black.length * ABILITY_PENALTY : 0,
            white: ENABLE_SPECIAL_MECHANICS_1V1 ? inventories.white.length * ABILITY_PENALTY : 0,
        }),
        [inventories.black.length, inventories.white.length],
    )

    const finalScore = useMemo(
        () => ({
            black: rawScore.black - penaltyScore.black,
            white: rawScore.white - penaltyScore.white,
        }),
        [penaltyScore.black, penaltyScore.white, rawScore.black, rawScore.white],
    )

    const winnerInfo = useMemo(() => {
        if (isOnlineMatch && gameOver) {
            if (!onlineWinner) {
                return { winnerName: 'Empate', playerWon: false, isDraw: true }
            }
            const playerWon = onlineWinner === playerProfile.piece
            return {
                winnerName: playerWon ? playerProfile.name : opponentProfile.name,
                playerWon,
                isDraw: false,
            }
        }

        if (finalScore.black === finalScore.white) {
            return {
                winnerName: 'Empate',
                playerWon: false,
                isDraw: true,
            }
        }

        const blackWins = finalScore.black > finalScore.white
        return {
            winnerName: blackWins ? playerProfile.name : opponentProfile.name,
            playerWon: blackWins,
            isDraw: false,
        }
    }, [finalScore.black, finalScore.white, gameOver, isOnlineMatch, onlineWinner, opponentProfile.name, opponentProfile.piece, playerProfile.name, playerProfile.piece])

    const rrDelta = isAiMatch ? 0 : winnerInfo.isDraw ? 0 : winnerInfo.playerWon ? 30 : -30
    const abandonmentPenalty = -30
    const postGameScreen = matchData?.returnTo || (isOnlineMatch ? 'friends' : 'online-game')

    useEffect(() => {
        let isMounted = true

        const loadProfile = async () => {
            try {
                const me = await api.users.getMe()
                if (!isMounted) return
                const { duelIndex } = decodePiecePreference(me.preferred_piece_color)
                setSelectedPieceStyle1v1(PIECE_STYLES_1V1[duelIndex] ?? PIECE_STYLES_1V1[0])
                setCurrentUserAvatar(me.avatar_url)
                setCurrentUserElo(me.elo ?? PLAYER.rr)
            } catch {
                if (!isMounted) return
                setSelectedPieceStyle1v1(PIECE_STYLES_1V1[0])
                setCurrentUserAvatar(undefined)
                setCurrentUserElo(PLAYER.rr)
            }
        }

        loadProfile()
        return () => {
            isMounted = false
        }
    }, [])

    // Mantener la ref sincronizada sin generar dependencia reactiva en el WS effect
    useEffect(() => {
        localPieceRef.current = localPiece
    }, [localPiece])

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
            setOnlineStatusMessage('No hay sesion activa')
            return
        }

        const wsUrl = `${WS_BASE_URL}/ws/play/${encodeURIComponent(matchData.gameId)}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(wsUrl)
        onlineWsRef.current = ws

        ws.onopen = () => {
            setOnlineStatusMessage('Partida online conectada')
            // Indicar al backend que este jugador está listo para empezar
            ws.send(JSON.stringify({ action: 'set_ready', ready: true }))
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data?.type === 'player_assignment' && (data?.payload?.color === 'black' || data?.payload?.color === 'white')) {
                    setLocalPiece(data.payload.color)
                    localPieceRef.current = data.payload.color
                }

                if (data?.type === 'waiting_for_player') {
                    setOnlineStatusMessage('Esperando al rival...')
                }

                if (data?.type === 'game_state_update' && data?.payload) {
                    const payload = data.payload
                    let nextOnlineInventories = previousOnlineInventoriesRef.current

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
                    if (payload.current_player) {
                        setCurrentTurn(payload.current_player)
                    }
                    if (payload.skill_tiles) {
                        setQuestionCells(new Set(payload.skill_tiles.map((p: any) => `${p[0]}-${p[1]}`)))
                    }
                    if (payload.skills_inventory) {
                        nextOnlineInventories = {
                            black: payload.skills_inventory.black || [],
                            white: payload.skills_inventory.white || []
                        }
                        setInventories(nextOnlineInventories)
                    }
                    setGameOver(Boolean(payload.game_over))
                    setOnlineWinner(payload.winner === 'black' || payload.winner === 'white' ? payload.winner : null)
                    setOnlineValidMoves(new Set(
                        ((payload.valid_moves ?? []) as Array<{ row: number; col: number }>).map(move => `${move.row}-${move.col}`),
                    ))
                    if (payload.game_over) {
                        setOnlineStatusMessage('Partida finalizada')
                    } else if (payload.current_player === localPieceRef.current) {
                        setOnlineStatusMessage('Tu turno')
                    } else {
                        setOnlineStatusMessage('Turno del rival')
                    }

                    if (Array.isArray(payload.paused_usernames)) {
                        setPausedUsernames(payload.paused_usernames)
                    }

                    if (payload.skills_inventory) {
                        const previousInventories = previousOnlineInventoriesRef.current
                        const pendingSkill = pendingOnlineSkillRef.current

                        if (pendingSkill) {
                            const resolvedAbility = inferAnnouncementAbility(
                                previousInventories[pendingSkill.actor] ?? [],
                                nextOnlineInventories[pendingSkill.actor] ?? [],
                                pendingSkill.ability,
                            )
                            showSkillAnnouncement(
                                pendingSkill.actor,
                                resolvedAbility ?? pendingSkill.ability,
                                pendingSkill.direction,
                            )
                            pendingOnlineSkillRef.current = null
                        } else {
                            const opponentPiece = getOpponent(localPieceRef.current)
                            const inferredOpponentAbility = inferAnnouncementAbility(
                                previousInventories[opponentPiece] ?? [],
                                nextOnlineInventories[opponentPiece] ?? [],
                            )

                            if (inferredOpponentAbility) {
                                showSkillAnnouncement(opponentPiece, inferredOpponentAbility)
                            }
                        }

                        previousOnlineInventoriesRef.current = nextOnlineInventories
                    }
                }

                if (data?.type === 'error' && data?.payload?.message) {
                    setOnlineStatusMessage(data.payload.message)
                    showAbilityError(data.payload.message)
                    pendingOnlineSkillRef.current = null
                }

                if (data?.type === 'chat_message' && data?.payload) {
                    const sender = data.payload.sender || '?'
                    const message = data.payload.message || ''
                    setChatMessages(prev => [...prev, { sender, message }])
                }
            } catch {
                // ignore malformed websocket payloads
            }
        }

        ws.onclose = () => {
            setOnlineStatusMessage('Conexion cerrada')
        }

        return () => {
            ws.close()
            onlineWsRef.current = null
            pendingOnlineSkillRef.current = null
        }
        // Solo depende de datos estables: si gameId o localPiece cambian se reconecta correctamente,
        // pero localPiece ya no causa re-montados porque se lee via localPieceRef en los handlers.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnlineMatch, matchData?.gameId])

    useEffect(() => {
        if (isOnlineMatch || isAiMatch) {
            return
        }

        if (gameOver) {
            return
        }

        if (skipTurns[currentTurn] > 0) {
            setSkipTurns(prev => ({ ...prev, [currentTurn]: prev[currentTurn] - 1 }))
            setPendingAbility(null)
            setSystemMessage(`${playerNameByPiece(currentTurn)} pierde este turno.`)
            setCurrentTurn(getOpponent(currentTurn))
            return
        }

        const currentHasActions = getValidMoves(board, currentTurn).size > 0
        const opponent = getOpponent(currentTurn)
        const opponentHasActions = getValidMoves(board, opponent).size > 0

        if (!currentHasActions && !opponentHasActions) {
            setGameOver(true)
            setPendingAbility(null)
            setSystemMessage('Partida terminada: no hay acciones disponibles.')
            return
        }

        if (!currentHasActions && opponentHasActions) {
            setPendingAbility(null)
            setSystemMessage(`${playerNameByPiece(currentTurn)} no tiene acciones. Turno perdido.`)
            setCurrentTurn(opponent)
        }
    }, [board, currentTurn, gameOver, inventories, isOnlineMatch, skipTurns])

    useEffect(() => {
        if (isOnlineMatch || isAiMatch) {
            return
        }

        if (!gameOver || hasPersistedRank) {
            return
        }

        const nextElo = Math.max(0, currentUserElo + rrDelta)
        setHasPersistedRank(true)

        if (nextElo === currentUserElo) {
            return
        }

        let cancelled = false

        const persistRank = async () => {
            try {
                const updatedUser = await api.users.updateElo(nextElo)
                if (!cancelled) {
                    setCurrentUserElo(updatedUser.elo ?? nextElo)
                }
            } catch {
                if (!cancelled) {
                    setCurrentUserElo(nextElo)
                }
            }
        }

        persistRank()

        return () => {
            cancelled = true
        }
    }, [currentUserElo, gameOver, hasPersistedRank, isAiMatch, isOnlineMatch, rrDelta])

    useEffect(() => {
        if (isOnlineMatch || isAiMatch) {
            return
        }

        if (!gameOver || hasPersistedHistory) {
            return
        }

        setHasPersistedHistory(true)

        let cancelled = false

        const persistHistory = async () => {
            try {
                await api.users.saveHistory({
                    opponent_name: opponentProfile.name,
                    mode: '1vs1',
                    result: winnerInfo.isDraw ? 'Empate' : winnerInfo.playerWon ? 'Ganada' : 'Perdida',
                    score: `${finalScore.black}-${finalScore.white} pts`,
                    rankChange: `${rrDelta >= 0 ? '+' : ''}${rrDelta} RR`,
                })
            } catch (error) {
                if (!cancelled) {
                    console.error('Error al guardar historial de partida', error)
                }
            }
        }

        persistHistory()

        return () => {
            cancelled = true
        }
    }, [
        finalScore.black,
        finalScore.white,
        gameOver,
        hasPersistedHistory,
        isAiMatch,
        isOnlineMatch,
        opponentProfile.name,
        rrDelta,
        winnerInfo.isDraw,
        winnerInfo.playerWon,
    ])

    const applyQuestionReward = (
        row: number,
        col: number,
        player: Piece,
        nextQuestions: Set<string>,
        nextInventories: Record<Piece, AbilityId[]>,
    ) => {
        const key = `${row}-${col}`
        if (!ENABLE_SPECIAL_MECHANICS_1V1 || !nextQuestions.has(key)) {
            return ''
        }

        nextQuestions.delete(key)
        const reward = ABILITY_POOL[randomInt(ABILITY_POOL.length)]
        nextInventories[player] = [...nextInventories[player], reward]
        return `${playerNameByPiece(player)} obtuvo habilidad: ${getAbilityDisplayName(reward)}.`
    }

    const finishAction = (
        nextBoard: BoardCell[][],
        nextQuestions: Set<string>,
        nextInventories: Record<Piece, AbilityId[]>,
        nextSkipTurns: Record<Piece, number>,
        actionMessage: string,
    ) => {
        setBoard(nextBoard)
        setQuestionCells(nextQuestions)
        setInventories(nextInventories)
        setSkipTurns(nextSkipTurns)
        setPendingAbility(null)
        setSystemMessage(actionMessage)
        setCurrentTurn(getOpponent(currentTurn))
    }

    const useInstantAbility = (ability: AbilityId, inventoryIndex: number) => {
        if (isOnlineMatch) {
            if (!onlineWsRef.current || onlineWsRef.current.readyState !== WebSocket.OPEN) return
            if (currentTurn !== playerProfile.piece) return

            pendingOnlineSkillRef.current = { actor: playerProfile.piece, ability }
            onlineWsRef.current.send(JSON.stringify({
                action: 'use_skill',
                type: ability,
                target_player: opponentProfile.piece,
                inventory_index: inventoryIndex
            }))
            return
        }

        const player = currentTurn
        const opponent = getOpponent(player)
        const nextBoard = cloneBoard(board)
        const nextQuestions = new Set(questionCells)
        const nextInventories: Record<Piece, AbilityId[]> = {
            black: [...inventories.black],
            white: [...inventories.white],
        }
        const nextSkipTurns: Record<Piece, number> = {
            black: skipTurns.black,
            white: skipTurns.white,
        }

        nextInventories[player].splice(inventoryIndex, 1)

        let message = `${playerNameByPiece(player)} usó ${getAbilityDisplayName(ability)}.`

        if (ability === 'skip_rival') {
            nextSkipTurns[opponent] += 1
            message = `${playerNameByPiece(player)} hará que ${playerNameByPiece(opponent)} pierda su próximo turno.`
        }

        if (ability === 'steal_skill') {
            if (nextInventories[opponent].length > 0) {
                const stolenIndex = randomInt(nextInventories[opponent].length)
                const [stolen] = nextInventories[opponent].splice(stolenIndex, 1)
                nextInventories[player].push(stolen)
                message = `${playerNameByPiece(player)} robó una habilidad al rival.`
            } else {
                message = 'No se pudo robar habilidad: el rival no tiene.'
            }
        }

        if (ability === 'exchange_skill') {
            if (nextInventories[player].length > 0 && nextInventories[opponent].length > 0) {
                const playerIndex = randomInt(nextInventories[player].length)
                const opponentIndex = randomInt(nextInventories[opponent].length)
                const playerAbility = nextInventories[player][playerIndex]
                nextInventories[player][playerIndex] = nextInventories[opponent][opponentIndex]
                nextInventories[opponent][opponentIndex] = playerAbility
                message = 'Se intercambió una habilidad al azar entre ambos jugadores.'
            } else {
                message = 'No se pudo intercambiar: faltan habilidades en alguno de los jugadores.'
            }
        }

        if (ability === 'give_skill') {
            if (nextInventories[player].length > 0) {
                const giveIndex = randomInt(nextInventories[player].length)
                const [given] = nextInventories[player].splice(giveIndex, 1)
                nextInventories[opponent].push(given)
                message = `${playerNameByPiece(player)} entregó una habilidad al rival.`
            } else {
                message = 'No había otra habilidad para entregar.'
            }
        }

        if (ability === 'swap_colors') {
            for (let row = 0; row < BOARD_SIZE; row += 1) {
                for (let col = 0; col < BOARD_SIZE; col += 1) {
                    const piece = nextBoard[row][col].piece
                    if (piece === 'black') nextBoard[row][col].piece = 'white'
                    if (piece === 'white') nextBoard[row][col].piece = 'black'
                }
            }
            message = 'Los colores de todas las fichas del tablero se invirtieron.'
        }

        if (ability === 'lose_turn') {
            nextSkipTurns[player] += 1
            message = `${playerNameByPiece(player)} perdera su proximo turno.`
        }

        if (ability === 'gravity_up') {
            const { board: gravityBoard, questionCells: gravityQuestions } = applyGravity(nextBoard, 'up', nextQuestions)
            showSkillAnnouncement(player, 'gravity', 'up')
            finishAction(gravityBoard, gravityQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia arriba.')
            return
        }

        if (ability === 'gravity_down') {
            const { board: gravityBoard, questionCells: gravityQuestions } = applyGravity(nextBoard, 'down', nextQuestions)
            showSkillAnnouncement(player, 'gravity', 'down')
            finishAction(gravityBoard, gravityQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia abajo.')
            return
        }

        if (ability === 'gravity_left') {
            const { board: gravityBoard, questionCells: gravityQuestions } = applyGravity(nextBoard, 'left', nextQuestions)
            showSkillAnnouncement(player, 'gravity', 'left')
            finishAction(gravityBoard, gravityQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia la izquierda.')
            return
        }

        if (ability === 'gravity_right') {
            const { board: gravityBoard, questionCells: gravityQuestions } = applyGravity(nextBoard, 'right', nextQuestions)
            showSkillAnnouncement(player, 'gravity', 'right')
            finishAction(gravityBoard, gravityQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia la derecha.')
            return
        }

        showSkillAnnouncement(player, ability)
        finishAction(nextBoard, nextQuestions, nextInventories, nextSkipTurns, message)
    }

    const resolveTargetAbility = (row: number, col: number) => {
        if (!pendingAbility) {
            return
        }

        if (isOnlineMatch) {
            // This is already handled in handleCellClick now
            return
        }

        const player = currentTurn
        const opponent = getOpponent(player)
        const ability = pendingAbility.id

        const nextBoard = cloneBoard(board)
        const nextQuestions = new Set(questionCells)
        const nextInventories: Record<Piece, AbilityId[]> = {
            black: [...inventories.black],
            white: [...inventories.white],
        }
        const nextSkipTurns: Record<Piece, number> = {
            black: skipTurns.black,
            white: skipTurns.white,
        }
        const inventoryIndex = pendingAbility.inventoryIndex

        const targetCell = nextBoard[row][col]
        let validTarget = false
        let message = `${playerNameByPiece(player)} usó ${getAbilityDisplayName(ability)}.`

        if (ability === 'bomb') {
            validTarget = targetCell.piece !== null && !targetCell.fixed
            if (validTarget) {
                if (!canApplyBombKeepingBothColors(nextBoard, row, col)) {
                    showAbilityError('No puedes usar Bomba 3x3 aqui: debe quedar al menos una ficha de cada color.')
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
                message = 'Bomba aplicada en un area de 3x3.'
            }
        }

        if (ability === 'fix_piece') {
            validTarget = targetCell.piece === null
            if (validTarget) {
                targetCell.piece = player
                targetCell.fixed = true
                const rewardText = applyQuestionReward(row, col, player, nextQuestions, nextInventories)
                message = rewardText || 'Se coloco una ficha fija.'
            }
        }

        if (ability === 'unfix_piece') {
            validTarget = targetCell.piece !== null && targetCell.fixed
            if (validTarget) {
                targetCell.piece = null
                targetCell.fixed = false
                message = 'Se elimino una ficha fija.'
            }
        }

        if (ability === 'flip_rival') {
            validTarget = targetCell.piece === opponent && !targetCell.fixed
            if (validTarget) {
                targetCell.piece = player
                message = 'Se giro una ficha rival a tu color.'
            }
        }

        if (ability === 'place_free') {
            validTarget = targetCell.piece === null
            if (validTarget) {
                targetCell.piece = player
                const rewardText = applyQuestionReward(row, col, player, nextQuestions, nextInventories)
                message = rewardText || 'Se coloco una ficha sin restricciones.'
            }
        }

        if (!validTarget) {
            showAbilityError(`No puedes usar ${getAbilityDisplayName(ability)} sobre esa casilla.`)
            return
        }

        nextInventories[player].splice(inventoryIndex, 1)
        showSkillAnnouncement(player, ability)
        finishAction(nextBoard, nextQuestions, nextInventories, nextSkipTurns, message)
    }

    const handleUseAbility = (ability: AbilityId, inventoryIndex: number) => {
        if (!ENABLE_SPECIAL_MECHANICS_1V1 || gameOver || currentTurn !== playerProfile.piece) {
            return
        }

        if (pendingAbility?.inventoryIndex === inventoryIndex) {
            setPendingAbility(null)
            return
        }

        if (ABILITY_META[ability].needsTarget) {
            setPendingAbility({ id: ability, inventoryIndex })
            setSystemMessage(`Selecciona casilla para ${getAbilityDisplayName(ability)}.`)
            return
        }

        if (ability === 'gravity') {
            setSelectingGravityDirection({ inventoryIndex })
            setSystemMessage('Selecciona direccion para la gravedad.')
            return
        }

        useInstantAbility(ability, inventoryIndex)
    }

    const handleCellClick = (row: number, col: number) => {
        if (gameOver) {
            return
        }

        if (isOnlineMatch) {
            if (pendingAbility) {
                // Use skill instead of make_move
                if (!onlineWsRef.current || onlineWsRef.current.readyState !== WebSocket.OPEN) return
                if (currentTurn !== playerProfile.piece) return

                pendingOnlineSkillRef.current = { actor: playerProfile.piece, ability: pendingAbility.id }
                onlineWsRef.current.send(JSON.stringify({
                    action: 'use_skill',
                    type: pendingAbility.id,
                    row,
                    col,
                    target_player: opponentProfile.piece, // Default target
                    inventory_index: pendingAbility.inventoryIndex
                }))
                setPendingAbility(null)
                return
            }

            const key = `${row}-${col}`
            if (!validMoves.has(key)) return
            if (!onlineWsRef.current || onlineWsRef.current.readyState !== WebSocket.OPEN) return
            if (currentTurn !== playerProfile.piece) return

            onlineWsRef.current.send(JSON.stringify({
                action: 'make_move',
                player: playerProfile.piece,
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
        if (!validMoves.has(key)) {
            return
        }

        const flips = getFlips(board, row, col, currentTurn)
        if (flips.length === 0) {
            return
        }

        const nextBoard = cloneBoard(board)
        const nextQuestions = new Set(questionCells)
        const nextInventories: Record<Piece, AbilityId[]> = {
            black: [...inventories.black],
            white: [...inventories.white],
        }
        const nextSkipTurns: Record<Piece, number> = {
            black: skipTurns.black,
            white: skipTurns.white,
        }

        nextBoard[row][col].piece = currentTurn
        flips.forEach(([flipRow, flipCol]) => {
            nextBoard[flipRow][flipCol].piece = currentTurn
        })

        const rewardText = applyQuestionReward(row, col, currentTurn, nextQuestions, nextInventories)
        const actionMessage = rewardText || `${playerNameByPiece(currentTurn)} realizo un movimiento.`
        finishAction(nextBoard, nextQuestions, nextInventories, nextSkipTurns, actionMessage)
    }

    const handleAttemptLeave = () => {
        if (gameOver) {
            onNavigate(postGameScreen)
            return
        }

        setShowLeaveConfirm(true)
    }

    const handleConfirmLeave = async () => {
        if (isAbandoning) {
            return
        }

        if (isAiMatch) {
            if (onlineWsRef.current) {
                onlineWsRef.current.close()
                onlineWsRef.current = null
            }
            setShowLeaveConfirm(false)
            onNavigate(postGameScreen)
            return
        }

        if (isOnlineMatch) {
            if (onlineWsRef.current && onlineWsRef.current.readyState === WebSocket.OPEN) {
                onlineWsRef.current.send(JSON.stringify({
                    action: 'surrender',
                    player: playerProfile.piece,
                }))
            }
            setShowLeaveConfirm(false)
            onNavigate(postGameScreen)
            return
        }

        setIsAbandoning(true)

        const nextElo = Math.max(0, currentUserElo + abandonmentPenalty)

        try {
            const updatedUser = await api.users.updateElo(nextElo)
            setCurrentUserElo(updatedUser.elo ?? nextElo)
        } catch {
            setCurrentUserElo(nextElo)
        }

        try {
            await api.users.saveHistory({
                opponent_name: opponentProfile.name,
                mode: '1vs1',
                result: 'Perdida',
                score: `${rawScore.black}-${rawScore.white} pts`,
                rankChange: `${abandonmentPenalty} RR`,
            })
        } catch (error) {
            console.error('Error al guardar abandono de partida', error)
        }

        setShowLeaveConfirm(false)
        onNavigate(postGameScreen)
    }

    const handleAttemptPause = () => {
        setShowPauseConfirm(true)
    }

    const handleConfirmPause = () => {
        if (onlineWsRef.current && onlineWsRef.current.readyState === WebSocket.OPEN) {
            onlineWsRef.current.send(JSON.stringify({ action: 'pause' }))
            onNavigate('friends')
        } else {
            setShowPauseConfirm(false)
        }
    }

    const handleSendChat = (message: string) => {
        if (isAiMatch) {
            return
        }

        if (onlineWsRef.current && onlineWsRef.current.readyState === WebSocket.OPEN) {
            onlineWsRef.current.send(JSON.stringify({
                action: 'chat',
                message
            }))
        } else {
            setChatMessages(prev => [...prev, { sender: playerProfile.name, message }])
        }
    }

    const turnColorLabel = currentTurn === playerProfile.piece ? playerProfile.color : opponentProfile.color
    const turnLabel =
        gameOver
            ? 'Partida finalizada'
            : `${playerNameByPiece(currentTurn)} (${turnColorLabel})`

    const playerScoreRaw = playerProfile.piece === 'black' ? rawScore.black : rawScore.white
    const opponentScoreRaw = playerProfile.piece === 'black' ? rawScore.white : rawScore.black
    const playerScoreFinal = playerProfile.piece === 'black' ? finalScore.black : finalScore.white
    const opponentScoreFinal = playerProfile.piece === 'black' ? finalScore.white : finalScore.black

    const renderSkillCard = (
        ability: AbilityId,
        index: number,
        owner: Piece,
        onUse: (ability: AbilityId, inventoryIndex: number) => void,
        forceDisabled?: boolean,
    ) => {
        const skillKey = `${owner}-${ability}-${index}`
        const isExpanded = expandedSkillKey === skillKey
        const isActive = !forceDisabled && pendingAbility?.inventoryIndex === index && currentTurn === owner
        const meta = ABILITY_META[ability] || { icon: '❓', name: 'Desconocida', needsTarget: false }
        const displayName = getAbilityDisplayName(ability)
        const description = ABILITY_DESCRIPTIONS[ability] || 'Sin descripcion disponible.'

        return (
            <div
                key={skillKey}
                className={`duel__skill-card ${isActive ? 'duel__skill-card--active' : ''} ${isExpanded ? 'duel__skill-card--expanded' : ''} ${forceDisabled ? 'duel__skill-card--opponent-view' : ''}`}
            >
                <button
                    className="duel__skill-main"
                    onClick={() => onUse(ability, index)}
                    type="button"
                    disabled={forceDisabled || gameOver || currentTurn !== owner}
                >
                    <span className="duel__skill-icon">{meta.icon}</span>
                    <div className="duel__skill-text">
                        <span className="duel__skill-name">{displayName}</span>
                    </div>
                </button>
                <button
                    className={`duel__skill-info-toggle ${isExpanded ? 'duel__skill-info-toggle--open' : ''}`}
                    type="button"
                    onClick={() => setExpandedSkillKey(current => (current === skillKey ? null : skillKey))}
                    aria-expanded={isExpanded}
                    aria-label={`Ver descripcion de ${displayName}`}
                >
                    Info
                </button>
                {isExpanded && (
                    <div className="duel__skill-description">
                        {description}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="duel">
            <img className="duel__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="duel__overlay" aria-hidden="true" />
            <h1 className="sr-only">Partida 1 contra 1</h1>
            {!gameOver && pausedUsernames.length > 0 && (
                <div className="duel__paused-status">
                    <p className="duel__paused-text">
                        Partida pausada: espera a que vuelva {pausedUsernames.join(', ')}.
                    </p>
                </div>
            )}
            {skillAnnouncement && (
                <div
                    className={`duel__skill-announcement duel__skill-announcement--${skillAnnouncement.tone} duel__skill-announcement--${skillAnnouncement.theme}`}
                    aria-live="polite"
                >
                    <span className="duel__skill-announcement-icon">{skillAnnouncement.icon}</span>
                    <div className="duel__skill-announcement-copy">
                        <span className="duel__skill-announcement-actor">{skillAnnouncement.actorLabel}</span>
                        <span className="duel__skill-announcement-name">{skillAnnouncement.abilityLabel}</span>
                    </div>
                </div>
            )}
            {abilityError && (
                <div className="duel__ability-error" aria-live="assertive" role="alert">
                    {abilityError}
                </div>
            )}
            <div
                className="duel__container"
                style={{
                    '--duel-frame-image': `url(${activeTheme.frame})`,
                    '--duel-board-background-image': `url(${activeTheme.boardBackground})`,
                    '--duel-question-image': `url(${activeTheme.questionCell})`,
                } as CSSProperties}
            >
                <main className="duel__layout">
                    <aside className="duel__chat-column">
                        {isAiMatch ? (
                            <div className="duel__chat-placeholder">Chat desactivado en partida contra IA.</div>
                        ) : (
                            <InGameChat
                                messages={chatMessages}
                                myUsername={playerProfile.name}
                                onSend={handleSendChat}
                                mode="panel"
                            />
                        )}
                    </aside>

                    <section className="duel__board-column">
                        <header className="duel__center-info">
                            <span className="duel__turn-label">Turno actual</span>
                            <span className="duel__turn-value">{turnLabel}</span>
                            <span className="duel__turn-state">
                                {isOnlineMatch ? (onlineStatusMessage || 'Partida online en curso') : systemMessage}
                            </span>

                            {(pendingAbility || selectingGravityDirection) && (
                                <div className="duel__ability-pending-bar">
                                    <span className="duel__ability-pending-text">
                                        {pendingAbility
                                            ? `Usando: ${getAbilityDisplayName(pendingAbility.id)}`
                                            : 'Selecciona direccion de gravedad'}
                                    </span>
                                    <button
                                        className="duel__ability-cancel-btn"
                                        type="button"
                                        onClick={() => {
                                            setPendingAbility(null)
                                            setSelectingGravityDirection(null)
                                            setSystemMessage('Accion cancelada.')
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            {selectingGravityDirection && (
                                <div className="duel__gravity-direction-picker">
                                    {(['up', 'down', 'left', 'right'] as const).map((dir) => (
                                        <button
                                            key={dir}
                                            className={`duel__gravity-btn duel__gravity-btn--${dir}`}
                                            type="button"
                                            onClick={() => {
                                                const { inventoryIndex } = selectingGravityDirection
                                                if (isOnlineMatch) {
                                                    if (onlineWsRef.current?.readyState === WebSocket.OPEN) {
                                                        pendingOnlineSkillRef.current = { actor: playerProfile.piece, ability: 'gravity', direction: dir }
                                                        onlineWsRef.current.send(JSON.stringify({
                                                            action: 'use_skill',
                                                            type: 'gravity',
                                                            direction: dir,
                                                            inventory_index: inventoryIndex
                                                        }))
                                                    }
                                                } else {
                                                    const { board: nextBoard, questionCells: nextQuestions } = applyGravity(board, dir, questionCells)
                                                    const nextInventories = JSON.parse(JSON.stringify(inventories))
                                                    nextInventories[currentTurn].splice(inventoryIndex, 1)
                                                    showSkillAnnouncement(currentTurn, 'gravity', dir)
                                                    finishAction(nextBoard, nextQuestions, nextInventories, skipTurns, `Gravedad aplicada hacia ${dir}`)
                                                }
                                                setSelectingGravityDirection(null)
                                            }}
                                        >
                                            {dir === 'up' ? 'Arriba' : dir === 'down' ? 'Abajo' : dir === 'left' ? 'Izq' : 'Der'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </header>

                        <div className="duel__board-area">
                            <div
                                className="duel__board"
                                style={{ backgroundImage: `url(${activeTheme.board})` }}
                            >
                                {Array.from({ length: 64 }).map((_, index) => {
                                    const row = Math.floor(index / BOARD_SIZE)
                                    const col = index % BOARD_SIZE
                                    const key = `${row}-${col}`
                                    const cell = board[row][col]
                                    const hasQuestion = ENABLE_SPECIAL_MECHANICS_1V1 && questionCells.has(key)
                                    const canShowPlayableMove = !isOnlineMatch || currentTurn === playerProfile.piece
                                    const isPlayable = !pendingAbility && validMoves.has(key) && !gameOver && canShowPlayableMove

                                    return (
                                        <button
                                            key={key}
                                            className={`duel__cell ${(row + col) % 2 === 0 ? 'duel__cell--dark' : 'duel__cell--light'} ${isPlayable ? 'duel__cell--playable' : ''} ${hasQuestion ? 'duel__cell--question' : ''}`}
                                            onClick={() => handleCellClick(row, col)}
                                            disabled={gameOver || pausedUsernames.length > 0}
                                            type="button"
                                            aria-label={`Casilla ${row + 1}-${col + 1}`}
                                            tabIndex={isPlayable ? 0 : -1}
                                        >
                                            {hasQuestion && <span className="duel__question" aria-hidden="true" />}
                                            {cell.piece && (
                                                <>
                                                    <span
                                                        className={`duel-piece ${cell.piece === 'black' ? 'duel-piece--black' : 'duel-piece--white'} ${cell.fixed ? 'duel-piece--fixed' : ''}`}
                                                        style={{
                                                            background: cell.piece === 'black'
                                                                ? selectedPieceStyle1v1.sideA
                                                                : selectedPieceStyle1v1.sideB,
                                                        }}
                                                    />
                                                    {cell.fixed && <span className="duel-piece-lock">{'\u{1F512}'}</span>}
                                                </>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    <aside className="duel__info-column">
                        <div className="duel__actions">
                            {isOnlineMatch && matchData?.returnTo === 'friends' && (
                                <button type="button" className="duel__pause-btn" onClick={handleAttemptPause}>
                                    Pausar
                                </button>
                            )}
                            <button
                                type="button"
                                className="duel__leave-btn duel__leave-btn--image"
                                onClick={handleAttemptLeave}
                                aria-label="Abandonar partida"
                            >
                                <img src={leaveRoomButtonImage} alt="" aria-hidden="true" />
                            </button>
                        </div>

                        <div className={`duel__player-card duel__player-card--opponent ${currentTurn === opponentProfile.piece && !gameOver ? 'duel__player-card--active' : ''} ${pausedUsernames.includes(opponentProfile.name) ? 'duel__panel--paused' : ''}`}>
                            <img
                                className="duel__avatar"
                                src={resolveUserAvatar(matchData?.opponentAvatarUrl, opponentProfile.name)}
                                alt={`Avatar de ${opponentProfile.name}`}
                            />
                            <div className="duel__player-data">
                                <span className="duel__player-row">
                                    <span className="duel__name">{opponentProfile.name}</span>
                                    <span className="duel__player-score">{opponentScoreRaw} pts</span>
                                </span>
                                <span className="duel__meta">{opponentProfile.color}</span>
                            </div>
                        </div>

                        <div className={`duel__player-card duel__player-card--self ${currentTurn === playerProfile.piece && !gameOver ? 'duel__player-card--active' : ''} ${pausedUsernames.includes(playerProfile.name) ? 'duel__panel--paused' : ''}`}>
                            <img
                                className="duel__avatar"
                                src={resolveUserAvatar(currentUserAvatar ?? matchData?.playerAvatarUrl, playerProfile.name)}
                                alt={`Avatar de ${playerProfile.name}`}
                            />
                            <div className="duel__player-data">
                                <span className="duel__player-row">
                                    <span className="duel__name">{playerProfile.name}</span>
                                    <span className="duel__player-score">{playerScoreRaw} pts</span>
                                </span>
                                <span className="duel__meta">{playerProfile.color}</span>
                            </div>
                        </div>

                        {ENABLE_SPECIAL_MECHANICS_1V1 && (
                            <div className="duel__skills duel__skills--slot">
                                {inventories[playerProfile.piece].length === 0 && <span className="duel__empty-skills">Sin habilidades</span>}
                                {inventories[playerProfile.piece].map((ability, index) =>
                                    renderSkillCard(ability, index, playerProfile.piece, handleUseAbility)
                                )}
                            </div>
                        )}
                    </aside>
                </main>
            </div>

            <Modal
                isOpen={gameOver}
                onClose={() => onNavigate(postGameScreen)}
                maxWidth="560px"
                showCloseButton={false}
                ariaLabelledBy="duel-result-title"
            >
                <div className="duel-result">
                    <div className="duel-result__top">
                        <h2 className="duel-result__title" id="duel-result-title">Partida finalizada</h2>
                        <p className={`duel-result__rr duel-result__rr--badge ${rrDelta > 0 ? 'duel-result__rr--up' : rrDelta < 0 ? 'duel-result__rr--down' : 'duel-result__rr--neutral'}`}>
                            {`${rrDelta >= 0 ? '+' : ''}${rrDelta} RR`}
                        </p>
                    </div>
                    <p className={`duel-result__status ${winnerInfo.playerWon ? 'duel-result__status--win' : winnerInfo.isDraw ? 'duel-result__status--draw' : 'duel-result__status--lose'}`}>
                        {winnerInfo.isDraw ? 'Empate' : winnerInfo.playerWon ? 'Has ganado' : 'Has perdido'}
                    </p>

                    <div className="duel-result__scores">
                        <div className="duel-result__row">
                            <span>{playerProfile.name}</span>
                            <span>{playerScoreRaw} - {(playerProfile.piece === 'black' ? penaltyScore.black : penaltyScore.white)} = {playerScoreFinal} pts</span>
                        </div>
                        <div className="duel-result__row">
                            <span>{opponentProfile.name}</span>
                            <span>{opponentScoreRaw} - {(opponentProfile.piece === 'black' ? penaltyScore.black : penaltyScore.white)} = {opponentScoreFinal} pts</span>
                        </div>
                    </div>

                    {ENABLE_SPECIAL_MECHANICS_1V1 && (
                        <p className="duel-result__note">
                            Penalización aplicada: -{ABILITY_PENALTY} pts por cada habilidad sin gastar.
                        </p>
                    )}

                    <button type="button" className="duel-result__back-btn" onClick={() => onNavigate(postGameScreen)}>
                        {matchData?.returnTo === 'online-game' ? 'Volver a partidas' : isOnlineMatch ? 'Volver a amigos' : 'Volver al menú'}
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={showLeaveConfirm}
                onClose={() => setShowLeaveConfirm(false)}
                maxWidth="520px"
                ariaLabelledBy="duel-leave-confirm-title"
            >
                <div className="duel-leave-confirm">
                    <h2 className="duel-leave-confirm__title" id="duel-leave-confirm-title">Abandonar partida</h2>
                    <p className="duel-modal__text">
                        {isAiMatch
                            ? "Si abandonas esta partida contra la IA, no se contara como una derrota y no perderas puntos RR."
                            : pausedUsernames.length > 0
                                ? "Como la partida está pausada por el otro jugador, si abandonas ahora no perderás RR y la partida quedará invalidada."
                                : "Si abandonas esta partida en curso, se contará como una derrota en tu historial y perderás puntos RR."
                        }
                    </p>
                    <div className="duel-leave-confirm__actions">
                        <button
                            className="duel-leave-confirm__btn duel-leave-confirm__btn--cancel"
                            onClick={() => setShowLeaveConfirm(false)}
                            disabled={isAbandoning}
                        >
                            Seguir jugando
                        </button>
                        <button
                            className="duel-leave-confirm__btn duel-leave-confirm__btn--confirm"
                            onClick={handleConfirmLeave}
                            disabled={isAbandoning}
                        >
                            {isAbandoning ? 'Abandonando...' : 'Abandonar partida'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showPauseConfirm}
                onClose={() => setShowPauseConfirm(false)}
                maxWidth="520px"
                ariaLabelledBy="duel-pause-confirm-title"
            >
                <div className="duel-leave-confirm">
                    <h2 className="duel-leave-confirm__title" id="duel-pause-confirm-title">Pausar partida</h2>
                    <p className="duel-leave-confirm__text">
                        ¿Estás seguro de que quieres pausar la partida? Podrás reanudarla en cualquier momento desde la sección de Amigos.
                    </p>
                    <div className="duel-leave-confirm__actions">
                        <button
                            className="duel-leave-confirm__btn duel-leave-confirm__btn--cancel"
                            onClick={() => setShowPauseConfirm(false)}
                        >
                            Volver al juego
                        </button>
                        <button
                            className="duel-leave-confirm__btn duel-leave-confirm__btn--confirm"
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

export default GameBoard1v1


