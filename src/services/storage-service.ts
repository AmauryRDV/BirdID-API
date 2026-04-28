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
    
    // Determine content type from the file path extension for reliability.
    // The file.type from the client can be missing or incorrect on the server.
    const extension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // Default value
    
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

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'envoi vers Supabase:', error);
    throw new Error('Échec de l\'upload de l\'image vers le storage');
  }
};