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

    const highestElo = Math.max(...players.map(p => p.rr))
    const arenaTheme = getArenaFromElo(highestElo)

    return (
        <div className="four-players">
            <div className="four-players__board">
                {Array.from({ length: 256 }).map((_, index) => {
                    const row = Math.floor(index / BOARD_SIZE)
                    const col = index % BOARD_SIZE
                    return (
                        <button
                            key={`${row}-${col}`}
                            className={`four-players__cell ${(row + col) % 2 === 0 ? 'four-players__cell--dark' : 'four-players__cell--light'}`}
                            type="button"
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default GameBoard1v1v1v1
