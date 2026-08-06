import { HashRouter, Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import Quiz from './routes/Quiz';
import Results from './routes/Results';
import Refine from './routes/Refine';
import Together from './routes/Together';

// HashRouter keeps client-side routing working on static hosts (e.g. GitHub Pages)
// without server-side rewrites, so deep links and refreshes never 404.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/refine" element={<Refine />} />
        <Route path="/together" element={<Together />} />
      </Routes>
    </HashRouter>
  );
}
