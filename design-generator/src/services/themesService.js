import { supabase } from '../lib/supabase';

const DEFAULT_THEME = {
    id: 'default-dark-luxury',
    name: 'Saber Cristão (Padrão)',
    description: 'Dark Luxury Biblical',
    createdAt: new Date().toISOString(),
    tokens: {
        bg: '#0C0C0E',
        surface: '#131316',
        surface2: '#1A1A1F',
        border: '#2A2A32',
        text: '#FAFAFA',
        textSecondary: '#A0A0A8',
        accent: '#C9A962',
        accentLight: '#DFC07A',
        fontHeading: "'DM Serif Display', Georgia, serif",
        fontBody: "'DM Sans', sans-serif"
    },
    accentColors: ['#C9A962', '#0C0C0E', '#FAFAFA', '#131316', '#DFC07A']
};

function mapRow(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        tokens: row.tokens,
        previewHtml: row.preview_html,
        accentColors: row.accent_colors,
        createdAt: row.created_at
    };
}

export async function fetchThemes() {
    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('fetchThemes error:', error);
        return [DEFAULT_THEME];
    }

    return data.length > 0 ? data.map(mapRow) : [DEFAULT_THEME];
}

export async function saveTheme(theme) {
    const id = crypto.randomUUID();
    const { data, error } = await supabase
        .from('themes')
        .insert([{
            id,
            name: theme.name || 'Untitled',
            description: theme.description || '',
            tokens: theme.tokens || {},
            preview_html: theme.previewHtml || '',
            accent_colors: theme.accentColors || []
        }])
        .select();

    if (error) {
        console.error('saveTheme error:', error);
        throw error;
    }

    return mapRow(data[0]);
}

export async function updateTheme(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tokens !== undefined) payload.tokens = updates.tokens;
    if (updates.previewHtml !== undefined) payload.preview_html = updates.previewHtml;
    if (updates.accentColors !== undefined) payload.accent_colors = updates.accentColors;

    const { data, error } = await supabase
        .from('themes')
        .update(payload)
        .eq('id', id)
        .select();

    if (error) {
        console.error('updateTheme error:', error);
        throw error;
    }

    return mapRow(data[0]);
}

export async function deleteTheme(id) {
    const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteTheme error:', error);
        throw error;
    }
}
