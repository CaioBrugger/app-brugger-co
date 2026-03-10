import { supabase } from '../lib/supabase';

export const COMPONENT_CATEGORIES = [
    { id: 'carousel',    label: 'Carrossel' },
    { id: 'hero',        label: 'Hero' },
    { id: 'testimonial', label: 'Depoimentos' },
    { id: 'faq',         label: 'FAQ' },
    { id: 'cta',         label: 'CTA' },
    { id: 'features',    label: 'Benefícios' },
    { id: 'pricing',     label: 'Preços' },
    { id: 'custom',      label: 'Customizado' },
];

export async function fetchComponents() {
    const { data, error } = await supabase
        .from('lp_components')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function saveComponent({ name, category, description, html }) {
    const { data, error } = await supabase
        .from('lp_components')
        .insert([{ name, category, description: description || '', html }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateComponent(id, { name, category, description, html }) {
    const { data, error } = await supabase
        .from('lp_components')
        .update({ name, category, description: description || '', html })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteComponent(id) {
    const { error } = await supabase
        .from('lp_components')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
