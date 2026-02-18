import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DesignGenerator from './pages/DesignGenerator';
import AgentsHub from './pages/AgentsHub';
import SkillsHub from './pages/SkillsHub';
import WorkflowsHub from './pages/WorkflowsHub';
import DesignSystemPage from './pages/DesignSystemPage';
import DesignExtractor from './pages/DesignExtractor';

export default function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/design" element={<DesignGenerator />} />
                    <Route path="/agents" element={<AgentsHub />} />
                    <Route path="/skills" element={<SkillsHub />} />
                    <Route path="/workflows" element={<WorkflowsHub />} />
                    <Route path="/design-system" element={<DesignSystemPage />} />
                    <Route path="/extractor" element={<DesignExtractor />} />
                </Routes>
            </main>
        </div>
    );
}

