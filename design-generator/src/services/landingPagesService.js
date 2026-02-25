import { supabase } from '../lib/supabase';

/**
 * Save a generated landing page to the database.
 */
export async function saveLandingPage({ name, description, themeId, modelUsed, sections }) {
    const htmlContent   = sections.map(s => `<!-- ${s.name || s.id} -->\n${s.html}`).join('\n\n');
    const thumbnailHtml = sections[0]?.html || '';

    const { data, error } = await supabase
        .from('landing_pages')
        .insert([{
            name:           name.trim() || 'Landing Page',
            description:    description || '',
            theme_id:       themeId     || '',
            model_used:     modelUsed   || '',
            section_count:  sections.length,
            sections_json:  sections,
            html_content:   htmlContent,
            thumbnail_html: thumbnailHtml,
        }])
        .select('id, name, created_at')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Fetch list of landing pages (no heavy html_content for performance).
 */
export async function fetchLandingPages() {
    const { data, error } = await supabase
        .from('landing_pages')
        .select('id, name, description, theme_id, model_used, section_count, thumbnail_html, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Fetch a single landing page with full content.
 */
export async function fetchLandingPage(id) {
    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a landing page by id.
 */
export async function deleteLandingPage(id) {
    const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
