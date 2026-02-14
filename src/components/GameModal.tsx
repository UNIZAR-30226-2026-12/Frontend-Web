import Modal from './Modal'
import './GameModal.css'

interface GameModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    subtitle?: string
    onSelectMode?: (mode: string) => void
}

function GameModal({ isOpen, onClose, title = "Seleccionar modo de juego", subtitle = "Elige qué modo quieres jugar", onSelectMode }: GameModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="650px">
            <div className="game-modal">
                <h2 className="game-modal__title">{title}</h2>
                <p className="game-modal__subtitle">{subtitle}</p>

                <div className="game-modal__options">
                    <button className="game-modal__option" onClick={() => onSelectMode?.('1vs1')}>
                        <div className="game-modal__option-icon">
                            <div className="board-preview board-preview--8">
                                {/* Casillas especiales */}
                                <div className="board-preview__special-cell" style={{ gridArea: '2 / 7' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '6 / 2' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '2 / 2' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '7 / 6' }}>?</div>

                                <div className="board-preview__piece board-preview__piece--white" style={{ gridArea: '4 / 4' }}></div>
                                <div className="board-preview__piece board-preview__piece--black" style={{ gridArea: '4 / 5' }}></div>
                                <div className="board-preview__piece board-preview__piece--black" style={{ gridArea: '5 / 4' }}></div>
                                <div className="board-preview__piece board-preview__piece--white" style={{ gridArea: '5 / 5' }}></div>
                            </div>
                        </div>
                        <div className="game-modal__option-info">
                            <span className="game-modal__option-name">1 vs 1</span>
                            <span className="game-modal__option-desc">Duelo de 2 jugadores</span>
                        </div>
                    </button>

                    <button className="game-modal__option" onClick={() => onSelectMode?.('1vs1vs1vs1')}>
                        <div className="game-modal__option-icon">
                            <div className="board-preview board-preview--16">
                                {/* Casillas especiales */}
                                <div className="board-preview__special-cell" style={{ gridArea: '2 / 10' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '10 / 2' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '15 / 12' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '3 / 15' }}>?</div>
                                <div className="board-preview__special-cell" style={{ gridArea: '8 / 7' }}>?</div>

                                {/* Cluster 1: Superior Izquierda */}
                                <div className="board-preview__piece board-preview__piece--black" style={{ gridArea: '4 / 4' }}></div>
                                <div className="board-preview__piece board-preview__piece--white" style={{ gridArea: '4 / 5' }}></div>
                                <div className="board-preview__piece board-preview__piece--red" style={{ gridArea: '5 / 4' }}></div>
                                <div className="board-preview__piece board-preview__piece--blue" style={{ gridArea: '5 / 5' }}></div>

                                {/* Cluster 2: Superior Derecha */}
                                <div className="board-preview__piece board-preview__piece--white" style={{ gridArea: '4 / 12' }}></div>
                                <div className="board-preview__piece board-preview__piece--black" style={{ gridArea: '4 / 13' }}></div>
                                <div className="board-preview__piece board-preview__piece--blue" style={{ gridArea: '5 / 12' }}></div>
                                <div className="board-preview__piece board-preview__piece--red" style={{ gridArea: '5 / 13' }}></div>

                                {/* Cluster 3: Inferior Izquierda */}
                                <div className="board-preview__piece board-preview__piece--red" style={{ gridArea: '12 / 4' }}></div>
                                <div className="board-preview__piece board-preview__piece--blue" style={{ gridArea: '12 / 5' }}></div>
                                <div className="board-preview__piece board-preview__piece--black" style={{ gridArea: '13 / 4' }}></div>
                                <div className="board-preview__piece board-preview__piece--white" style={{ gridArea: '13 / 5' }}></div>

                                {/* Cluster 4: Inferior Derecha */}
                                <div className="board-preview__piece board-preview__piece--blue" style={{ gridArea: '12 / 12' }}></div>
                                <div className="board-preview__piece board-preview__piece--red" style={{ gridArea: '12 / 13' }}></div>
                                <div className="board-preview__piece board-preview__piece--white" style={{ gridArea: '13 / 12' }}></div>
                                <div className="board-preview__piece board-preview__piece--black" style={{ gridArea: '13 / 13' }}></div>
                            </div>
                        </div>
                        <div className="game-modal__option-info">
                            <span className="game-modal__option-name">1 vs 1 vs 1 vs 1</span>
                            <span className="game-modal__option-desc">Todos contra todos de 4 jugadores</span>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default GameModal
