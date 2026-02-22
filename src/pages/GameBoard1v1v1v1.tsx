import '../Background.css'
import './GameBoard1v1v1v1.css'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { getAvatarFromSeed } from '../assets/avatarUtils'
import fireBoard from '../assets/arenas/fireboard.png'
import iceBoard from '../assets/arenas/iceboard.png'
import woodBoard from '../assets/arenas/woodboard.png'
import quartzBoard from '../assets/arenas/quartzboard.png'
import fireBackground from '../assets/arenas/firebackground.png'
import iceBackground from '../assets/arenas/icebackground.png'
import woodBackground from '../assets/arenas/woodbackground.png'
import quartzBackground from '../assets/arenas/quartzbackground.png'

interface GameBoard1v1v1v1Props {
    onNavigate: (screen: string, data?: any) => void
    matchData?: MatchData4Players | null
}

interface MatchData4Players {
    players: Array<{
        name: string
        rr: number
    }>
}

interface ArenaTheme {
    board: string
    background: string
}

type Piece = 'black' | 'white' | 'red' | 'blue'
type BoardCell = Piece | null
type AbilityId = string

interface QuadPlayer {
    id: number
    name: string
    rr: number
    score: number
    color: string
    piece: Piece
}

const BOARD_SIZE = 16
const INITIAL_QUESTION_CELLS = ['0-10', '2-4', '4-2', '10-4', '0-2', '9-13', '9-14', '14-2', '10-14', '9-12']
const PIECE_ORDER: Piece[] = ['black', 'white', 'red', 'blue']
const PLAYER_COLORS = ['Negras', 'Blancas', 'Rojas', 'Azules']
const ABILITY_PENALTY = 2

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
]

const getArenaFromElo = (elo: number): ArenaTheme => {
    if (elo < 1000) return { board: woodBoard, background: woodBackground }
    if (elo < 1500) return { board: quartzBoard, background: quartzBackground }
    if (elo < 2000) return { board: fireBoard, background: fireBackground }
    return { board: iceBoard, background: iceBackground }
}


const isInsideBoard = (row: number, col: number) =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

const getNextPiece = (piece: Piece): Piece => {
    const index = PIECE_ORDER.indexOf(piece)
    return PIECE_ORDER[(index + 1) % PIECE_ORDER.length]
}

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

    // Clúster superior izquierdo
    placeCluster(topRow, leftCol, 'black', 'white', 'red', 'blue')
    // Clúster superior derecho (espejo horizontal)
    placeCluster(topRow, rightCol, 'white', 'black', 'blue', 'red')
    // Clúster inferior izquierdo (espejo vertical)
    placeCluster(bottomRow, leftCol, 'red', 'blue', 'black', 'white')
    // Clúster inferior derecho (espejo horizontal + vertical)
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
            if (cell) {
                result[cell] += 1
            }
        })
    })

    return result
}

function GameBoard1v1v1v1({ onNavigate, matchData }: GameBoard1v1v1v1Props) {
    const players = matchData?.players ?? [
        { name: 'Jugador', rr: 2250 },
        { name: 'CyberNinja', rr: 1420 },
        { name: 'NovaMind', rr: 1650 },
        { name: 'ShadowFox', rr: 1850 },
    ]

    const normalizedPlayers = Array.from({ length: 4 }, (_, index) => players[index] ?? { name: `Jugador ${index + 1}`, rr: 1200 })

    const playersWithData: QuadPlayer[] = normalizedPlayers.map((player, index) => ({
        id: index,
        name: player.name,
        rr: player.rr,
        score: 0,
        color: PLAYER_COLORS[index] ?? `Color ${index + 1}`,
        piece: PIECE_ORDER[index],
    }))

    const playerByPiece = useMemo(
        () => ({
            black: playersWithData[0],
            white: playersWithData[1],
            red: playersWithData[2],
            blue: playersWithData[3],
        }),
        [playersWithData],
    )

    const [board, setBoard] = useState<BoardCell[][]>(() => createInitialBoard())
    const [questionCells, setQuestionCells] = useState<Set<string>>(() => new Set(INITIAL_QUESTION_CELLS))
    const [currentTurn, setCurrentTurn] = useState<Piece>('black')
    const [gameOver, setGameOver] = useState(false)
    const [inventories] = useState<Record<Piece, AbilityId[]>>({
        black: [],
        white: [],
        red: [],
        blue: [],
    })

    const validMoves = useMemo(() => getValidMoves(board, currentTurn), [board, currentTurn])
    const scoreByPiece = useMemo(() => countPieces(board), [board])

    const highestElo = Math.max(...playersWithData.map(player => player.rr))
    const arenaTheme = getArenaFromElo(highestElo)

    const penaltyByPiece = useMemo(
        () => ({
            black: inventories.black.length * ABILITY_PENALTY,
            white: inventories.white.length * ABILITY_PENALTY,
            red: inventories.red.length * ABILITY_PENALTY,
            blue: inventories.blue.length * ABILITY_PENALTY,
        }),
        [inventories.black.length, inventories.blue.length, inventories.red.length, inventories.white.length],
    )

    const finalScoreByPiece = useMemo(
        () => ({
            black: scoreByPiece.black - penaltyByPiece.black,
            white: scoreByPiece.white - penaltyByPiece.white,
            red: scoreByPiece.red - penaltyByPiece.red,
            blue: scoreByPiece.blue - penaltyByPiece.blue,
        }),
        [penaltyByPiece.black, penaltyByPiece.blue, penaltyByPiece.red, penaltyByPiece.white, scoreByPiece.black, scoreByPiece.blue, scoreByPiece.red, scoreByPiece.white],
    )

    const playersWithScore = useMemo(
        () => playersWithData.map(player => ({ ...player, score: finalScoreByPiece[player.piece] })),
        [finalScoreByPiece, playersWithData],
    )

    const localScore = finalScoreByPiece.black

    const localRank = useMemo(() => {
        const greaterCount = Object.values(finalScoreByPiece).filter(score => score > localScore).length
        return greaterCount + 1
    }, [finalScoreByPiece, localScore])

    const rrDelta = useMemo(() => {
        if (localRank === 1) return 50
        if (localRank === 2) return 25
        if (localRank === 3) return 0
        return -25
    }, [localRank])

    useEffect(() => {
        if (gameOver) {
            return
        }

        if (validMoves.size > 0) {
            return
        }

        for (let step = 1; step <= PIECE_ORDER.length; step += 1) {
            const nextPiece = PIECE_ORDER[(PIECE_ORDER.indexOf(currentTurn) + step) % PIECE_ORDER.length]
            if (getValidMoves(board, nextPiece).size > 0) {
                setCurrentTurn(nextPiece)
                return
            }
        }

        setGameOver(true)
    }, [board, currentTurn, gameOver, validMoves.size])

    const handleCellClick = (row: number, col: number) => {
        if (gameOver) {
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
        nextBoard[row][col] = currentTurn
        flips.forEach(([flipRow, flipCol]) => {
            nextBoard[flipRow][flipCol] = currentTurn
        })

        nextQuestions.delete(key)

        setBoard(nextBoard)
        setQuestionCells(nextQuestions)
        setCurrentTurn(getNextPiece(currentTurn))
    }

    const currentTurnPlayer = playerByPiece[currentTurn]
    const leftPlayers = playersWithScore.slice(0, 2)
    const rightPlayers = playersWithScore.slice(2, 4)

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
                <button className="duel-quad__leave-btn duel-quad__leave-btn--top" onClick={() => onNavigate('online-game')}>
                    Abandonar partida
                </button>

                <header className="duel-quad__header">
                    <div className="duel-quad__center-info">
                        <span className="duel-quad__turn-label">Turno actual</span>
                        <span className="duel-quad__turn-value">{gameOver ? 'Partida finalizada' : `${currentTurnPlayer.name} (${currentTurnPlayer.color})`}</span>
                        <div className="duel-quad__timer">1 accion por turno</div>
                    </div>
                </header>

                <main className="duel-quad__main">
                    <aside className="duel-quad__side">
                        {leftPlayers.map((player) => (
                            <article
                                key={`${player.name}-${player.id}-left`}
                                className={`duel-quad__panel ${player.piece === currentTurn && !gameOver ? 'duel-quad__panel--active' : ''}`}
                            >
                                <div className="duel-quad__player-card">
                                    <img
                                        className="duel-quad__avatar"
                                        src={getAvatarFromSeed(player.name)}
                                        alt={`Avatar de ${player.name}`}
                                    />
                                    <div className="duel-quad__player-data">
                                        <span className="duel-quad__player-row">
                                            <span className="duel-quad__player-name">{player.name}</span>
                                            <span className="duel-quad__player-score">{player.score} pts</span>
                                        </span>
                                        <span className="duel-quad__player-meta">{player.color}</span>
                                    </div>
                                </div>
                                <h2 className="duel-quad__panel-title">Habilidades</h2>
                                <div className="duel-quad__skills">
                                    <span className="duel-quad__empty-skills">Sin habilidades</span>
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
                                const hasQuestion = questionCells.has(key) && cell === null
                                const isPlayable = validMoves.has(key) && !gameOver

                                return (
                                    <button
                                        key={key}
                                        className={`duel-quad__cell ${(row + col) % 2 === 0 ? 'duel-quad__cell--dark' : 'duel-quad__cell--light'} ${hasQuestion ? 'duel-quad__cell--question' : ''} ${isPlayable ? 'duel-quad__cell--playable' : ''}`}
                                        type="button"
                                        aria-label={`Casilla ${row + 1}-${col + 1}`}
                                        onClick={() => handleCellClick(row, col)}
                                        disabled={gameOver}
                                    >
                                        {hasQuestion && <span className="duel-quad__question">?</span>}
                                        {cell && (
                                            <span className={`duel-quad-piece duel-quad-piece--${cell}`} />
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
                                className={`duel-quad__panel ${player.piece === currentTurn && !gameOver ? 'duel-quad__panel--active' : ''}`}
                            >
                                <div className="duel-quad__player-card">
                                    <img
                                        className="duel-quad__avatar"
                                        src={getAvatarFromSeed(player.name)}
                                        alt={`Avatar de ${player.name}`}
                                    />
                                    <div className="duel-quad__player-data">
                                        <span className="duel-quad__player-row">
                                            <span className="duel-quad__player-name">{player.name}</span>
                                            <span className="duel-quad__player-score">{player.score} pts</span>
                                        </span>
                                        <span className="duel-quad__player-meta">{player.color}</span>
                                    </div>
                                </div>
                                <h2 className="duel-quad__panel-title">Habilidades</h2>
                                <div className="duel-quad__skills">
                                    <span className="duel-quad__empty-skills">Sin habilidades</span>
                                </div>
                            </article>
                        ))}
                    </aside>
                </main>
            </div>

            <Modal isOpen={gameOver} onClose={() => onNavigate('online-game')} maxWidth="600px" showCloseButton={false}>
                <div className="duel-quad-result">
                    <div className="duel-quad-result__top">
                        <h2 className="duel-quad-result__title">Partida finalizada</h2>
                        <p className={`duel-quad-result__rr duel-quad-result__rr--badge ${rrDelta > 0 ? 'duel-quad-result__rr--up' : rrDelta < 0 ? 'duel-quad-result__rr--down' : 'duel-quad-result__rr--neutral'}`}>
                            {`${rrDelta >= 0 ? '+' : ''}${rrDelta} RR`}
                        </p>
                    </div>

                    <p className="duel-quad-result__status">{`Has quedado en ${localRank}º puesto`}</p>

                    <div className="duel-quad-result__scores">
                        {[...playersWithScore]
                            .sort((a, b) => b.score - a.score)
                            .map((player) => (
                                <div key={`result-${player.id}`} className="duel-quad-result__row">
                                    <span>{player.name}</span>
                                    <span>{scoreByPiece[player.piece]} - {penaltyByPiece[player.piece]} = {player.score} pts</span>
                                </div>
                            ))}
                    </div>

                    <p className="duel-quad-result__note">
                        Penalización aplicada: -{ABILITY_PENALTY} pts por cada habilidad sin gastar.
                    </p>

                    <button className="duel-quad-result__back-btn" onClick={() => onNavigate('online-game')}>
                        Volver al menú
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default GameBoard1v1v1v1
