import maderaBoard1v1 from '../assets/arenas/TableroMadera1v1.png'
import maderaBoard4p from '../assets/arenas/TableroMadera1v1v1v1.png'
import maderaBackground from '../assets/arenas/FondoMadera.png'
import cuarzoBoard1v1 from '../assets/arenas/TableroCuarzo1v1.png'
import cuarzoBoard4p from '../assets/arenas/TableroCuarzo1v1v1v1.png'
import cuarzoBackground from '../assets/arenas/FondoCuarzo.png'
import fuegoBoard1v1 from '../assets/arenas/TableroFuego1v1.png'
import fuegoBoard4p from '../assets/arenas/TableroFuego1v1v1v1.png'
import fuegoBackground from '../assets/arenas/FondoFuego.png'
import hieloBoard1v1 from '../assets/arenas/TableroHielo1v1.png'
import hieloBoard4p from '../assets/arenas/TableroHielo1v1v1v1.png'
import hieloBackground from '../assets/arenas/FondoHielo.png'

interface ArenaAssets {
    board1v1: string
    board4p: string
    background: string
}

const ARENA_ASSETS = {
    madera: {
        board1v1: maderaBoard1v1,
        board4p: maderaBoard4p,
        background: maderaBackground,
    },
    cuarzo: {
        board1v1: cuarzoBoard1v1,
        board4p: cuarzoBoard4p,
        background: cuarzoBackground,
    },
    fuego: {
        board1v1: fuegoBoard1v1,
        board4p: fuegoBoard4p,
        background: fuegoBackground,
    },
    hielo: {
        board1v1: hieloBoard1v1,
        board4p: hieloBoard4p,
        background: hieloBackground,
    },
} satisfies Record<string, ArenaAssets>

export function getArenaAssetsByRr(rr: number) {
    if (rr < 900) return ARENA_ASSETS.madera
    if (rr < 1100) return ARENA_ASSETS.cuarzo
    if (rr < 1300) return ARENA_ASSETS.fuego
    return ARENA_ASSETS.hielo
}
