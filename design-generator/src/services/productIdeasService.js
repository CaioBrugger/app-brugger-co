import { supabase } from '../lib/supabase';

export async function fetchProductIdeas() {
    const { data, error } = await supabase
        .from('product_ideas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        reasoning: row.reasoning,
        category: row.category,
        status: row.status,
        priceRange: row.price_range,
        source: row.source,
        councilData: row.council_data,
        createdAt: row.created_at
    }));
}

export async function saveProductIdea(idea) {
    const id = idea.id || crypto.randomUUID();
    const row = {
        id,
        name: idea.name,
        description: idea.description || '',
        reasoning: idea.reasoning || '',
        category: idea.category || 'AT',
        status: idea.status || 'idea',
        price_range: idea.priceRange || 'low_ticket',
        source: idea.source || 'ai_council',
        council_data: idea.councilData || {}
    };

    const { data, error } = await supabase
        .from('product_ideas')
        .upsert(row)
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        reasoning: data.reasoning,
        category: data.category,
        status: data.status,
        priceRange: data.price_range,
        source: data.source,
        councilData: data.council_data,
        createdAt: data.created_at
    };
}

export async function updateIdeaStatus(id, status) {
    const { error } = await supabase
        .from('product_ideas')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}

export async function deleteProductIdea(id) {
    const { error } = await supabase
        .from('product_ideas')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
