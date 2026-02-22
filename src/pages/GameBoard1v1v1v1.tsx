import '../Background.css'
import './GameBoard1v1v1v1.css'
import { type CSSProperties } from 'react'
import { getAvatarFromSeed } from '../assets/avatarUtils'
import arenaFuego from '../assets/arenas/tableroFuego.png'
import arenaHielo from '../assets/arenas/tableroHielo.png'
import arenaMadera from '../assets/arenas/tableroMadera.png'
import arenaMarmol from '../assets/arenas/tableroCuarzo.png'
import fondoFuego from '../assets/arenas/fondoFuego.png'
import fondoHielo from '../assets/arenas/fondoHielo.png'
import fondoMadera from '../assets/arenas/fondoMadera.png'
import fondoMarmol from '../assets/arenas/fondoCuarzo.png'

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

const BOARD_SIZE = 16

const getArenaFromElo = (elo: number): ArenaTheme => {
    if (elo < 1000) return { board: arenaMadera, background: fondoMadera }
    if (elo < 1500) return { board: arenaHielo, background: fondoHielo }
    if (elo < 2000) return { board: arenaFuego, background: fondoFuego }
    return { board: arenaMarmol, background: fondoMarmol }
}

function GameBoard1v1v1v1({ onNavigate, matchData }: GameBoard1v1v1v1Props) {
    const players = matchData?.players ?? [
        { name: 'Jugador 1', rr: 2250 },
        { name: 'Jugador 2', rr: 1850 },
        { name: 'Jugador 3', rr: 1650 },
        { name: 'Jugador 4', rr: 1420 },
    ]
    const normalizedPlayers = Array.from({ length: 4 }, (_, index) =>
        players[index] ?? { name: `Jugador ${index + 1}`, rr: 1200 },
    )

    const playersWithScore = normalizedPlayers.map((player, index) => ({
        ...player,
        id: index,
        score: 0,
    }))
    const highestElo = Math.max(...playersWithScore.map(player => player.rr))
    const arenaTheme = getArenaFromElo(highestElo)
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
                <header className="duel-quad__header">
                    <div className="duel-quad__title-block">
                        <span className="duel-quad__mode">Modo 1 vs 1 vs 1 vs 1</span>
                        <h1 className="duel-quad__title">Partida en desarrollo</h1>
                    </div>
                    <div className="duel-quad__turn">Tablero temporal 16x16</div>
                </header>

                <main className="duel-quad__main">
                    <aside className="duel-quad__side">
                        {leftPlayers.map((player, index) => (
                            <article key={`${player.name}-${index}-left`} className="duel-quad__panel">
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
                                        <span className="duel-quad__player-meta">{player.rr} RR</span>
                                    </div>
                                </div>
                                <h2 className="duel-quad__panel-title">Habilidades</h2>
                                <div className="duel-quad__skills">
                                    <span className="duel-quad__empty-skills">Sin habilidades por ahora</span>
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
                                return (
                                    <button
                                        key={`${row}-${col}`}
                                        className={`duel-quad__cell ${(row + col) % 2 === 0 ? 'duel-quad__cell--dark' : 'duel-quad__cell--light'}`}
                                        type="button"
                                        aria-label={`Casilla ${row + 1}-${col + 1}`}
                                    />
                                )
                            })}
                        </div>

                        <div className="duel-quad__status">
                            Este tablero 16x16 es provisional hasta integrar los tableros finales del modo 4 jugadores.
                        </div>
                    </section>

                    <aside className="duel-quad__side">
                        {rightPlayers.map((player, index) => (
                            <article key={`${player.name}-${index}-right`} className="duel-quad__panel">
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
                                        <span className="duel-quad__player-meta">{player.rr} RR</span>
                                    </div>
                                </div>
                                <h2 className="duel-quad__panel-title">Habilidades</h2>
                                <div className="duel-quad__skills">
                                    <span className="duel-quad__empty-skills">Sin habilidades por ahora</span>
                                </div>
                            </article>
                        ))}
                    </aside>
                </main>

                <footer className="duel-quad__footer">
                    <button className="duel-quad__leave-btn" onClick={() => onNavigate('online-game')}>
                        Abandonar partida
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default GameBoard1v1v1v1
