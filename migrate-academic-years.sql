-- Script per afegir anys acadèmics i modificar l'estructura de la base de dades

-- 1. Crear taula d'anys acadèmics
CREATE TABLE IF NOT EXISTS anys_academics (
    any_academic_id SERIAL PRIMARY KEY,
    nom VARCHAR NOT NULL,
    data_inici DATE NOT NULL,
    data_fi DATE NOT NULL,
    estat VARCHAR DEFAULT 'actiu',
    observacions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Inserir l'any acadèmic 2024-25
INSERT INTO anys_academics (nom, data_inici, data_fi, estat, observacions) 
VALUES ('2024-25', '2024-09-01', '2025-06-30', 'actiu', 'Curs acadèmic principal del sistema')
ON CONFLICT DO NOTHING;

-- 3. Afegir columna any_academic_id a totes les taules principals

-- Professors
ALTER TABLE professors ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE professors ADD CONSTRAINT fk_professors_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Grups
ALTER TABLE grups ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE grups ADD CONSTRAINT fk_grups_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Aules
ALTER TABLE aules ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE aules ADD CONSTRAINT fk_aules_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Horaris
ALTER TABLE horaris ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE horaris ADD CONSTRAINT fk_horaris_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Sortides
ALTER TABLE sortides ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE sortides ADD CONSTRAINT fk_sortides_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Guardies
ALTER TABLE guardies ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE guardies ADD CONSTRAINT fk_guardies_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Assignacions Guardia
ALTER TABLE assignacions_guardia ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE assignacions_guardia ADD CONSTRAINT fk_assignacions_guardia_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Tasques
ALTER TABLE tasques ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE tasques ADD CONSTRAINT fk_tasques_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- Comunicacions
ALTER TABLE comunicacions ADD COLUMN IF NOT EXISTS any_academic_id INTEGER;
ALTER TABLE comunicacions ADD CONSTRAINT fk_comunicacions_any_academic 
    FOREIGN KEY (any_academic_id) REFERENCES anys_academics(any_academic_id) ON DELETE CASCADE;

-- 4. Actualitzar totes les dades existents per assignar-les a l'any acadèmic 2024-25
UPDATE professors SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE grups SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE aules SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE horaris SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE sortides SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE guardies SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE assignacions_guardia SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE tasques SET any_academic_id = 1 WHERE any_academic_id IS NULL;
UPDATE comunicacions SET any_academic_id = 1 WHERE any_academic_id IS NULL;

-- 5. Fer que les columnes siguin NOT NULL després d'assignar valors
ALTER TABLE professors ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE grups ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE aules ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE horaris ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE sortides ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE guardies ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE assignacions_guardia ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE tasques ALTER COLUMN any_academic_id SET NOT NULL;
ALTER TABLE comunicacions ALTER COLUMN any_academic_id SET NOT NULL;