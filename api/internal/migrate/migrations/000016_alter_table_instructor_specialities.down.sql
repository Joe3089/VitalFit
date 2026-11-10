DROP TABLE IF EXISTS "instructor_specialties";

ALTER TABLE "instructors"
ADD COLUMN "speciality" VARCHAR(255);