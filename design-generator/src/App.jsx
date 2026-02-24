import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

const DesignGenerator = lazy(() => import('./pages/DesignGenerator'));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'));
const Products = lazy(() => import('./pages/Products'));

export default function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Suspense fallback={<div style={{ padding: '2rem', color: '#fff' }}>Carregando dados...</div>}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/design" element={<DesignGenerator />} />
                        <Route path="/design-system" element={<DesignSystemPage />} />
                        <Route path="/products" element={<Products />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
}

