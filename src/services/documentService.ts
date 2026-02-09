import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
// import { Block, BlockType } from '../store/useDocumentStore';

// Removed unused DocumentRow
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];
// Removed unused BlockRow
type BlockInsert = Database['public']['Tables']['blocks']['Insert'];
type BlockUpdate = Database['public']['Tables']['blocks']['Update'];

export const documentService = {
    async getDocuments() {
        // Try to select with new columns first
        let { data: documents, error } = await supabase
            .from('documents')
            .select('*, is_full_width, font_style, is_published')
            .order('position', { ascending: true });

        if (error) {
            console.warn("Failed to fetch with new columns, falling back to legacy schema", error);
            // Fallback for legacy schema
            const fallbackResult = await supabase
                .from('documents')
                .select('*')
                .order('position', { ascending: true });

            if (fallbackResult.error) throw fallbackResult.error;
            documents = fallbackResult.data;
        }

        // Also get the blocks for these documents
        // Note: In a real app with many docs, you might want to fetch blocks on demand
        // For now, let's fetch blocks for all documents to match store structure
        const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('*')
            .order('position', { ascending: true });

        if (blocksError) throw blocksError;

        return { documents, blocks };
    },

    async createDocument(document: DocumentInsert) {
        const { data, error } = await supabase
            .from('documents')
            .insert([document])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateDocument(id: string, updates: DocumentUpdate) {
        const { data, error } = await supabase
            .from('documents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteDocument(id: string) {
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async createBlock(block: BlockInsert) {
        const { data, error } = await supabase
            .from('blocks')
            .insert([block])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateBlock(id: string, updates: BlockUpdate) {
        const { data, error } = await supabase
            .from('blocks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBlock(id: string) {
        const { error } = await supabase
            .from('blocks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Batch updates for blocks (useful for reordering)
    async upsertBlocks(blocks: BlockInsert[]) {
        const { data, error } = await supabase
            .from('blocks')
            .upsert(blocks)
            .select();

        if (error) throw error;
        return data;
    }
};
