import '../styles/pages/Rules.css'
import rulesTitleImage from '../assets/reglas/tituloReglas.png'
import rulesSheet from '../assets/reglas/libretaReglas.png'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import backToMenuButtonImage from '../assets/elementosGenerales/botonVolverMenu.png'
import questionMark from '../assets/elementosGenerales/interrogante.png'
import logoReversi from '../assets/elementosGenerales/logoReversi.png'
import redChip from '../assets/elementosGenerales/fichaRoja.png'
import greenChip from '../assets/elementosGenerales/fichaVerde.png'

interface RulesProps {
  onNavigate: (screen: string, data?: any) => void
}

function Rules({ onNavigate }: RulesProps) {
  return (
    <div className="rules">
      <img className="rules__background" src={menuBackground} alt="" aria-hidden="true" />
      <div className="rules__overlay" aria-hidden="true"></div>

      <div className="rules__question-layer" aria-hidden="true">
        <img className="rules__question rules__question--1" src={questionMark} alt="" />
        <img className="rules__question rules__question--2" src={questionMark} alt="" />
        <img className="rules__question rules__question--3" src={questionMark} alt="" />
        <img className="rules__question rules__question--4" src={questionMark} alt="" />
      </div>

      <header className="rules__topbar">
        <img className="rules__logo" src={logoReversi} alt="Random Reversi" />
        <div className="rules__chips" aria-hidden="true">
          <img className="rules__chip rules__chip--red" src={redChip} alt="" />
          <img className="rules__chip rules__chip--green" src={greenChip} alt="" />
        </div>
      </header>

      <main className="rules__stage">
        <img className="rules__title-image" src={rulesTitleImage} alt="Reglas del Random Reversi" />

        <section className="rules__sheet">
          <img className="rules__sheet-bg" src={rulesSheet} alt="" aria-hidden="true" />

          <article className="rules__scroll">
            <h2>Como jugar</h2>
            <p>
              El objetivo es terminar la partida con mas puntuacion que tus rivales.
              En Random Reversi hay casillas especiales (?), y cuando colocas una ficha sobre una de ellas,
              recibes una habilidad aleatoria.
            </p>

            <p className="rules__subhead">Modos disponibles</p>
            <ul>
              <li><strong>1vs1:</strong> tablero 8x8 para dos jugadores.</li>
              <li><strong>1vs1vs1vs1:</strong> tablero 16x16 para cuatro jugadores.</li>
            </ul>

            <p className="rules__subhead">Turno y movimiento</p>
            <ul>
              <li>En cada turno eliges una sola accion: mover o usar habilidad.</li>
              <li>Un movimiento normal debe encerrar fichas rivales en linea recta (horizontal, vertical o diagonal).</li>
              <li>Las fichas rivales encerradas se voltean a tu color.</li>
              <li>Si no puedes mover ni usar habilidad, pierdes el turno.</li>
            </ul>

            <p className="rules__subhead">Fin de partida y puntuacion</p>
            <ul>
              <li>La partida termina cuando nadie puede jugar en una vuelta completa o no quedan casillas validas.</li>
              <li>La puntuacion final se calcula como: fichas propias - (2 x habilidades no utilizadas).</li>
              <li>Gana el jugador con mayor puntuacion; si empatan, se considera empate.</li>
            </ul>

            <h2>Uso de habilidades</h2>
            <ul>
              <li>Usar una habilidad consume el turno.</li>
              <li>Si una habilidad requiere objetivo y no existe, no puede usarse.</li>
              <li>En 1vs1vs1vs1 puedes elegir al rival objetivo cuando aplique.</li>
              <li>Las habilidades guardadas al final penalizan puntos, asi que conviene gastarlas.</li>
            </ul>

            <h2>Habilidades disponibles</h2>
            <div className="rules__skills">
              <details>
                <summary>Gravedad (arriba, abajo, izquierda, derecha)</summary>
                <p>Desplaza todas las fichas del tablero hacia la direccion elegida, excepto las fichas fijas.</p>
              </details>
              <details>
                <summary>Bomba 3x3</summary>
                <p>En el area 3x3 seleccionada, todas las fichas se voltean sin importar su dueño.</p>
              </details>
              <details>
                <summary>Poner ficha fija</summary>
                <p>Convierte una ficha propia colocada en una ficha fija que no puede moverse ni voltearse.</p>
              </details>
              <details>
                <summary>Quitar ficha fija</summary>
                <p>Libera una ficha fija para que vuelva a ser normal. Si no hay fichas fijas, no se puede usar.</p>
              </details>
              <details>
                <summary>Poner ficha libre</summary>
                <p>Permite colocar una ficha propia en cualquier casilla vacia sin necesidad de capturar.</p>
              </details>
              <details>
                <summary>Saltar turno del rival</summary>
                <p>El siguiente rival pierde su turno.</p>
              </details>
              <details>
                <summary>Pierdes tu turno</summary>
                <p>Al usarla, pierdes tu turno actual.</p>
              </details>
              <details>
                <summary>Voltear una ficha rival</summary>
                <p>Convierte una ficha rival elegida a tu color.</p>
              </details>
              <details>
                <summary>Cambiar colores con otro jugador</summary>
                <p>Intercambia todas tus fichas del tablero con las del rival seleccionado.</p>
              </details>
              <details>
                <summary>Robar habilidad</summary>
                <p>Robas una habilidad aleatoria de un rival. Si los rivales no tienen habilidades, no se puede usar.</p>
              </details>
              <details>
                <summary>Intercambiar habilidad</summary>
                <p>Das una habilidad aleatoria tuya y recibes una aleatoria del rival. Si no hay habilidades en origen o destino, no se puede usar.</p>
              </details>
              <details>
                <summary>Dar habilidad</summary>
                <p>Entregas una habilidad aleatoria de tu mano a otro jugador. Si no tienes ninguna, no se puede usar.</p>
              </details>
            </div>
          </article>
        </section>

        <button className="rules__back" onClick={() => onNavigate('menu')} type="button" aria-label="Volver al menu">
          <img src={backToMenuButtonImage} alt="" />
        </button>
      </main>
    </div>
  )
}

export default Rules

