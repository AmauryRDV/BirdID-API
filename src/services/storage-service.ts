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
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'envoi vers Supabase:', error);
    throw new Error('Échec de l\'upload de l\'image vers le storage');
  }
};