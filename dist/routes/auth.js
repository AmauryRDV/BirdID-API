import { verify } from 'jsonwebtoken';
import 'dotenv/config'; // Assurez-vous que les variables d'environnement sont chargées
// Récupérez votre clé secrète JWT depuis les variables d'environnement
// Utilisez une clé forte et unique en production !
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_jwt_par_defaut';
export const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Accès non autorisé: Jeton manquant ou mal formé' }, 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verify(token, JWT_SECRET); // Adaptez le type de payload si nécessaire
        c.set('user', decoded); // Attache les informations de l'utilisateur au contexte
        await next();
    }
    catch (err) {
        console.error('Erreur de vérification JWT:', err);
        return c.json({ error: 'Accès non autorisé: Jeton invalide' }, 403);
    }
};
