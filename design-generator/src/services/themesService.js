const STORAGE_KEY = 'brugger_themes';

const DEFAULT_THEME = {
    id: "default-dark-luxury",
    name: "Saber Cristão (Padrão)",
    createdAt: new Date().toISOString(),
    tokens: {
        bg: "#0C0C0E",
        surface: "#131316",
        surface2: "#1A1A1F",
        border: "#2A2A32",
        text: "#FAFAFA",
        textSecondary: "#A0A0A8",
        accent: "#C9A962",
        accentLight: "#DFC07A",
        fontHeading: "'DM Serif Display', Georgia, serif",
        fontBody: "'DM Sans', sans-serif"
    }
};

function getThemes() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Seed default theme
            const initialThemes = [DEFAULT_THEME];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialThemes));
            return initialThemes;
        }

        const parsed = JSON.parse(stored);
        if (parsed.length === 0) {
            // Seed default theme if array is empty
            const initialThemes = [DEFAULT_THEME];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialThemes));
            return initialThemes;
        }

        return parsed;
    } catch {
        return [DEFAULT_THEME];
    }
}

function persist(themes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function fetchThemes() {
    return Promise.resolve(getThemes());
}

export function saveTheme(theme) {
    const themes = getThemes();
    const newTheme = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...theme
    };
    themes.unshift(newTheme);
    persist(themes);
    return Promise.resolve(newTheme);
}

export function updateTheme(id, data) {
    const themes = getThemes();
    const idx = themes.findIndex(t => t.id === id);
    if (idx === -1) return Promise.reject(new Error('Tema não encontrado'));
    themes[idx] = { ...themes[idx], ...data };
    persist(themes);
    return Promise.resolve(themes[idx]);
}

export function deleteTheme(id) {
    const themes = getThemes().filter(t => t.id !== id);
    persist(themes);
    return Promise.resolve();
}
