DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;

ALTER TABLE roles
ADD COLUMN level SMALLINT NOT NULL DEFAULT 0;

UPDATE roles SET level = 99 WHERE name = 'super_admin';
UPDATE roles SET level = 50 WHERE name = 'branch_admin';
UPDATE roles SET level = 30 WHERE name = 'accountant';
UPDATE roles SET level = 20 WHERE name = 'data_analyst';
UPDATE roles SET level = 10 WHERE name = 'instructor';
UPDATE roles SET level = 5 WHERE name = 'recepcionist';
UPDATE roles SET level = 1 WHERE name = 'client';