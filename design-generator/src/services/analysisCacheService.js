import { supabase } from '../lib/supabase';

/**
 * Busca análise cacheada para uma LP.
 * @param {string} lpId
 * @returns {{ result: object, updated_at: string } | null}
 */
export async function getCachedAnalysis(lpId) {
    const { data, error } = await supabase
        .from('lp_analyses')
        .select('result, updated_at')
        .eq('lp_id', lpId)
        .single();

    if (error || !data) return null;
    return data;
}

/**
 * Salva ou atualiza a análise de uma LP no cache.
 * @param {string} lpId
 * @param {object} result
 */
export async function saveAnalysis(lpId, result) {
    const { error } = await supabase
        .from('lp_analyses')
        .upsert(
            { lp_id: lpId, result, updated_at: new Date().toISOString() },
            { onConflict: 'lp_id' }
        );

    if (error) throw error;
}
