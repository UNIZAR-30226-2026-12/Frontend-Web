import '../styles/background.css'
import '../styles/pages/Rules.css'

interface RulesProps {
  onNavigate: (screen: string, data?: any) => void
}

function Rules({ onNavigate }: RulesProps) {
  return (
    <div className="rules">
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

      <main className="rules__content">
        <header className="rules__header">
          <h1 className="rules__title">Reglas de Random Reversi</h1>
        </header>

        <section className="rules__panel">
          <h2>📜 Cómo jugar</h2>
          <p>🎯 <strong>Objetivo:</strong> terminar con más puntos que el resto de jugadores.</p>
          <p>
            🧩 <strong>Diferencia clave frente a Reversi normal:</strong> hay casillas especiales <strong>(❓)</strong> y, al colocar fichas
            sobre ellas, consigues habilidades especiales que puedes usar durante la partida.
          </p>

          <p>🕹️ <strong>Modos:</strong> 1v1 (tablero 8x8, 2 jugadores) y 1v1v1v1 (tablero 16x16, 4 jugadores).</p>

          <p>▶️ <strong>Cómo se juega (paso a paso):</strong></p>
          <ul>
            <li>🏁 <strong>Inicio:</strong> el tablero inicia con las fichas iniciales de los jugadores y casillas especiales <strong>(❓)</strong> repartidas aleatoriamente.</li>
            <li>🔁 <strong>Tu turno:</strong> eliges una única acción: hacer un movimiento normal o usar una habilidad.</li>
            <li>♟️ <strong>Movimiento normal:</strong> pones una ficha en una casilla vacía que encierra al menos una ficha rival entre tu ficha nueva y otra tuya, en línea recta (horizontal, vertical o diagonal).</li>
            <li>🔄 Las fichas <strong>rivales encerradas</strong> se voltean a <strong>tu color</strong>.</li>
            <li>❓ Si colocas una ficha sobre una <strong>casilla especial (❓)</strong>, ganas una <strong>habilidad aleatoria</strong> y la casilla deja de ser especial.</li>
            <li>⛔ Si no puedes mover ni usar habilidad, <strong>pierdes tu turno</strong>.</li>
            <li>🏁 La partida acaba si nadie puede jugar en una <strong>vuelta completa</strong> o si no quedan <strong>casillas para jugar</strong>.</li>
            <li>🧮 <strong>Puntuación final:</strong> fichas propias en tablero - (2 × habilidades no utilizadas).</li>
            <li>🏆 Gana quien tenga <strong>mayor puntuación final</strong>; si hay empate, se considera un empate.</li>
          </ul>

          <p>🧠 <strong>Reglas del uso de habilidades:</strong></p>
          <ul>
            <li>Usar una <strong>habilidad consume tu turno</strong>.</li>
            <li>Si una habilidad necesita objetivo y no existe, <strong>no se puede usar</strong>.</li>
            <li>En 1v1v1v1 puedes elegir a qué rival aplicarla <strong>cuando corresponda</strong>.</li>
            <li>Las habilidades que no uses al final <strong>te penalizan puntos</strong>, por lo que conviene utilizarlas independientemente de que sean buenas o malas.</li>
          </ul>

          <p>💥 <strong>Habilidades (abre cada una para ver descripción):</strong></p>
          <div className="rules__skills">
            <details>
              <summary>🧲 Gravedad (⬆️⬇️⬅️➡️)</summary>
              <p>Desplaza todas las fichas del tablero hacia la dirección elegida, excepto las fichas fijas.</p>
            </details>
            <details>
              <summary>💣 Bomba 3x3</summary>
              <p>En el área 3x3 seleccionada, todas las fichas se voltean sin importar su dueño.</p>
            </details>
            <details>
              <summary>🔒 Poner ficha fija</summary>
              <p>Convierte una ficha propia colocada en el tablero en fija (no puede moverse ni voltearse).</p>
            </details>
            <details>
              <summary>🔓 Quitar ficha fija</summary>
              <p>Libera una ficha fija para que vuelva a ser una ficha normal. Si no hay fichas fijas en el tablero, no se puede usar.</p>
            </details>
            <details>
              <summary>✨ Poner ficha libre</summary>
              <p>Permite colocar una ficha propia en cualquier casilla vacía sin necesidad de capturar fichas rivales.</p>
            </details>
            <details>
              <summary>⏭️ Saltar turno del rival</summary>
              <p>El siguiente rival pierde su turno.</p>
            </details>
            <details>
              <summary>🚫 Pierdes tu turno</summary>
              <p>Al utilizarla, pierdes tu turno actual.</p>
            </details>
            <details>
              <summary>🔄 Voltear una ficha del rival</summary>
              <p>Convierte una ficha rival elegida a tu color.</p>
            </details>
            <details>
              <summary>🔁 Cambiar colores con otro jugador</summary>
              <p>Intercambia todas tus fichas del tablero con las del rival seleccionado.</p>
            </details>
            <details>
              <summary>🥷 Robar habilidad</summary>
              <p>Robas una habilidad aleatoria de un rival. Si nadie tiene habilidades, no se puede usar.</p>
            </details>
            <details>
              <summary>🔃 Intercambiar habilidad</summary>
              <p>Das una habilidad tuya y recibes una del rival seleccionado. Si no hay habilidades en el jugador origen y/o destino, no se puede usar.</p>
            </details>
            <details>
              <summary>🎁 Dar habilidad</summary>
              <p>Entregas una habilidad que tengas en tu posesión a otro jugador. Si no tienes ninguna, no se puede usar.</p>
            </details>
          </div>
        </section>

        <button className="rules__back" onClick={() => onNavigate('menu')}>
          Volver al menú
        </button>
      </main>
    </div>
  )
}

export default Rules

