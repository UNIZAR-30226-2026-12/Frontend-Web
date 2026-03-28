import '../styles/background.css'
import '../styles/pages/GameBoard1v1.css'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../components/Modal'
import { api, WS_BASE_URL } from '../services/api'
import { PIECE_STYLES_1V1, decodePiecePreference } from '../config/pieceStyles'
import { resolveUserAvatar } from '../config/avatarOptions'
import fireBoard from '../assets/arenas/fireboard.png'
import iceBoard from '../assets/arenas/iceboard.png'
import woodBoard from '../assets/arenas/woodboard.png'
import quartzBoard from '../assets/arenas/quartzboard.png'
import fireBackground from '../assets/arenas/firebackground.png'
import iceBackground from '../assets/arenas/icebackground.png'
import woodBackground from '../assets/arenas/woodbackground.png'
import quartzBackground from '../assets/arenas/quartzbackground.png'

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
}

type Piece = 'black' | 'white'
type AbilityId =
    | 'bomb'
    | 'place_fixed'
    | 'remove_fixed'
    | 'flip_enemy'
    | 'place_anywhere'
    | 'skip_rival_turn'
    | 'steal_random_ability'
    | 'swap_random_ability'
    | 'give_random_ability'
    | 'swap_colors'
    | 'lose_turn'
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

const BOARD_SIZE = 8
const QUESTION_COUNT = 8
const ABILITY_PENALTY = 2
const ENABLE_SPECIAL_MECHANICS_1V1 = false

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

const ABILITY_META: Record<AbilityId, { name: string; icon: string; needsTarget: boolean }> = {
    bomb: { name: 'Bomba', icon: 'B', needsTarget: true },
    place_fixed: { name: 'Poner ficha fija', icon: 'F+', needsTarget: true },
    remove_fixed: { name: 'Quitar ficha fija', icon: 'F-', needsTarget: true },
    flip_enemy: { name: 'Girar ficha rival', icon: 'G', needsTarget: true },
    place_anywhere: { name: 'Poner ficha libre', icon: '+', needsTarget: true },
    skip_rival_turn: { name: 'Saltar turno rival', icon: '>>', needsTarget: false },
    steal_random_ability: { name: 'Robar habilidad', icon: 'R', needsTarget: false },
    swap_random_ability: { name: 'Intercambiar habilidad', icon: '<>', needsTarget: false },
    give_random_ability: { name: 'Dar habilidad', icon: 'D', needsTarget: false },
    swap_colors: { name: 'Cambiar colores', icon: 'C', needsTarget: false },
    lose_turn: { name: 'Pierdes un turno', icon: 'X', needsTarget: false },
    gravity_up: { name: 'Gravedad arriba', icon: '^', needsTarget: false },
    gravity_down: { name: 'Gravedad abajo', icon: 'v', needsTarget: false },
    gravity_left: { name: 'Gravedad izquierda', icon: '<', needsTarget: false },
    gravity_right: { name: 'Gravedad derecha', icon: '>', needsTarget: false },
}

const ABILITY_POOL = Object.keys(ABILITY_META) as AbilityId[]

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
]

const getOpponent = (piece: Piece): Piece => (piece === 'black' ? 'white' : 'black')

const isInsideBoard = (row: number, col: number) =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

const randomInt = (max: number) => Math.floor(Math.random() * max)

interface ArenaTheme {
    board: string
    background: string
}

const getArenaFromElo = (elo: number): ArenaTheme => {
    if (elo < 900) return { board: woodBoard, background: woodBackground }
    if (elo < 1100) return { board: quartzBoard, background: quartzBackground }
    if (elo < 1300) return { board: fireBoard, background: fireBackground }
    return { board: iceBoard, background: iceBackground }
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

function applyGravity(board: BoardCell[][], direction: 'up' | 'down' | 'left' | 'right') {
    const next = cloneBoard(board)

    const rebuildSegment = (coords: Array<[number, number]>, towardStart: boolean) => {
        const pieces = coords
            .map(([r, c]) => next[r][c].piece)
            .filter((piece): piece is Piece => piece !== null)

        coords.forEach(([r, c]) => {
            next[r][c].piece = null
        })

        if (towardStart) {
            pieces.forEach((piece, i) => {
                const [r, c] = coords[i]
                next[r][c].piece = piece
            })
            return
        }

        const reversed = [...pieces].reverse()
        reversed.forEach((piece, i) => {
            const [r, c] = coords[coords.length - 1 - i]
            next[r][c].piece = piece
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
                return
            }
            segment.push([r, c])
        })
        if (segment.length > 0) {
            rebuildSegment(segment, towardStart)
        }
    }

    if (direction === 'left' || direction === 'right') {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            const line = Array.from({ length: BOARD_SIZE }, (_, col) => [row, col] as [number, number])
            processLine(line, direction === 'left')
        }
    } else {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            const line = Array.from({ length: BOARD_SIZE }, (_, row) => [row, col] as [number, number])
            processLine(line, direction === 'up')
        }
    }

    return next
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
    const [hasPersistedRank, setHasPersistedRank] = useState(false)
    const [hasPersistedHistory, setHasPersistedHistory] = useState(false)
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [isAbandoning, setIsAbandoning] = useState(false)
    const playerPieceColorName = selectedPieceStyle1v1.sideAName
    const opponentPieceColorName = selectedPieceStyle1v1.sideBName

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
    const arenaTheme = getArenaFromElo(playerProfile.rr)

    const [board, setBoard] = useState<BoardCell[][]>(() => createInitialBoard())
    const [questionCells, setQuestionCells] = useState<Set<string>>(() =>
        ENABLE_SPECIAL_MECHANICS_1V1 ? createQuestionCells(createInitialBoard()) : new Set<string>(),
    )
    const [currentTurn, setCurrentTurn] = useState<Piece>('black')
    const [inventories, setInventories] = useState<Record<Piece, AbilityId[]>>({ black: [], white: [] })
    const [skipTurns, setSkipTurns] = useState<Record<Piece, number>>({ black: 0, white: 0 })
    const [pendingAbility, setPendingAbility] = useState<PendingAbility | null>(null)
    const [gameOver, setGameOver] = useState(false)
    const [, setSystemMessage] = useState('Haz una jugada o usa una habilidad.')
    const validMoves = useMemo(
        () => (isOnlineMatch ? onlineValidMoves : getValidMoves(board, currentTurn)),
        [board, currentTurn, isOnlineMatch, onlineValidMoves],
    )

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

    const rrDelta = winnerInfo.isDraw ? 0 : winnerInfo.playerWon ? 30 : -30
    const abandonmentPenalty = -30
    const postGameScreen = isOnlineMatch ? 'friends' : 'online-game'

    useEffect(() => {
        let isMounted = true

        const loadPieceStyle = async () => {
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

        loadPieceStyle()
        return () => {
            isMounted = false
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

        const mapServerBoard = (serverBoard: Array<Array<Piece>>) =>
            serverBoard.map(row => row.map(piece => ({ piece, fixed: false })))

        const wsUrl = `${WS_BASE_URL}/ws/play/${encodeURIComponent(matchData.gameId)}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(wsUrl)
        onlineWsRef.current = ws

        ws.onopen = () => setOnlineStatusMessage('Partida online conectada')

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data?.type === 'player_assignment' && (data?.payload?.color === 'black' || data?.payload?.color === 'white')) {
                    setLocalPiece(data.payload.color)
                }

                if (data?.type === 'waiting_for_player') {
                    setOnlineStatusMessage('Esperando al rival...')
                }

                if (data?.type === 'game_state_update' && data?.payload) {
                    const payload = data.payload
                    if (Array.isArray(payload.board)) {
                        setBoard(mapServerBoard(payload.board))
                    }
                    if (payload.current_player === 'black' || payload.current_player === 'white') {
                        setCurrentTurn(payload.current_player)
                    }
                    setGameOver(Boolean(payload.game_over))
                    setOnlineWinner(payload.winner === 'black' || payload.winner === 'white' ? payload.winner : null)
                    setOnlineValidMoves(new Set(
                        ((payload.valid_moves ?? []) as Array<{ row: number; col: number }>).map(move => `${move.row}-${move.col}`),
                    ))
                    if (payload.game_over) {
                        setOnlineStatusMessage('Partida finalizada')
                    } else if (payload.current_player === localPiece) {
                        setOnlineStatusMessage('Tu turno')
                    } else {
                        setOnlineStatusMessage('Turno del rival')
                    }
                }

                if (data?.type === 'error' && data?.payload?.message) {
                    setOnlineStatusMessage(data.payload.message)
                }
            } catch {
                // ignore malformed websocket payloads
            }
        }

        ws.onclose = () => {
            if (!gameOver) {
                setOnlineStatusMessage('Conexion cerrada')
            }
        }

        return () => {
            ws.close()
            onlineWsRef.current = null
        }
    }, [gameOver, isOnlineMatch, localPiece, matchData?.gameId])

    useEffect(() => {
        if (isOnlineMatch) {
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
        if (isOnlineMatch) {
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
    }, [currentUserElo, gameOver, hasPersistedRank, isOnlineMatch, rrDelta])

    useEffect(() => {
        if (isOnlineMatch) {
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
        return `${playerNameByPiece(player)} obtuvo habilidad: ${ABILITY_META[reward].name}.`
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

        let message = `${playerNameByPiece(player)} usó ${ABILITY_META[ability].name}.`

        if (ability === 'skip_rival_turn') {
            nextSkipTurns[opponent] += 1
            message = `${playerNameByPiece(player)} hará que ${playerNameByPiece(opponent)} pierda su próximo turno.`
        }

        if (ability === 'steal_random_ability') {
            if (nextInventories[opponent].length > 0) {
                const stolenIndex = randomInt(nextInventories[opponent].length)
                const [stolen] = nextInventories[opponent].splice(stolenIndex, 1)
                nextInventories[player].push(stolen)
                message = `${playerNameByPiece(player)} robó una habilidad al rival.`
            } else {
                message = 'No se pudo robar habilidad: el rival no tiene.'
            }
        }

        if (ability === 'swap_random_ability') {
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

        if (ability === 'give_random_ability') {
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
            const gravityBoard = applyGravity(nextBoard, 'up')
            finishAction(gravityBoard, nextQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia arriba.')
            return
        }

        if (ability === 'gravity_down') {
            const gravityBoard = applyGravity(nextBoard, 'down')
            finishAction(gravityBoard, nextQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia abajo.')
            return
        }

        if (ability === 'gravity_left') {
            const gravityBoard = applyGravity(nextBoard, 'left')
            finishAction(gravityBoard, nextQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia la izquierda.')
            return
        }

        if (ability === 'gravity_right') {
            const gravityBoard = applyGravity(nextBoard, 'right')
            finishAction(gravityBoard, nextQuestions, nextInventories, nextSkipTurns, 'Se aplico gravedad hacia la derecha.')
            return
        }

        finishAction(nextBoard, nextQuestions, nextInventories, nextSkipTurns, message)
    }

    const resolveTargetAbility = (row: number, col: number) => {
        if (!pendingAbility) {
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
        let message = `${playerNameByPiece(player)} usó ${ABILITY_META[ability].name}.`

        if (ability === 'bomb') {
            validTarget = targetCell.piece !== null && !targetCell.fixed
            if (validTarget) {
                if (!canApplyBombKeepingBothColors(nextBoard, row, col)) {
                    setSystemMessage('Bomba invalida: debe quedar al menos una ficha de cada color.')
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

        if (ability === 'place_fixed') {
            validTarget = targetCell.piece === null
            if (validTarget) {
                targetCell.piece = player
                targetCell.fixed = true
                const rewardText = applyQuestionReward(row, col, player, nextQuestions, nextInventories)
                message = rewardText || 'Se coloco una ficha fija.'
            }
        }

        if (ability === 'remove_fixed') {
            validTarget = targetCell.piece !== null && targetCell.fixed
            if (validTarget) {
                targetCell.piece = null
                targetCell.fixed = false
                message = 'Se elimino una ficha fija.'
            }
        }

        if (ability === 'flip_enemy') {
            validTarget = targetCell.piece === opponent && !targetCell.fixed
            if (validTarget) {
                targetCell.piece = player
                message = 'Se giro una ficha rival a tu color.'
            }
        }

        if (ability === 'place_anywhere') {
            validTarget = targetCell.piece === null
            if (validTarget) {
                targetCell.piece = player
                const rewardText = applyQuestionReward(row, col, player, nextQuestions, nextInventories)
                message = rewardText || 'Se coloco una ficha sin restricciones.'
            }
        }

        if (!validTarget) {
            setSystemMessage('Objetivo invalido para esa habilidad.')
            return
        }

        nextInventories[player].splice(inventoryIndex, 1)
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
            setSystemMessage(`Selecciona casilla para ${ABILITY_META[ability].name}.`)
            return
        }

        useInstantAbility(ability, inventoryIndex)
    }

    const handleOpponentUseAbility = (ability: AbilityId, inventoryIndex: number) => {
        if (!ENABLE_SPECIAL_MECHANICS_1V1 || gameOver || currentTurn !== opponentProfile.piece) {
            return
        }

        if (pendingAbility?.inventoryIndex === inventoryIndex) {
            setPendingAbility(null)
            return
        }

        if (ABILITY_META[ability].needsTarget) {
            setPendingAbility({ id: ability, inventoryIndex })
            setSystemMessage(`Selecciona casilla para ${ABILITY_META[ability].name}.`)
            return
        }

        useInstantAbility(ability, inventoryIndex)
    }

    const handleCellClick = (row: number, col: number) => {
        if (gameOver) {
            return
        }

        if (isOnlineMatch) {
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

        if (isOnlineMatch) {
            if (onlineWsRef.current && onlineWsRef.current.readyState === WebSocket.OPEN) {
                onlineWsRef.current.send(JSON.stringify({
                    action: 'surrender',
                    player: playerProfile.piece,
                }))
            }
            setShowLeaveConfirm(false)
            onNavigate('friends')
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

    const turnColorLabel = currentTurn === playerProfile.piece ? playerProfile.color : opponentProfile.color
    const turnLabel =
        gameOver
            ? 'Partida finalizada'
            : `${playerNameByPiece(currentTurn)} (${turnColorLabel})`

    const playerScoreRaw = playerProfile.piece === 'black' ? rawScore.black : rawScore.white
    const opponentScoreRaw = playerProfile.piece === 'black' ? rawScore.white : rawScore.black
    const playerScoreFinal = playerProfile.piece === 'black' ? finalScore.black : finalScore.white
    const opponentScoreFinal = playerProfile.piece === 'black' ? finalScore.white : finalScore.black

    return (
        <div className="duel">
            <div className="home__bg">
                <span className="home__chip home__chip--1">⚫</span>
                <span className="home__chip home__chip--2">⚪</span>
                <span className="home__chip home__chip--3">🔴</span>
                <span className="home__chip home__chip--4">🔵</span>
                <span className="home__chip home__chip--5">🟢</span>
                <span className="home__chip home__chip--6">🟡</span>
                <span className="home__chip home__chip--7">🟣</span>
                <span className="home__chip home__chip--8">🟠</span>
                <span className="home__chip home__chip--9">⚫</span>
                <span className="home__chip home__chip--10">⚪</span>
                <span className="home__chip home__chip--q1 home__chip--question">❓</span>
                <span className="home__chip home__chip--q2 home__chip--question">❓</span>
                <span className="home__chip home__chip--q3 home__chip--question">❓</span>
                <span className="home__chip home__chip--q4 home__chip--question">❓</span>
            </div>

            <div className="duel__container">
                <button className="duel__leave-btn duel__leave-btn--top" onClick={handleAttemptLeave}>
                    Abandonar partida
                </button>
                <header className="duel__header">
                    <div className="duel__center-info">
                        <span className="duel__turn-label">Turno actual</span>
                        <span className="duel__turn-value">{turnLabel}</span>
                        <div className="duel__timer">
                            {isOnlineMatch ? (onlineStatusMessage || 'Partida online en curso') : '1 accion por turno'}
                        </div>
                    </div>
                </header>

                <main className="duel__main">
                    <aside className={`duel__panel ${currentTurn === playerProfile.piece && !gameOver ? 'duel__panel--active' : ''}`}>
                        <div className="duel__player-card">
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
                            <>
                                <h2 className="duel__panel-title">Habilidades</h2>
                                <div className="duel__skills">
                                    {inventories[playerProfile.piece].length === 0 && <span className="duel__empty-skills">Sin habilidades</span>}
                                    {inventories[playerProfile.piece].map((ability, index) => (
                                        <button
                                            key={`${ability}-${index}-${playerProfile.piece}`}
                                            className={`duel__skill-card ${pendingAbility?.inventoryIndex === index && currentTurn === playerProfile.piece ? 'duel__skill-card--active' : ''}`}
                                            onClick={() => handleUseAbility(ability, index)}
                                            type="button"
                                            disabled={gameOver || currentTurn !== playerProfile.piece}
                                        >
                                            <span className="duel__skill-icon">{ABILITY_META[ability].icon}</span>
                                            <div className="duel__skill-text">
                                                <span className="duel__skill-name">{ABILITY_META[ability].name}</span>
                                                <span className="duel__skill-uses">1 uso</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </aside>

                    <section
                        className="duel__board-area"
                        style={{ '--duel-board-area-bg': `url(${arenaTheme.background})` } as CSSProperties}
                    >
                        <div
                            className="duel__board"
                            style={{ backgroundImage: `url(${arenaTheme.board})` }}
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
                                        disabled={gameOver}
                                        type="button"
                                    >
                                        {hasQuestion && <span className="duel__question">?</span>}
                                        {cell.piece && (
                                            <span
                                                className={`duel-piece ${cell.piece === 'black' ? 'duel-piece--black' : 'duel-piece--white'} ${cell.fixed ? 'duel-piece--fixed' : ''}`}
                                                style={{
                                                    background: cell.piece === 'black'
                                                        ? selectedPieceStyle1v1.sideA
                                                        : selectedPieceStyle1v1.sideB,
                                                }}
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <aside className={`duel__panel ${currentTurn === opponentProfile.piece && !gameOver ? 'duel__panel--active' : ''}`}>
                        <div className="duel__player-card">
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
                        {ENABLE_SPECIAL_MECHANICS_1V1 && (
                            <>
                                <h2 className="duel__panel-title">Habilidades</h2>
                                <div className="duel__skills">
                                    {inventories[opponentProfile.piece].length === 0 && <span className="duel__empty-skills">Sin habilidades</span>}
                                    {inventories[opponentProfile.piece].map((ability, index) => (
                                        <button
                                            key={`${ability}-${index}-${opponentProfile.piece}`}
                                            className={`duel__skill-card ${pendingAbility?.inventoryIndex === index && currentTurn === opponentProfile.piece ? 'duel__skill-card--active' : ''}`}
                                            onClick={() => handleOpponentUseAbility(ability, index)}
                                            type="button"
                                            disabled={gameOver || currentTurn !== opponentProfile.piece}
                                        >
                                            <span className="duel__skill-icon">{ABILITY_META[ability].icon}</span>
                                            <div className="duel__skill-text">
                                                <span className="duel__skill-name">{ABILITY_META[ability].name}</span>
                                                <span className="duel__skill-uses">1 uso</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </aside>
                </main>
            </div>

            <Modal isOpen={gameOver} onClose={() => onNavigate(postGameScreen)} maxWidth="560px" showCloseButton={false}>
                <div className="duel-result">
                    <div className="duel-result__top">
                        <h2 className="duel-result__title">Partida finalizada</h2>
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

                    <button className="duel-result__back-btn" onClick={() => onNavigate(postGameScreen)}>
                        {isOnlineMatch ? 'Volver a amigos' : 'Volver al menú'}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} maxWidth="520px">
                <div className="duel-leave-confirm">
                    <h2 className="duel-leave-confirm__title">Abandonar partida</h2>
                    <p className="duel-leave-confirm__text">
                        Si abandonas esta partida en curso, se contará como una derrota en tu historial y perderás puntos RR.
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
        </div>
    )
}

export default GameBoard1v1
