import { supabase } from '../lib/supabase';

export async function fetchTodos() {
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createTodo(text) {
    const { data, error } = await supabase
        .from('todos')
        .insert({ text, done: false })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function toggleTodo(id, done) {
    const { data, error } = await supabase
        .from('todos')
        .update({ done, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteTodo(id) {
    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
