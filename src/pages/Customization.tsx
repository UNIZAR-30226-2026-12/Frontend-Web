import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { api } from '../services/api'
import '../Background.css'
import './Customization.css'

import blackice from '../assets/avatars/blackice.jpeg'
import bluefire from '../assets/avatars/bluefire.png'
import purplesun from '../assets/avatars/purplesun.png'
import whitegrass from '../assets/avatars/whitegrass.png'

/* Estilos de fichas 1v1 (2 colores por estilo) */
const PIECE_STYLES_1V1 = [
    { sideA: '#222', sideB: '#eee', label: 'Clasico' },
    { sideA: '#e74c3c', sideB: '#3498db', label: 'Fuego y Hielo' },
    { sideA: '#2ecc71', sideB: '#f1c40f', label: 'Selva' },
    { sideA: '#9b59b6', sideB: '#e67e22', label: 'Atardecer' },
    { sideA: '#1abc9c', sideB: '#e84393', label: 'Neon' },
]

/* Estilos de fichas 1v1v1v1 (4 colores por estilo) */
const PIECE_STYLES_4P = [
    { p1: '#18181b', p2: '#f8fafc', p3: '#ef4444', p4: '#3b82f6', label: 'Clasico 4P' },
    { p1: '#22c55e', p2: '#fde047', p3: '#a855f7', p4: '#f97316', label: 'Jungla Solar' },
    { p1: '#06b6d4', p2: '#f43f5e', p3: '#84cc16', p4: '#fb7185', label: 'Cyber Pop' },
    { p1: '#f59e0b', p2: '#14b8a6', p3: '#8b5cf6', p4: '#ef4444', label: 'Magma Frio' },
    { p1: '#0ea5e9', p2: '#facc15', p3: '#ec4899', p4: '#10b981', label: 'Tropical RGB' },
]

const DEFAULT_BOARD_COLOR = '#2d6a4f'

/* Avatares predefinidos */
const AVATARS = [
    { id: 'blackice', src: blackice, label: 'Black Ice' },
    { id: 'bluefire', src: bluefire, label: 'Blue Fire' },
    { id: 'whitegrass', src: whitegrass, label: 'White Grass' },
    { id: 'purplesun', src: purplesun, label: 'Purple Sun' },
]

const encodePiecePreference = (duelIndex: number, quadIndex: number) => `d${duelIndex}-q${quadIndex}`
const normalizeLabel = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const decodePiecePreference = (value?: string | null) => {
    if (!value) return { duelIndex: 0, quadIndex: 0 }

    const compact = /^d(\d+)-q(\d+)$/.exec(value)
    if (compact) {
        const duelIndex = Number(compact[1])
        const quadIndex = Number(compact[2])
        return {
            duelIndex: Number.isInteger(duelIndex) && duelIndex >= 0 && duelIndex < PIECE_STYLES_1V1.length ? duelIndex : 0,
            quadIndex: Number.isInteger(quadIndex) && quadIndex >= 0 && quadIndex < PIECE_STYLES_4P.length ? quadIndex : 0,
        }
    }

    // Compatibilidad con valores antiguos guardados solo por etiqueta 1v1
    const normalizedValue = normalizeLabel(value)
    const legacyDuelIndex = PIECE_STYLES_1V1.findIndex(style => normalizeLabel(style.label) === normalizedValue)
    return { duelIndex: legacyDuelIndex !== -1 ? legacyDuelIndex : 0, quadIndex: 0 }
}

interface CustomizationProps {
    onNavigate: (screen: string, data?: any) => void
}

function Customization({ onNavigate }: CustomizationProps) {
    const [selectedPiece1v1, setSelectedPiece1v1] = useState(0)
    const [selectedPiece4p, setSelectedPiece4p] = useState(0)
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

                const { duelIndex, quadIndex } = decodePiecePreference(data.preferred_piece_color)
                setSelectedPiece1v1(duelIndex)
                setSelectedPiece4p(quadIndex)

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

    const handleSaveCustomization = async (piece1v1Idx: number, piece4pIdx: number, avatarId: string | number) => {
        try {
            const avatar_url = typeof avatarId === 'number' ? AVATARS[avatarId].id : 'custom'
            await api.users.updateCustomization({
                preferred_piece_color: encodePiecePreference(piece1v1Idx, piece4pIdx),
                avatar_url,
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
                const formData = new FormData()
                formData.append('file', file)
                const res = await api.users.uploadAvatar(formData)
                setCustomAvatar(res.avatar_url)
                setSelectedAvatar('custom')
                handleSaveCustomization(selectedPiece1v1, selectedPiece4p, 'custom')
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
                    <h1 className="custom__title">Personalizacion</h1>
                    <p className="custom__subtitle">Haz que tu estilo sea unico</p>
                </div>

                <div className="custom__sections">
                    {/* Seccion: Perfil */}
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
                                                    handleSaveCustomization(selectedPiece1v1, selectedPiece4p, i)
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

                                        {/* Boton para subir imagen */}
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
                                            title={isEditingName ? 'Modifica tu nombre de jugador' : 'Cambia tu nombre de jugador'}
                                        >
                                            {isEditingName ? 'Confirmar cambios' : 'Editar nombre'}
                                        </button>
                                    </div>
                                </div>
                                <div className="custom__field">
                                    <span className="custom__field-label">Correo electronico</span>
                                    <span className="custom__field-value">{email || 'jugador@email.com'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seccion: Fichas con vista previa */}
                    <div className="custom__section">
                        <div className="custom__section-header">
                            <span className="custom__section-title">Fichas</span>
                        </div>
                        <div className="custom__modes-grid">
                            <div className="custom__mode-card">
                                <span className="custom__selector-label">Estilo de fichas (1v1)</span>
                                <div className="custom__preview custom__preview--compact">
                                    <div className="custom__board" style={{ background: DEFAULT_BOARD_COLOR }}>
                                        {Array.from({ length: 16 }).map((_, i) => {
                                            const row = Math.floor(i / 4)
                                            const col = i % 4
                                            const isSideA = (row === 1 && col === 1) || (row === 2 && col === 2)
                                            const isSideB = (row === 1 && col === 2) || (row === 2 && col === 1)

                                            return (
                                                <div key={`duel-${i}`} className="custom__cell">
                                                    {isSideA && <div className="custom__piece" style={{ background: PIECE_STYLES_1V1[selectedPiece1v1].sideA }} />}
                                                    {isSideB && <div className="custom__piece" style={{ background: PIECE_STYLES_1V1[selectedPiece1v1].sideB }} />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="custom__options custom__options--compact">
                                    {PIECE_STYLES_1V1.map((style, i) => (
                                        <button
                                            key={i}
                                            className={`custom__option custom__option--pair ${i === selectedPiece1v1 ? 'custom__option--selected' : ''}`}
                                            onClick={() => {
                                                setSelectedPiece1v1(i)
                                                handleSaveCustomization(i, selectedPiece4p, selectedAvatar)
                                            }}
                                            title={style.label}
                                        >
                                            <span className="custom__option-half" style={{ background: style.sideA }} />
                                            <span className="custom__option-half" style={{ background: style.sideB }} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="custom__mode-card">
                                <span className="custom__selector-label">Estilo de fichas (1v1v1v1)</span>
                                <div className="custom__preview custom__preview--compact">
                                    <div className="custom__board" style={{ background: DEFAULT_BOARD_COLOR }}>
                                        {Array.from({ length: 16 }).map((_, i) => {
                                            const row = Math.floor(i / 4)
                                            const col = i % 4
                                            const isP1 = row === 1 && col === 1
                                            const isP2 = row === 1 && col === 2
                                            const isP3 = row === 2 && col === 1
                                            const isP4 = row === 2 && col === 2

                                            return (
                                                <div key={`quad-${i}`} className="custom__cell">
                                                    {isP1 && <div className="custom__piece" style={{ background: PIECE_STYLES_4P[selectedPiece4p].p1 }} />}
                                                    {isP2 && <div className="custom__piece" style={{ background: PIECE_STYLES_4P[selectedPiece4p].p2 }} />}
                                                    {isP3 && <div className="custom__piece" style={{ background: PIECE_STYLES_4P[selectedPiece4p].p3 }} />}
                                                    {isP4 && <div className="custom__piece" style={{ background: PIECE_STYLES_4P[selectedPiece4p].p4 }} />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="custom__options custom__options--compact">
                                    {PIECE_STYLES_4P.map((style, i) => (
                                        <button
                                            key={i}
                                            className={`custom__option custom__option--quad ${i === selectedPiece4p ? 'custom__option--selected' : ''}`}
                                            onClick={() => {
                                                setSelectedPiece4p(i)
                                                handleSaveCustomization(selectedPiece1v1, i, selectedAvatar)
                                            }}
                                            title={style.label}
                                        >
                                            <span className="custom__option-quarter" style={{ background: style.p1 }} />
                                            <span className="custom__option-quarter" style={{ background: style.p2 }} />
                                            <span className="custom__option-quarter" style={{ background: style.p3 }} />
                                            <span className="custom__option-quarter" style={{ background: style.p4 }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boton volver */}
                <button className="custom__back" onClick={() => onNavigate('menu')}>Volver al menu</button>
            </main>
        </div>
    )
}

export default Customization
