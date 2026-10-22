import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { ReferentielsProvider } from '../contexts/ReferentielsContext.jsx';
import { ToastProvider } from '../contexts/ToastContext.jsx';
import { router } from './router.jsx';

export default function App() {
  return (
    <ToastProvider>
      <ReferentielsProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ReferentielsProvider>
    </ToastProvider>
  );
}
