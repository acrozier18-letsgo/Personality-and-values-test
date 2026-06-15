import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import Quiz from './routes/Quiz';
import Results from './routes/Results';
import Refine from './routes/Refine';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/refine" element={<Refine />} />
      </Routes>
    </BrowserRouter>
  );
}
