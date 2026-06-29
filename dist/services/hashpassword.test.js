import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './hashpassword.js';
describe('hashPassword', () => {
    it('retourne une chaîne différente du mot de passe original', async () => {
        const hash = await hashPassword('monMotDePasse');
        expect(hash).not.toBe('monMotDePasse');
    });
    it('retourne un hash bcrypt (commence par $2b$)', async () => {
        const hash = await hashPassword('monMotDePasse');
        expect(hash.startsWith('$2b$')).toBe(true);
    });
    it('produit des hashes différents pour le même mot de passe (salt aléatoire)', async () => {
        const hash1 = await hashPassword('monMotDePasse');
        const hash2 = await hashPassword('monMotDePasse');
        expect(hash1).not.toBe(hash2);
    });
});
describe('verifyPassword', () => {
    it('retourne true pour le bon mot de passe', async () => {
        const hash = await hashPassword('motDePasseSecret');
        expect(await verifyPassword('motDePasseSecret', hash)).toBe(true);
    });
    it('retourne false pour un mot de passe incorrect', async () => {
        const hash = await hashPassword('motDePasseSecret');
        expect(await verifyPassword('mauvaisMotDePasse', hash)).toBe(false);
    });
    it('retourne false pour une chaîne vide', async () => {
        const hash = await hashPassword('motDePasseSecret');
        expect(await verifyPassword('', hash)).toBe(false);
    });
});
