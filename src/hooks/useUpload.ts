import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useUpload = () => {
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error } = await supabase.storage
                .from('files')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            const { data } = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading };
};
