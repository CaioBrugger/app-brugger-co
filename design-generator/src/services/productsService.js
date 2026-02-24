import { supabase } from '../lib/supabase';

export async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            category,
            icon,
            description,
            sort_order,
            product_links (
                language,
                url,
                checkout_basic,
                checkout_full
            )
        `)
        .order('sort_order', { ascending: true });

    if (error) throw error;

    return data.map(product => ({
        ...product,
        languages: Object.fromEntries(
            product.product_links.map(link => [
                link.language,
                {
                    url: link.url || undefined,
                    checkoutBasic: link.checkout_basic || undefined,
                    checkoutFull: link.checkout_full || undefined,
                }
            ])
        )
    }));
}

export async function getTotalActiveLinks() {
    const { data, error } = await supabase
        .from('product_links')
        .select('url, checkout_basic, checkout_full');

    if (error) throw error;

    return data.reduce((count, link) => {
        if (link.url) count++;
        if (link.checkout_basic) count++;
        if (link.checkout_full) count++;
        return count;
    }, 0);
}
