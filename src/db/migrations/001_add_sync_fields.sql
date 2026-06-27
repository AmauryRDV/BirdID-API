-- Migration 001 — Champs nécessaires pour la synchro mobile
-- À exécuter une seule fois sur la base de données de production.

ALTER TABLE observations
  ADD COLUMN IF NOT EXISTS client_id  UUID           UNIQUE,
  ADD COLUMN IF NOT EXISTS latitude   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW();

-- Remplir created_at/updated_at pour les lignes existantes (si la colonne vient d'être ajoutée)
UPDATE observations SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;
