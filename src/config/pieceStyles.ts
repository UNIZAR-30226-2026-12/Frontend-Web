export interface PieceStyle1v1 {
    sideA: string
    sideB: string
    sideAName: string
    sideBName: string
    label: string
}

export interface PieceStyle4P {
    p1: string
    p2: string
    p3: string
    p4: string
    p1Name: string
    p2Name: string
    p3Name: string
    p4Name: string
    label: string
}

/* Estilos de fichas 1v1 (2 colores por estilo) */
export const PIECE_STYLES_1V1: PieceStyle1v1[] = [
    { sideA: '#222', sideB: '#eee', sideAName: 'Negras', sideBName: 'Blancas', label: 'Clasico' },
    { sideA: '#e74c3c', sideB: '#3498db', sideAName: 'Rojas', sideBName: 'Azules', label: 'Fuego y Hielo' },
    { sideA: '#2ecc71', sideB: '#f1c40f', sideAName: 'Verdes', sideBName: 'Amarillas', label: 'Selva' },
    { sideA: '#9b59b6', sideB: '#e67e22', sideAName: 'Moradas', sideBName: 'Naranjas', label: 'Atardecer' },
    { sideA: '#1abc9c', sideB: '#e84393', sideAName: 'Turquesas', sideBName: 'Rosas', label: 'Neon' },
]

/* Estilos de fichas 1v1v1v1 (4 colores por estilo) */
export const PIECE_STYLES_4P: PieceStyle4P[] = [
    { p1: '#18181b', p2: '#f8fafc', p3: '#ef4444', p4: '#3b82f6', p1Name: 'Negras', p2Name: 'Blancas', p3Name: 'Rojas', p4Name: 'Azules', label: 'Clasico 4P' },
    { p1: '#22c55e', p2: '#fde047', p3: '#a855f7', p4: '#f97316', p1Name: 'Verdes', p2Name: 'Amarillas', p3Name: 'Moradas', p4Name: 'Naranjas', label: 'Jungla Solar' },
    { p1: '#06b6d4', p2: '#f43f5e', p3: '#84cc16', p4: '#fb7185', p1Name: 'Turquesas', p2Name: 'Fucsias', p3Name: 'Lima', p4Name: 'Rosas', label: 'Cyber Pop' },
    { p1: '#f59e0b', p2: '#14b8a6', p3: '#8b5cf6', p4: '#ef4444', p1Name: 'Doradas', p2Name: 'Turquesas', p3Name: 'Violetas', p4Name: 'Rojas', label: 'Magma Frio' },
    { p1: '#0ea5e9', p2: '#facc15', p3: '#ec4899', p4: '#10b981', p1Name: 'Celestes', p2Name: 'Amarillas', p3Name: 'Rosas', p4Name: 'Esmeraldas', label: 'Tropical RGB' },
]

const normalizeLabel = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const encodePiecePreference = (duelIndex: number, quadIndex: number) => `d${duelIndex}-q${quadIndex}`

export const decodePiecePreference = (value?: string | null) => {
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
