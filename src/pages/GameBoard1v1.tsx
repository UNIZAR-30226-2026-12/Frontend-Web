import '../Background.css'
import './GameBoard1v1.css'
import { getAvatarFromSeed } from '../assets/avatarUtils'

interface GameBoard1v1Props {
    onNavigate: (screen: string, data?: any) => void
}

const PLAYER = {
    name: 'Jugador',
    rr: 1250,
    color: 'Negras',
    pieceClass: 'duel-piece--black'
}

const OPPONENT = {
    name: 'Gamer_Pro',
    rr: 1420,
    color: 'Blancas',
    pieceClass: 'duel-piece--white'
}

const PLAYER_SKILLS = [
    { id: 'swap', name: 'Intercambio', uses: 1, icon: '<>' },
    { id: 'mirror', name: 'Espejo', uses: 2, icon: '[]' },
    { id: 'freeze', name: 'Congelar', uses: 1, icon: '*' },
]

const OPPONENT_SKILLS = [
    { id: 'shield', name: 'Escudo', uses: 1, icon: 'O' },
    { id: 'steal', name: 'Robo', uses: 1, icon: '+' },
    { id: 'boost', name: 'Impulso', uses: 2, icon: '>>' },
]

const INITIAL_PIECES = new Map<string, 'black' | 'white'>([
    ['3-3', 'white'],
    ['3-4', 'black'],
    ['4-3', 'black'],
    ['4-4', 'white'],
])

const QUESTION_CELLS = new Set(['1-1', '2-6', '5-2', '6-5'])

function GameBoard1v1({ onNavigate }: GameBoard1v1Props) {
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
                <header className="duel__header">
                    <div className="duel__player duel__player--you">
                        <img className="duel__avatar" src={getAvatarFromSeed(PLAYER.name)} alt={`Avatar de ${PLAYER.name}`} />
                        <div className="duel__player-data">
                            <span className="duel__name">{PLAYER.name}</span>
                            <span className="duel__meta">{PLAYER.rr} RR | {PLAYER.color}</span>
                        </div>
                    </div>

                    <div className="duel__center-info">
                        <span className="duel__turn-label">Turno actual</span>
                        <span className="duel__turn-value">{PLAYER.name} ({PLAYER.color})</span>
                        <div className="duel__timer">00:18</div>
                    </div>

                    <div className="duel__player duel__player--rival">
                        <img className="duel__avatar" src={getAvatarFromSeed(OPPONENT.name)} alt={`Avatar de ${OPPONENT.name}`} />
                        <div className="duel__player-data">
                            <span className="duel__name">{OPPONENT.name}</span>
                            <span className="duel__meta">{OPPONENT.rr} RR | {OPPONENT.color}</span>
                        </div>
                    </div>
                </header>

                <main className="duel__main">
                    <aside className="duel__panel">
                        <h2 className="duel__panel-title">Tus habilidades</h2>
                        <div className="duel__skills">
                            {PLAYER_SKILLS.map(skill => (
                                <div key={skill.id} className="duel__skill-card">
                                    <span className="duel__skill-icon">{skill.icon}</span>
                                    <div className="duel__skill-text">
                                        <span className="duel__skill-name">{skill.name}</span>
                                        <span className="duel__skill-uses">x{skill.uses}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="duel__board-area">
                        <div className="duel__board">
                            {Array.from({ length: 64 }).map((_, index) => {
                                const row = Math.floor(index / 8)
                                const col = index % 8
                                const key = `${row}-${col}`
                                const piece = INITIAL_PIECES.get(key)
                                const hasQuestion = QUESTION_CELLS.has(key)

                                return (
                                    <div key={key} className={`duel__cell ${(row + col) % 2 === 0 ? 'duel__cell--dark' : 'duel__cell--light'}`}>
                                        {hasQuestion && <span className="duel__question">?</span>}
                                        {piece && <span className={`duel-piece ${piece === 'black' ? 'duel-piece--black' : 'duel-piece--white'}`} />}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="duel__legend">
                            <span><span className={`duel-piece ${PLAYER.pieceClass}`} /> Tu color</span>
                            <span><span className={`duel-piece ${OPPONENT.pieceClass}`} /> Color rival</span>
                        </div>
                    </section>

                    <aside className="duel__panel">
                        <h2 className="duel__panel-title">Habilidades rival</h2>
                        <div className="duel__skills">
                            {OPPONENT_SKILLS.map(skill => (
                                <div key={skill.id} className="duel__skill-card">
                                    <span className="duel__skill-icon">{skill.icon}</span>
                                    <div className="duel__skill-text">
                                        <span className="duel__skill-name">{skill.name}</span>
                                        <span className="duel__skill-uses">x{skill.uses}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </main>

                <footer className="duel__footer">
                    <button className="duel__leave-btn" onClick={() => onNavigate('online-game')}>
                        Abandonar partida
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default GameBoard1v1
