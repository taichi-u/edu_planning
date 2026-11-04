import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import './styles.css';
import ResearchPreview from './research-preview';

createRoot(document.getElementById('root')!).render(<ResearchPreview />);
