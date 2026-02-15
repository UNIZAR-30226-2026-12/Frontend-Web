import { useState, useRef } from 'react'
import '../Background.css'
import './Customization.css'

import blackice from '../assets/avatars/blackice.jpeg'
import bluefire from '../assets/avatars/bluefire.png'
import purplesun from '../assets/avatars/purplesun.png'
import whitegrass from '../assets/avatars/whitegrass.png'

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
    { id: 'blackice', src: blackice, label: 'Black Ice' },
    { id: 'bluefire', src: bluefire, label: 'Blue Fire' },
    { id: 'whitegrass', src: whitegrass, label: 'White Grass' },
    { id: 'purplesun', src: purplesun, label: 'Purple Sun' },
]

interface CustomizationProps {
    onNavigate: (screen: string, data?: any) => void
}

function Customization({ onNavigate }: CustomizationProps) {
    const [selectedPiece, setSelectedPiece] = useState(0)
    const [selectedBoard, setSelectedBoard] = useState(0)
    const [selectedAvatar, setSelectedAvatar] = useState<number | 'custom'>(0)
    const [customAvatar, setCustomAvatar] = useState<string | null>(null)
    const [username, setUsername] = useState('Jugador')
    const [isEditingName, setIsEditingName] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setCustomAvatar(url)
            setSelectedAvatar('custom')
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const toggleEditName = () => {
        setIsEditingName(!isEditingName)
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value)
    }

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditingName(false)
        }
    }

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
                                    {selectedAvatar === 'custom' && customAvatar ? (
                                        <img src={customAvatar} alt="Avatar" className="custom__avatar-img" />
                                    ) : (
                                        typeof selectedAvatar === 'number' && (
                                            <img src={AVATARS[selectedAvatar].src} alt={AVATARS[selectedAvatar].label} className="custom__avatar-img" />
                                        )
                                    )}
                                </div>

                                <div className="custom__profile-content">
                                    <span className="custom__selector-label">Foto de perfil</span>
                                    <div className="custom__avatar-selector">
                                        {AVATARS.map((avatar, i) => (
                                            <button
                                                key={avatar.id}
                                                className={`custom__avatar-option ${selectedAvatar === i ? 'custom__avatar-option--selected' : ''}`}
                                                onClick={() => setSelectedAvatar(i)}
                                                title={avatar.label}
                                            >
                                                <img src={avatar.src} alt={avatar.label} className="custom__avatar-img" />
                                            </button>
                                        ))}

                                        {/* Avatar personalizado subido */}
                                        {customAvatar && (
                                            <button
                                                className={`custom__avatar-option custom__avatar-option--custom ${selectedAvatar === 'custom' ? 'custom__avatar-option--selected' : ''}`}
                                                onClick={() => setSelectedAvatar('custom')}
                                            >
                                                <img src={customAvatar} alt="Custom" className="custom__avatar-img" />
                                            </button>
                                        )}

                                        {/* Botón para subir imagen */}
                                        <button
                                            className="custom__avatar-option custom__avatar-upload"
                                            onClick={triggerFileInput}
                                            title="Subir foto propia"
                                        >
                                            ➕
                                        </button>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="custom__file-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="custom__profile-fields">
                                <div className="custom__field">
                                    <span className="custom__field-label">Nombre</span>
                                    <div className="custom__field-row">
                                        {isEditingName ? (
                                            <input
                                                type="text"
                                                className="custom__input-name"
                                                value={username}
                                                onChange={handleNameChange}
                                                onKeyDown={handleNameKeyDown}
                                                onBlur={() => setIsEditingName(false)}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="custom__field-value">{username}</span>
                                        )}
                                        <button
                                            className="custom__field-edit"
                                            onClick={toggleEditName}
                                            title={isEditingName ? "Guardar" : "Editar nombre"}
                                        >
                                            {isEditingName ? '✅' : '✏️'}
                                        </button>
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
