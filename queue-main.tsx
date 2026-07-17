import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import QueuePage from './pages/QueuePage.js';

const rootElement = document.querySelector('#root');
if (!rootElement) {
	throw new Error('Root element not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<QueuePage />
	</StrictMode>,
);
