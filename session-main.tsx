import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import SessionPage from './pages/SessionPage.js';

const rootElement = document.querySelector('#root');
if (!rootElement) {
	throw new Error('Root element not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<SessionPage />
	</StrictMode>,
);
