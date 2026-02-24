const STORAGE_KEY = 'brugger_themes';

function getThemes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
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
