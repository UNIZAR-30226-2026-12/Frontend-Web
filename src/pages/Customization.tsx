import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { api } from '../services/api'
import '../styles/pages/Customization.css'
import { PIECE_STYLES_1V1, PIECE_STYLES_4P, decodePiecePreference, encodePiecePreference } from '../config/pieceStyles'
import { AVATAR_OPTIONS } from '../config/avatarOptions'
import titlePersonalizacion from '../assets/personalizacion/tituloPersonalizacion.png'
import profileSheetImage from '../assets/personalizacion/fotoPerfil.png'
import piecesSheetImage from '../assets/personalizacion/EleccionFichas.png'
import backToMenuButtonImage from '../assets/elementosGenerales/botonVolverMenu.png'
import customizationBackground from '../assets/backgrounds/menu-mosaic-bg.png'

interface CustomizationProps {
    onNavigate: (screen: string, data?: any) => void
}

function Customization({ onNavigate }: CustomizationProps) {
    const [selectedPiece1v1, setSelectedPiece1v1] = useState(0)
    const [selectedPiece4p, setSelectedPiece4p] = useState(0)
    const [selectedAvatar, setSelectedAvatar] = useState<number | 'custom'>(0)
    const [customAvatar, setCustomAvatar] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await api.users.getMe()
                const { duelIndex, quadIndex } = decodePiecePreference(data.preferred_piece_color)

                setSelectedPiece1v1(duelIndex)
                setSelectedPiece4p(quadIndex)

                if (!data.avatar_url) return

                const avatarIdx = AVATAR_OPTIONS.findIndex((avatar) => avatar.id === data.avatar_url)
                if (avatarIdx !== -1) {
                    setSelectedAvatar(avatarIdx)
                    return
                }

                setCustomAvatar(data.avatar_url)
                setSelectedAvatar('custom')
            } catch (err) {
                console.error('Error fetching user data', err)
            }
        }

        void fetchUserData()
    }, [])

    const handleSaveCustomization = async (
        piece1v1Idx: number,
        piece4pIdx: number,
        avatarSelection: number | 'custom',
        customAvatarUrl?: string | null,
    ) => {
        try {
            const avatarUrl = typeof avatarSelection === 'number'
                ? AVATAR_OPTIONS[avatarSelection]?.id
                : customAvatarUrl ?? customAvatar ?? undefined

            await api.users.updateCustomization({
                preferred_piece_color: encodePiecePreference(piece1v1Idx, piece4pIdx),
                avatar_url: avatarUrl,
            })
        } catch (err) {
            console.error('Error saving customization', err)
        }
    }

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.users.uploadAvatar(formData)
            setCustomAvatar(response.avatar_url)
            setSelectedAvatar('custom')
            await handleSaveCustomization(selectedPiece1v1, selectedPiece4p, 'custom', response.avatar_url)
        } catch (err) {
            console.error('Error uploading avatar', err)
        }
    }

    const selectedAvatarSrc = selectedAvatar === 'custom'
        ? customAvatar
        : AVATAR_OPTIONS[selectedAvatar]?.src

    return (
        <div className="customization">
            <img className="customization__background" src={customizationBackground} alt="" aria-hidden="true" />
            <div className="customization__overlay" aria-hidden="true"></div>

            <main className="customization__stage">
                <img className="customization__title-image" src={titlePersonalizacion} alt="Personalización. Haz que tu estilo sea único." />

                <div className="customization__cards">
                    <section className="customization__card customization__card--profile">
                        <img className="customization__card-image" src={profileSheetImage} alt="" aria-hidden="true" />

                        <div className="customization__avatar-preview" aria-label="Vista previa del avatar seleccionado">
                            {selectedAvatarSrc && (
                                <img
                                    className="customization__avatar-image"
                                    src={selectedAvatarSrc}
                                    alt="Avatar seleccionado"
                                />
                            )}
                        </div>

                        <div className="customization__avatar-strip" role="listbox" aria-label="Selección de foto de perfil">
                            {AVATAR_OPTIONS.map((avatar, index) => (
                                <button
                                    key={avatar.id}
                                    className={`customization__avatar-option ${selectedAvatar === index ? 'customization__avatar-option--selected' : ''}`}
                                    onClick={() => {
                                        setSelectedAvatar(index)
                                        void handleSaveCustomization(selectedPiece1v1, selectedPiece4p, index)
                                    }}
                                    aria-label={`Seleccionar avatar ${avatar.label}`}
                                    title={avatar.label}
                                >
                                    <img src={avatar.src} alt={avatar.label} className="customization__avatar-image" />
                                </button>
                            ))}

                            {customAvatar && (
                                <button
                                    className={`customization__avatar-option ${selectedAvatar === 'custom' ? 'customization__avatar-option--selected' : ''}`}
                                    onClick={() => {
                                        setSelectedAvatar('custom')
                                        void handleSaveCustomization(selectedPiece1v1, selectedPiece4p, 'custom', customAvatar)
                                    }}
                                    aria-label="Seleccionar avatar subido"
                                    title="Avatar subido"
                                >
                                    <img src={customAvatar} alt="Avatar subido" className="customization__avatar-image" />
                                </button>
                            )}

                            <button
                                className="customization__avatar-option customization__avatar-option--upload"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Subir una imagen de perfil"
                                title="Subir una imagen"
                            >
                                +
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="customization__hidden-input"
                            />
                        </div>
                    </section>

                    <section className="customization__card customization__card--pieces">
                        <img className="customization__card-image" src={piecesSheetImage} alt="" aria-hidden="true" />

                        <div className="customization__boards-preview">
                            <div className="customization__board-slot customization__board-slot--1v1">
                                <div className="customization__board-preview customization__board-preview--1v1">
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_1V1[selectedPiece1v1].sideA }}
                                    />
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_1V1[selectedPiece1v1].sideB }}
                                    />
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_1V1[selectedPiece1v1].sideB }}
                                    />
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_1V1[selectedPiece1v1].sideA }}
                                    />
                                </div>
                            </div>

                            <div className="customization__board-slot customization__board-slot--4p">
                                <div className="customization__board-preview customization__board-preview--4p">
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_4P[selectedPiece4p].p1 }}
                                    />
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_4P[selectedPiece4p].p2 }}
                                    />
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_4P[selectedPiece4p].p3 }}
                                    />
                                    <span
                                        className="customization__board-piece"
                                        style={{ background: PIECE_STYLES_4P[selectedPiece4p].p4 }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="customization__piece-groups">
                            <div className="customization__piece-group" role="listbox" aria-label="Estilo de fichas para 1 contra 1">
                                {PIECE_STYLES_1V1.map((style, index) => (
                                    <button
                                        key={style.label}
                                        className={`customization__piece-option ${index === selectedPiece1v1 ? 'customization__piece-option--selected' : ''}`}
                                        onClick={() => {
                                            setSelectedPiece1v1(index)
                                            void handleSaveCustomization(index, selectedPiece4p, selectedAvatar, customAvatar)
                                        }}
                                        aria-label={`Seleccionar fichas 1v1: ${style.label}`}
                                        title={style.label}
                                    >
                                        <span
                                            className="customization__piece-token"
                                            style={{
                                                background: `linear-gradient(180deg, ${style.sideA} 0 50%, ${style.sideB} 50% 100%)`,
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="customization__piece-group customization__piece-group--quad" role="listbox" aria-label="Estilo de fichas para 1 contra 1 contra 1 contra 1">
                                {PIECE_STYLES_4P.map((style, index) => (
                                    <button
                                        key={style.label}
                                        className={`customization__piece-option ${index === selectedPiece4p ? 'customization__piece-option--selected' : ''}`}
                                        onClick={() => {
                                            setSelectedPiece4p(index)
                                            void handleSaveCustomization(selectedPiece1v1, index, selectedAvatar, customAvatar)
                                        }}
                                        aria-label={`Seleccionar fichas 1v1v1v1: ${style.label}`}
                                        title={style.label}
                                    >
                                        <span
                                            className="customization__piece-token"
                                            style={{
                                                background: `conic-gradient(from -45deg, ${style.p1} 0 25%, ${style.p2} 25% 50%, ${style.p3} 50% 75%, ${style.p4} 75% 100%)`,
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <button
                    className="customization__back-button"
                    onClick={() => onNavigate('menu')}
                    aria-label="Volver al menú principal"
                    title="Volver al menú"
                >
                    <img src={backToMenuButtonImage} alt="" />
                </button>
            </main>
        </div>
    )
}

export default Customization
