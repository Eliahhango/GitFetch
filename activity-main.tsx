import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import ActivityPage from './pages/ActivityPage.js';

const rootElement = document.querySelector('#root');
if (!rootElement) {
	throw new Error('Root element not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<ActivityPage />
	</StrictMode>,
);
