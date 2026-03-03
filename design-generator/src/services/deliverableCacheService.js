import { supabase } from '../lib/supabase';
import { downloadBlob } from './docxExportService';

/**
 * Gera a chave única de um entregável baseada no tipo e identificador.
 * - Módulo: "module_1", "module_2", ...
 * - Bônus/OB: "bonus_checklist_produtividade", ...
 * @param {object} item
 * @returns {string}
 */
export function makeDeliverableKey(item) {
    if (item._type === 'module') {
        return `module_${item.numero}`;
    }
    const sanitized = (item.nome || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return `bonus_${sanitized.slice(0, 40)}`;
}

/**
 * Carrega todos os entregáveis cacheados de uma LP em um único query.
 * @param {string} lpId
 * @returns {Map<string, { docx_path: string|null, pdf_path: string|null, generated_at: string, item_nome: string }>}
 */
export async function getDeliverableCache(lpId) {
    const { data, error } = await supabase
        .from('generated_deliverables')
        .select('deliverable_key, docx_path, pdf_path, generated_at, item_nome')
        .eq('lp_id', lpId);

    if (error || !data) return new Map();

    const map = new Map();
    for (const row of data) {
        map.set(row.deliverable_key, {
            docx_path: row.docx_path,
            pdf_path: row.pdf_path,
            generated_at: row.generated_at,
            item_nome: row.item_nome,
        });
    }
    return map;
}

/**
 * Faz upload dos blobs no Storage e salva os paths na tabela.
 * @param {string} lpId
 * @param {string} key
 * @param {string} nome
 * @param {string} tipo
 * @param {Blob|null} docxBlob
 * @param {Blob|null} pdfBlob
 * @returns {{ docx_path: string|null, pdf_path: string|null, generated_at: string }}
 */
export async function saveDeliverable(lpId, key, nome, tipo, docxBlob, pdfBlob) {
    const basePath = `${lpId}/${key}`;
    const docxPath = docxBlob ? `${basePath}.docx` : null;
    const pdfPath = pdfBlob ? `${basePath}.pdf` : null;

    if (docxBlob && docxPath) {
        const { error } = await supabase.storage
            .from('deliverables')
            .upload(docxPath, docxBlob, { upsert: true });
        if (error) throw error;
    }

    if (pdfBlob && pdfPath) {
        const { error } = await supabase.storage
            .from('deliverables')
            .upload(pdfPath, pdfBlob, { upsert: true });
        if (error) throw error;
    }

    const generated_at = new Date().toISOString();

    const { error } = await supabase
        .from('generated_deliverables')
        .upsert(
            {
                lp_id: lpId,
                deliverable_key: key,
                item_nome: nome,
                item_tipo: tipo,
                docx_path: docxPath,
                pdf_path: pdfPath,
                generated_at,
            },
            { onConflict: 'lp_id,deliverable_key' }
        );

    if (error) throw error;

    return { docx_path: docxPath, pdf_path: pdfPath, generated_at };
}

/**
 * Baixa um arquivo do bucket 'deliverables' e dispara o download no browser.
 * @param {string} path - caminho no storage (ex: "lp-uuid/module_1.docx")
 * @param {string} filename - nome sugerido para o download
 */
export async function downloadFromCache(path, filename) {
    const { data, error } = await supabase.storage
        .from('deliverables')
        .download(path);

    if (error) throw error;
    downloadBlob(data, filename);
}
