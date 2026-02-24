import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

const DesignGenerator = lazy(() => import('./pages/DesignGenerator'));
const Products = lazy(() => import('./pages/Products'));
const Themes = lazy(() => import('./pages/Themes'));
const Overview = lazy(() => import('./pages/design-system/Overview'));
const Identity = lazy(() => import('./pages/design-system/Identity'));
const Colors = lazy(() => import('./pages/design-system/tokens/Colors'));
const Typography = lazy(() => import('./pages/design-system/tokens/Typography'));
const Spacing = lazy(() => import('./pages/design-system/tokens/Spacing'));
const RadiusShadows = lazy(() => import('./pages/design-system/tokens/RadiusShadows'));
const Buttons = lazy(() => import('./pages/design-system/components/Buttons'));
const Cards = lazy(() => import('./pages/design-system/components/Cards'));
const TypographyQuotes = lazy(() => import('./pages/design-system/components/TypographyQuotes'));
const AccordionFaq = lazy(() => import('./pages/design-system/components/AccordionFaq'));
const Price = lazy(() => import('./pages/design-system/components/Price'));
const Docs = lazy(() => import('./pages/design-system/Docs'));

export default function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Suspense fallback={<div style={{ padding: '2rem', color: '#fff' }}>Carregando dados...</div>}>
                    <Routes>
                        {/* Main App Routes */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/design" element={<DesignGenerator />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/themes" element={<Themes />} />

                        {/* Design System Routes */}
                        <Route path="/design-system" element={<Overview />} />
                        <Route path="/design-system/identity" element={<Identity />} />
                        <Route path="/design-system/tokens/colors" element={<Colors />} />
                        <Route path="/design-system/tokens/typography" element={<Typography />} />
                        <Route path="/design-system/tokens/spacing" element={<Spacing />} />
                        <Route path="/design-system/tokens/radius-shadows" element={<RadiusShadows />} />
                        <Route path="/design-system/components/buttons" element={<Buttons />} />
                        <Route path="/design-system/components/cards" element={<Cards />} />
                        <Route path="/design-system/components/typography" element={<TypographyQuotes />} />
                        <Route path="/design-system/components/accordion" element={<AccordionFaq />} />
                        <Route path="/design-system/components/price" element={<Price />} />
                        <Route path="/design-system/docs" element={<Docs />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
}
