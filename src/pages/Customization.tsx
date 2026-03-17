import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { api } from '../services/api'
import '../styles/background.css'
import '../styles/pages/Customization.css'
import { PIECE_STYLES_1V1, PIECE_STYLES_4P, decodePiecePreference, encodePiecePreference } from '../config/pieceStyles'
import { AVATAR_OPTIONS } from '../config/avatarOptions'

const DEFAULT_BOARD_COLOR = '#2d6a4f'

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
    const [profileError, setProfileError] = useState('')
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
                    const avatarIdx = AVATAR_OPTIONS.findIndex(a => a.id === data.avatar_url)
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

    const handleSaveCustomization = async (
        piece1v1Idx: number,
        piece4pIdx: number,
        avatarSelection: number | 'custom',
        customAvatarUrl?: string | null,
    ) => {
        try {
            const avatar_url =
                typeof avatarSelection === 'number'
                    ? AVATAR_OPTIONS[avatarSelection]?.id
                    : customAvatarUrl ?? customAvatar ?? undefined
            await api.users.updateCustomization({
                preferred_piece_color: encodePiecePreference(piece1v1Idx, piece4pIdx),
                avatar_url,
            })
        } catch (err) {
            console.error('Error saving customization', err)
        }
    }

    const saveProfile = async (nextUsername: string) => {
        const normalizedUsername = nextUsername.trim()
        if (!normalizedUsername) {
            setProfileError('El nombre de usuario no puede estar vacio')
            return false
        }

        try {
            const updated = await api.users.updateMe({ username: normalizedUsername })
            setUsername(updated.username)
            setEmail(updated.email)
            setProfileError('')
            return true
        } catch (err: any) {
            setProfileError(err?.message || 'Error al actualizar el perfil')
            return false
        }
    }

    const handleUpdateName = async () => {
        const ok = await saveProfile(username)
        if (ok) {
            setIsEditingName(false)
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
                handleSaveCustomization(selectedPiece1v1, selectedPiece4p, 'custom', res.avatar_url)
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
                                            <img
                                                src={AVATAR_OPTIONS[selectedAvatar].src}
                                                alt={AVATAR_OPTIONS[selectedAvatar].label}
                                                className="custom__avatar-img"
                                            />
                                        )
                                    )}
                                </div>

                                <div className="custom__profile-content">
                                    <span className="custom__selector-label">Foto de perfil</span>
                                    <div className="custom__avatar-selector">
                                        {AVATAR_OPTIONS.map((avatar, i) => (
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
                                                onClick={() => {
                                                    setSelectedAvatar('custom')
                                                    handleSaveCustomization(selectedPiece1v1, selectedPiece4p, 'custom', customAvatar)
                                                }}
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
                                {profileError && (
                                    <div className="custom__field">
                                        <span className="custom__field-value" style={{ color: '#f87171' }}>{profileError}</span>
                                    </div>
                                )}
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
                                                onBlur={handleUpdateName}
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
                                                handleSaveCustomization(i, selectedPiece4p, selectedAvatar, customAvatar)
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
                                                handleSaveCustomization(selectedPiece1v1, i, selectedAvatar, customAvatar)
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
