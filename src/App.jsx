import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import VideoList from './VideoList.jsx'
import VideoPage from './VideoPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VideoList />} />
        <Route path="/videos/:id" element={<VideoPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
