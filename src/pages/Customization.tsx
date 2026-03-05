import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { api } from '../services/api'
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
    const [email, setEmail] = useState('')
    const [isEditingName, setIsEditingName] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await api.users.getMe()
                setUsername(data.username)
                setEmail(data.email)

                // Mapear colores de DB a índices locales si es necesario
                // Por ahora asumimos que guardamos el índice o el nombre
                const pieceIdx = PIECE_STYLES.findIndex(s => s.label === data.preferred_piece_color)
                if (pieceIdx !== -1) setSelectedPiece(pieceIdx)

                const boardIdx = BOARD_COLORS.findIndex(b => b.label === data.preferred_board_color)
                if (boardIdx !== -1) setSelectedBoard(boardIdx)

                if (data.avatar_url) {
                    const avatarIdx = AVATARS.findIndex(a => a.id === data.avatar_url)
                    if (avatarIdx !== -1) {
                        setSelectedAvatar(avatarIdx)
                    } else {
                        setCustomAvatar(data.avatar_url)
                        setSelectedAvatar('custom')
                    }
                }
            } catch (err) {
                console.error('Error fetching user data', err)
            }
        }
        fetchUserData()
    }, [])

    const handleSaveCustomization = async (pieceIdx: number, boardIdx: number, avatarId: string | number) => {
        try {
            const avatar_url = typeof avatarId === 'number' ? AVATARS[avatarId].id : 'custom'
            await api.users.updateCustomization({
                preferred_piece_color: PIECE_STYLES[pieceIdx].label,
                preferred_board_color: BOARD_COLORS[boardIdx].label,
                avatar_url: avatar_url
            })
        } catch (err) {
            console.error('Error saving customization', err)
        }
    }

    const handleUpdateName = async () => {
        try {
            await api.users.updateMe({ username })
            setIsEditingName(false)
        } catch (err) {
            console.error('Error updating username', err)
        }
    }

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                // Simulación de subida de avatar
                const formData = new FormData()
                formData.append('file', file)
                const res = await api.users.uploadAvatar(formData)
                setCustomAvatar(res.avatar_url)
                setSelectedAvatar('custom')
                handleSaveCustomization(selectedPiece, selectedBoard, 'custom')
            } catch (err) {
                console.error('Error uploading avatar', err)
            }
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const toggleEditName = () => {
        if (isEditingName) {
            handleUpdateName()
        } else {
            setIsEditingName(true)
        }
    }

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value)
    }

    const handleNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUpdateName()
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
                                                onClick={() => {
                                                    setSelectedAvatar(i)
                                                    handleSaveCustomization(selectedPiece, selectedBoard, i)
                                                }}
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
                                            title={isEditingName ? "Modifica tu nombre de jugador" : "Cambia tu nombre de jugador"}
                                        >
                                            {isEditingName ? 'Confirmar cambios ✅' : 'Editar nombre ✏️'}
                                        </button>
                                    </div>
                                </div>
                                <div className="custom__field">
                                    <span className="custom__field-label">Correo electrónico</span>
                                    <span className="custom__field-value">{email || 'jugador@email.com'}</span>
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
                                        onClick={() => {
                                            setSelectedPiece(i)
                                            handleSaveCustomization(i, selectedBoard, selectedAvatar)
                                        }}
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
                                        onClick={() => {
                                            setSelectedBoard(i)
                                            handleSaveCustomization(selectedPiece, i, selectedAvatar)
                                        }}
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
