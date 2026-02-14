import { useState } from 'react'
import '../Background.css'
import './Customization.css'

/* Pares de colores para fichas (cara A y cara B) */
const PIECE_STYLES = [
    { sideA: '#222', sideB: '#eee', label: 'Clásico' },
    { sideA: '#e74c3c', sideB: '#3498db', label: 'Fuego y Hielo' },
    { sideA: '#2ecc71', sideB: '#f1c40f', label: 'Selva' },
    { sideA: '#9b59b6', sideB: '#e67e22', label: 'Atardecer' },
    { sideA: '#1abc9c', sideB: '#e84393', label: 'Neón' },
]

/* Colores disponibles para el tablero */
const BOARD_COLORS = [
    { color: '#2d6a4f', label: 'Verde' },
    { color: '#2654a1', label: 'Azul' },
    { color: '#6b4226', label: 'Madera' },
    { color: '#2c2c3e', label: 'Oscuro' },
    { color: '#5b2d8e', label: 'Púrpura' },
]

/* Avatares predefinidos */
const AVATARS = [
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>,
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 4c1.93 0 3.68.79 4.95 2.05L12 13 7.05 8.05C8.32 6.79 10.07 6 12 6m-6 3.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m12 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5" /></svg>,
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.64 3.19L6.44 9h11.12l-5.2-5.81a.56.56 0 0 0-.72 0M5.09 9L3 11.59l8.28 9.3c.36.41.97.41 1.34 0L21 11.59 18.91 9H5.09z" /></svg>,
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>,
]

interface CustomizationProps {
    onNavigate: (screen: string) => void
}

function Customization({ onNavigate }: CustomizationProps) {
    const [selectedPiece, setSelectedPiece] = useState(0)
    const [selectedBoard, setSelectedBoard] = useState(0)
    const [selectedAvatar, setSelectedAvatar] = useState(0)

    return (
        <div className="custom">
            {/* Fondo animado con fichas flotantes */}
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

            <main className="custom__content">
                {/* Cabecera */}
                <div className="custom__header">
                    <h1 className="custom__title">Personalización</h1>
                    <p className="custom__subtitle">Haz que tu estilo sea único</p>
                </div>

                <div className="custom__sections">
                    {/* Sección: Perfil */}
                    <div className="custom__section">
                        <div className="custom__section-header">
                            <span className="custom__section-title">Perfil</span>
                        </div>

                        <div className="custom__profile">
                            <div className="custom__profile-top">
                                {/* Vista previa del avatar seleccionado */}
                                <div className="custom__avatar-preview">
                                    {AVATARS[selectedAvatar]}
                                </div>

                                <div className="custom__profile-content">
                                    <span className="custom__selector-label">Foto de perfil</span>
                                    <div className="custom__avatar-selector">
                                        {AVATARS.map((avatar, i) => (
                                            <button
                                                key={i}
                                                className={`custom__avatar-option ${i === selectedAvatar ? 'custom__avatar-option--selected' : ''}`}
                                                onClick={() => setSelectedAvatar(i)}
                                            >
                                                {avatar}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="custom__profile-fields">
                                <div className="custom__field">
                                    <span className="custom__field-label">Nombre</span>
                                    <div className="custom__field-row">
                                        <span className="custom__field-value">Jugador</span>
                                        <button className="custom__field-edit">✏️</button>
                                    </div>
                                </div>
                                <div className="custom__field">
                                    <span className="custom__field-label">Correo electrónico</span>
                                    <span className="custom__field-value">jugador@email.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Fichas y Tablero con vista previa */}
                    <div className="custom__section">
                        <div className="custom__section-header">
                            <span className="custom__section-title">Fichas y Tablero</span>
                        </div>

                        {/* Vista previa del tablero */}
                        <div className="custom__preview">
                            <div
                                className="custom__board"
                                style={{ background: BOARD_COLORS[selectedBoard].color }}
                            >
                                {Array.from({ length: 16 }).map((_, i) => {
                                    const row = Math.floor(i / 4)
                                    const col = i % 4
                                    // Patrón inicial tipo Reversi en el centro
                                    const isSideA =
                                        (row === 1 && col === 1) ||
                                        (row === 2 && col === 2)
                                    const isSideB =
                                        (row === 1 && col === 2) ||
                                        (row === 2 && col === 1)

                                    return (
                                        <div
                                            key={i}
                                            className="custom__cell"
                                        >
                                            {isSideA && (
                                                <div
                                                    className="custom__piece"
                                                    style={{ background: PIECE_STYLES[selectedPiece].sideA }}
                                                />
                                            )}
                                            {isSideB && (
                                                <div
                                                    className="custom__piece"
                                                    style={{ background: PIECE_STYLES[selectedPiece].sideB }}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Selector de fichas (pares de colores) */}
                        <div className="custom__selector">
                            <span className="custom__selector-label">Estilo de fichas</span>
                            <div className="custom__options">
                                {PIECE_STYLES.map((style, i) => (
                                    <button
                                        key={i}
                                        className={`custom__option custom__option--pair ${i === selectedPiece ? 'custom__option--selected' : ''}`}
                                        onClick={() => setSelectedPiece(i)}
                                        title={style.label}
                                    >
                                        <span className="custom__option-half" style={{ background: style.sideA }} />
                                        <span className="custom__option-half" style={{ background: style.sideB }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selector de tablero */}
                        <div className="custom__selector">
                            <span className="custom__selector-label">Color de tablero</span>
                            <div className="custom__options">
                                {BOARD_COLORS.map((board, i) => (
                                    <button
                                        key={i}
                                        className={`custom__option custom__option--color ${i === selectedBoard ? 'custom__option--selected' : ''}`}
                                        onClick={() => setSelectedBoard(i)}
                                        title={board.label}
                                        style={{ background: board.color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón volver */}
                <button className="custom__back" onClick={() => onNavigate('menu')}>Volver al menú</button>
            </main>
        </div>
    )
}

export default Customization
