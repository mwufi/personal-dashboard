import Dashboard from './components/Dashboard'
import './App.css'
import { BrowserRouter as Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="app">
        <Dashboard />
      </div>
    </Router>
  )
}

export default App
