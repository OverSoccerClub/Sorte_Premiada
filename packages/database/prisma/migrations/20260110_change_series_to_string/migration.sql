-- Primeiro, converter a coluna para TEXT (permitir valores temporários)
ALTER TABLE "Area" ALTER COLUMN "seriesNumber" TYPE TEXT USING "seriesNumber"::TEXT;

-- Atualizar valores existentes para formato com 4 dígitos
UPDATE "Area" 
SET "seriesNumber" = LPAD("seriesNumber", 4, '0') 
WHERE "seriesNumber" IS NOT NULL 
  AND "seriesNumber" ~ '^[0-9]+$'; -- Apenas se for numérico

-- Agora a coluna já está como TEXT com valores formatados
