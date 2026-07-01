import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Variable d'environnement(s) manquante");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
export const deleteObservationImage = async (publicUrl, bucketName) => {
    try {
        const marker = `/storage/v1/object/public/${bucketName}/`;
        const idx = publicUrl.indexOf(marker);
        if (idx === -1)
            return;
        const filePath = decodeURIComponent(publicUrl.substring(idx + marker.length));
        const { error } = await supabase.storage.from(bucketName).remove([filePath]);
        if (error)
            console.error('Erreur suppression image storage:', error);
    }
    catch (err) {
        console.error('Erreur suppression image storage:', err);
    }
};
export const uploadObservationImage = async (file, bucketName, filePath) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const extension = filePath.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'png':
                contentType = 'image/png';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
        }
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, arrayBuffer, { contentType: contentType, upsert: true });
        if (error)
            throw error;
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        return publicUrlData.publicUrl;
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi', error);
        throw new Error('Échec de l\'upload de l\'image vers le storage');
    }
};
