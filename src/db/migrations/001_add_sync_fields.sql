-- Migration 001 — Champs nécessaires pour la synchro mobile
-- À exécuter dans l'éditeur SQL de Supabase (une seule fois).

ALTER TABLE public.observations
  ADD COLUMN IF NOT EXISTS client_id   UUID,
  ADD COLUMN IF NOT EXISTS latitude    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Index partiel : garantit l'unicité de client_id uniquement quand il est fourni.
-- Les observations sans client_id (NULL) peuvent coexister sans conflit.
CREATE UNIQUE INDEX IF NOT EXISTS observations_client_id_idx
  ON public.observations (client_id)
  WHERE client_id IS NOT NULL;
