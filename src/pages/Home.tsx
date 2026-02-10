import './Home.css'

function Home() {
  return (
    <div className="home">
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

      <main className="home__content">
        {/* Logo / Título */}
        <div className="home__header">
          <h1 className="home__title">
            <span className="home__title-random">Random</span>
            <span className="home__title-reversi">Reversi</span>
          </h1>
          <p className="home__subtitle">
            El clásico Reversi reinventado con habilidades especiales, 
            casillas sorpresa y partidas de hasta 4 jugadores.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="home__actions">
          <button className="home__btn home__btn--primary">
            Iniciar Sesión
          </button>
          <button className="home__btn home__btn--secondary">
            Crear Cuenta
          </button>
        </div>

        {/* Footer */}
        <footer className="home__footer">
          <p>HuQ Games Studio &middot; Universidad de Zaragoza</p>
        </footer>
      </main>
    </div>
  )
}

export default Home
