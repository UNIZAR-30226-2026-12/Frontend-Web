import blackice from './avatars/blackice.jpeg'
import bluefire from './avatars/bluefire.png'
import purplesun from './avatars/purplesun.png'
import whitegrass from './avatars/whitegrass.png'

const AVATARS = [purplesun, bluefire, whitegrass, blackice]

export function getAvatarFromSeed(seed: string | number): string {
    const value = String(seed)
    let hash = 0

    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0
    }

    return AVATARS[hash % AVATARS.length]
}
