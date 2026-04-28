import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';


const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; 

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("ERREUR : SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant dans .env.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export const uploadObservationImage = async (file: File, bucketName: string, filePath: string): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream') {
        const extension = filePath.split('.').pop()?.toLowerCase();
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
            // Si l'extension n'est pas dans la liste, contentType conserve sa valeur initiale (potentiellement vide).
        }
    }
    
    // On s'assure de ne jamais envoyer une chaîne vide, ce qui est une valeur d'en-tête invalide.
    // On utilise 'application/octet-stream' comme valeur par défaut si aucun type n'a pu être déterminé.
    const finalContentType = contentType || 'application/octet-stream';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, { contentType: finalContentType, upsert: true });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'envoi vers Supabase:', error);
    throw new Error('Échec de l\'upload de l\'image vers le storage');
  }
};