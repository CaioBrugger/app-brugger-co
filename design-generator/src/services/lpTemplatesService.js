import { supabase } from '../lib/supabase';

export async function saveTemplate({ name, description, sections, themeId }) {
    const { data, error } = await supabase
        .from('lp_templates')
        .insert([{
            name: name.trim() || 'Template',
            description: description || '',
            sections_json: sections,
            thumbnail_html: sections[0]?.html || '',
            theme_id: themeId || null,
        }])
        .select('id, name, created_at')
        .single();
    if (error) throw error;
    return data;
}

export async function fetchTemplates() {
    const { data, error } = await supabase
        .from('lp_templates')
        .select('id, name, description, thumbnail_html, theme_id, created_at')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function fetchTemplate(id) {
    const { data, error } = await supabase
        .from('lp_templates')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function deleteTemplate(id) {
    const { error } = await supabase
        .from('lp_templates')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
