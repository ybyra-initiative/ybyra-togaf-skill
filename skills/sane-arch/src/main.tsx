import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import App from './App.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('#root missing from index.html');

createRoot(container).render(<App />);
