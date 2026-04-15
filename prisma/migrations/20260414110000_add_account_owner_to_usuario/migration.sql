ALTER TABLE "Usuario"
ADD COLUMN IF NOT EXISTS "is_account_owner" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Usuario"
SET "is_account_owner" = false;

WITH ranked_users AS (
  SELECT
    u.id,
    ROW_NUMBER() OVER (
      PARTITION BY u.empresa_id
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM "UsuarioPapel" up
            INNER JOIN "Papel" p
              ON p.id = up.papel_id
            WHERE up.usuario_id = u.id
              AND p.codigo = 'ADMIN'
          ) THEN 0
          ELSE 1
        END,
        u."createdAt" ASC,
        u.id ASC
    ) AS rn
  FROM "Usuario" u
)
UPDATE "Usuario" u
SET "is_account_owner" = true
FROM ranked_users ranked
WHERE ranked.id = u.id
  AND ranked.rn = 1;
