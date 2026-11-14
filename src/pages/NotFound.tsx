import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Hammer, Dices, ToyBrick } from 'lucide-react'

export function NotFound() {
  return (
    <main id="main" className="page-shell not-found-page">
      <div className="container not-found-inner">
        <div className="not-found-art" aria-hidden="true">
          <span className="not-found-emoji not-found-one"><ToyBrick size={42} /></span>
          <span className="not-found-emoji not-found-two"><Dices size={40} /></span>
          <span className="not-found-emoji not-found-three"><Hammer size={40} /></span>
          <strong>404</strong>
        </div>
        <span className="eyebrow">Wrong turn</span>
        <h1>This shelf is empty.</h1>
        <p>
          The page you're looking for doesn't exist — but there are plenty of good
          things two streets away.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="button button-primary"><ArrowLeft size={16} /> Back home</Link>
          <Link to="/browse" className="button button-outline"><Compass size={16} /> Browse rentals</Link>
        </div>
      </div>
    </main>
  )
}
