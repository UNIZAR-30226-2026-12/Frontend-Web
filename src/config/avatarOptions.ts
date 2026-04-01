import blackice from '../assets/avatars/blackice.jpeg'
import bluefire from '../assets/avatars/bluefire.png'
import purplesun from '../assets/avatars/purplesun.png'
import whitegrass from '../assets/avatars/whitegrass.png'
import { getAvatarFromSeed } from '../assets/avatarUtils'

export interface AvatarOption {
    id: string
    src: string
    label: string
}

export const AVATAR_OPTIONS: AvatarOption[] = [
    { id: 'blackice', src: blackice, label: 'Black Ice' },
    { id: 'bluefire', src: bluefire, label: 'Blue Fire' },
    { id: 'whitegrass', src: whitegrass, label: 'White Grass' },
    { id: 'purplesun', src: purplesun, label: 'Purple Sun' },
]

export const getPresetAvatarById = (id?: string | null) => {
    if (!id) return undefined
    return AVATAR_OPTIONS.find(avatar => avatar.id === id)
}

export const resolveUserAvatar = (avatarUrl?: string | null, fallbackName = 'Jugador') => {
    const preset = getPresetAvatarById(avatarUrl)
    if (preset) return preset.src

    if (!avatarUrl) {
        return getAvatarFromSeed(fallbackName)
    }

    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
        return avatarUrl
    }

    if (avatarUrl.startsWith('/uploads/')) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
        return `${protocol}//${hostname}:8081${avatarUrl}`;
    }

    return getAvatarFromSeed(fallbackName)
}
