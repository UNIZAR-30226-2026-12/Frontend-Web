import '../styles/background.css'
import '../styles/pages/GameBoard1v1v1v1.css'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../components/Modal'
import { api, WS_BASE_URL } from '../services/api'
import { PIECE_STYLES_4P, decodePiecePreference } from '../config/pieceStyles'
import { resolveUserAvatar } from '../config/avatarOptions'
import fireBoard from '../assets/arenas/fireboard4players.png'
import iceBoard from '../assets/arenas/iceboard4players.png'
import woodBoard from '../assets/arenas/woodboard4players.png'
import quartzBoard from '../assets/arenas/quartzboard4players.png'
import fireBackground from '../assets/arenas/firebackground.png'
import iceBackground from '../assets/arenas/icebackground.png'
import woodBackground from '../assets/arenas/woodbackground.png'
import quartzBackground from '../assets/arenas/quartzbackground.png'

type Piece = 'black' | 'white' | 'red' | 'blue'
type BoardCell = Piece | null

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
}

interface ArenaTheme {
    board: string
    background: string
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
const PIECE_ORDER: Piece[] = ['black', 'white', 'red', 'blue']

const getArenaFromElo = (elo: number): ArenaTheme => {
    if (elo < 900) return { board: woodBoard, background: woodBackground }
    if (elo < 1100) return { board: quartzBoard, background: quartzBackground }
    if (elo < 1300) return { board: fireBoard, background: fireBackground }
    return { board: iceBoard, background: iceBackground }
}

const isInsideBoard = (row: number, col: number) =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
]

function createInitialBoard(): BoardCell[][] {
    const board = Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => null as BoardCell),
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
        board[startRow][startCol] = topLeft
        board[startRow][startCol + 1] = topRight
        board[startRow + 1][startCol] = bottomLeft
        board[startRow + 1][startCol + 1] = bottomRight
    }

    placeCluster(topRow, leftCol, 'black', 'white', 'red', 'blue')
    placeCluster(topRow, rightCol, 'white', 'black', 'blue', 'red')
    placeCluster(bottomRow, leftCol, 'red', 'blue', 'black', 'white')
    placeCluster(bottomRow, rightCol, 'blue', 'red', 'white', 'black')

    return board
}

function cloneBoard(board: BoardCell[][]) {
    return board.map(row => [...row])
}

function getFlips(board: BoardCell[][], row: number, col: number, piece: Piece) {
    if (board[row][col] !== null) {
        return [] as Array<[number, number]>
    }

    const flips: Array<[number, number]> = []

    DIRECTIONS.forEach(([dr, dc]) => {
        const line: Array<[number, number]> = []
        let r = row + dr
        let c = col + dc

        while (isInsideBoard(r, c)) {
            const cell = board[r][c]
            if (cell === null) {
                line.length = 0
                break
            }
            if (cell !== piece) {
                line.push([r, c])
                r += dr
                c += dc
                continue
            }
            break
        }

        if (line.length > 0 && isInsideBoard(r, c) && board[r][c] === piece) {
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
            if (cell) result[cell] += 1
        })
    })
    return result
}

function GameBoard1v1v1v1({ onNavigate, matchData }: GameBoard1v1v1v1Props) {
    const isOnlineMatch = Boolean(matchData?.online && matchData?.gameId)
    const [selectedPieceStyle4p, setSelectedPieceStyle4p] = useState(PIECE_STYLES_4P[0])
    const [myUsername, setMyUsername] = useState(matchData?.myUsername ?? '')
    const [myAvatar, setMyAvatar] = useState<string | undefined>(undefined)
    const [myElo, setMyElo] = useState(1000)
    const [playersFromRoom, setPlayersFromRoom] = useState(matchData?.players ?? [])

    const [board, setBoard] = useState<BoardCell[][]>(() => createInitialBoard())
    const [currentTurn, setCurrentTurn] = useState<Piece>('black')
    const [gameOver, setGameOver] = useState(false)
    const [winner, setWinner] = useState<Piece | null>(null)
    const [localPiece, setLocalPiece] = useState<Piece>('black')
    const [statusMessage, setStatusMessage] = useState('Conectando...')
    const [abandonedPieces, setAbandonedPieces] = useState<Piece[]>([])
    const [abandonNotice, setAbandonNotice] = useState<string>('')
    const [onlineValidMoves, setOnlineValidMoves] = useState<Set<string>>(new Set())
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)

    const playerColorNames = [
        selectedPieceStyle4p.p1Name,
        selectedPieceStyle4p.p2Name,
        selectedPieceStyle4p.p3Name,
        selectedPieceStyle4p.p4Name,
    ]

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

    const scoreByPiece = useMemo(() => countPieces(board), [board])
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
    const arenaTheme = getArenaFromElo(myPlayer?.rr ?? myElo)
    const validMoves = isOnlineMatch ? onlineValidMoves : getValidMoves(board, currentTurn)

    useEffect(() => {
        let isMounted = true

        const loadUserCustomization = async () => {
            try {
                const me = await api.users.getMe()
                if (!isMounted) return
                const { quadIndex } = decodePiecePreference(me.preferred_piece_color)
                setSelectedPieceStyle4p(PIECE_STYLES_4P[quadIndex] ?? PIECE_STYLES_4P[0])
                setMyAvatar(me.avatar_url)
                setMyElo(me.elo ?? 1000)
                if (!myUsername) setMyUsername(me.username)
            } catch {
                if (!isMounted) return
                setSelectedPieceStyle4p(PIECE_STYLES_4P[0])
            }
        }

        loadUserCustomization()
        return () => {
            isMounted = false
        }
    }, [myUsername])

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
                        setBoard(cloneBoard(payload.board))
                    }
                    if (PIECE_ORDER.includes(payload.current_player)) {
                        setCurrentTurn(payload.current_player as Piece)
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

                    if (payload.game_over) {
                        setStatusMessage('Partida finalizada')
                    } else if (payload.current_player === localPiece) {
                        setStatusMessage('Tu turno')
                    } else {
                        setStatusMessage('Turno de otro jugador')
                    }
                }

                if (data?.type === 'error' && data?.payload?.message) {
                    setStatusMessage(data.payload.message)
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

    const handleCellClick = (row: number, col: number) => {
        if (gameOver) return

        if (isOnlineMatch) {
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

        const key = `${row}-${col}`
        if (!validMoves.has(key)) return
        const flips = getFlips(board, row, col, currentTurn)
        if (flips.length === 0) return

        const nextBoard = cloneBoard(board)
        nextBoard[row][col] = currentTurn
        flips.forEach(([flipRow, flipCol]) => {
            nextBoard[flipRow][flipCol] = currentTurn
        })

        setBoard(nextBoard)
        const nextTurn = PIECE_ORDER[(PIECE_ORDER.indexOf(currentTurn) + 1) % PIECE_ORDER.length]
        setCurrentTurn(nextTurn)
    }

    const handleAttemptLeave = () => {
        if (gameOver) {
            onNavigate('friends')
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
            onNavigate('friends')
            return
        }

        setShowLeaveConfirm(false)
        onNavigate('friends')
    }

    const leftPlayers = normalizedPlayers.slice(0, 2)
    const rightPlayers = normalizedPlayers.slice(2, 4)

    return (
        <div className="duel-quad">
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

            <div className="duel-quad__container">
                <button className="duel-quad__leave-btn duel-quad__leave-btn--top" onClick={handleAttemptLeave}>
                    Abandonar partida
                </button>

                <header className="duel-quad__header">
                    <div className="duel-quad__center-info">
                        <span className="duel-quad__turn-label">Turno actual</span>
                        <span className="duel-quad__turn-value">
                            {gameOver ? 'Partida finalizada' : `${currentTurnPlayer?.name ?? '-'} (${currentTurnPlayer?.color ?? '-'})`}
                        </span>
                        <div className="duel-quad__timer">{statusMessage}</div>
                        {abandonNotice && (
                            <span className="duel-quad__abandon-notice">{abandonNotice}</span>
                        )}
                    </div>
                </header>

                <main className="duel-quad__main">
                    <aside className="duel-quad__side">
                        {leftPlayers.map((player) => (
                            <article
                                key={`${player.name}-${player.id}-left`}
                                className={`duel-quad__panel ${player.piece === currentTurn && !gameOver ? 'duel-quad__panel--active' : ''} ${abandonedPieces.includes(player.piece) ? 'duel-quad__panel--abandoned' : ''}`}
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
                                            <span className="duel-quad__player-score">{scoreByPiece[player.piece]} pts</span>
                                        </span>
                                        <span className="duel-quad__player-meta">{player.color}</span>
                                        {abandonedPieces.includes(player.piece) && (
                                            <span className="duel-quad__player-abandoned">Ha abandonado</span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </aside>

                    <section
                        className="duel-quad__board-area"
                        style={{ '--duel-quad-board-area-bg': `url(${arenaTheme.background})` } as CSSProperties}
                    >
                        <div
                            className="duel-quad__board"
                            style={{ backgroundImage: `url(${arenaTheme.board})` }}
                        >
                            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
                                const row = Math.floor(index / BOARD_SIZE)
                                const col = index % BOARD_SIZE
                                const key = `${row}-${col}`
                                const cell = board[row][col]
                                const canShowPlayableMove = !isOnlineMatch || currentTurn === localPiece
                                const isPlayable = validMoves.has(key) && !gameOver && canShowPlayableMove

                                return (
                                    <button
                                        key={key}
                                        className={`duel-quad__cell ${(row + col) % 2 === 0 ? 'duel-quad__cell--dark' : 'duel-quad__cell--light'} ${isPlayable ? 'duel-quad__cell--playable' : ''}`}
                                        type="button"
                                        aria-label={`Casilla ${row + 1}-${col + 1}`}
                                        onClick={() => handleCellClick(row, col)}
                                        disabled={gameOver}
                                    >
                                        {cell && (
                                            <span
                                                className={`duel-quad-piece duel-quad-piece--${cell}`}
                                                style={{
                                                    background:
                                                        cell === 'black' ? selectedPieceStyle4p.p1
                                                            : cell === 'white' ? selectedPieceStyle4p.p2
                                                                : cell === 'red' ? selectedPieceStyle4p.p3
                                                                    : selectedPieceStyle4p.p4,
                                                }}
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <aside className="duel-quad__side">
                        {rightPlayers.map((player) => (
                            <article
                                key={`${player.name}-${player.id}-right`}
                                className={`duel-quad__panel ${player.piece === currentTurn && !gameOver ? 'duel-quad__panel--active' : ''} ${abandonedPieces.includes(player.piece) ? 'duel-quad__panel--abandoned' : ''}`}
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
                                            <span className="duel-quad__player-score">{scoreByPiece[player.piece]} pts</span>
                                        </span>
                                        <span className="duel-quad__player-meta">{player.color}</span>
                                        {abandonedPieces.includes(player.piece) && (
                                            <span className="duel-quad__player-abandoned">Ha abandonado</span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </aside>
                </main>
            </div>

            <Modal isOpen={gameOver} onClose={() => onNavigate('friends')} maxWidth="600px" showCloseButton={false}>
                <div className="duel-quad-result">
                    <div className="duel-quad-result__top">
                        <h2 className="duel-quad-result__title">Partida finalizada</h2>
                        <p className="duel-quad-result__status">
                            {winner ? `Ganador: ${playerByPiece[winner]?.name ?? winner}` : 'Sin ganador'}
                        </p>
                    </div>

                    <p className="duel-quad-result__status">{`Has quedado en ${localRank}º puesto`}</p>

                    <div className="duel-quad-result__scores">
                        {finalRankingRows.map((row, index) => (
                            <div key={`result-${row.player?.id ?? index}`} className="duel-quad-result__row">
                                <span>{`${row.rank}º - ${row.player?.name ?? row.piece}`}</span>
                                <span>{row.abandoned ? 'Abandonó' : `${row.score} pts`}</span>
                            </div>
                        ))}
                    </div>

                    <button className="duel-quad-result__back-btn" onClick={() => onNavigate('friends')}>
                        Volver a amigos
                    </button>
                </div>
            </Modal>

            <Modal isOpen={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} maxWidth="520px">
                <div className="duel-quad-leave-confirm">
                    <h2 className="duel-quad-leave-confirm__title">Abandonar partida</h2>
                    <p className="duel-quad-leave-confirm__text">
                        Si abandonas la partida, se te registrara automaticamente como 4º puesto.
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
        </div>
    )
}

export default GameBoard1v1v1v1
