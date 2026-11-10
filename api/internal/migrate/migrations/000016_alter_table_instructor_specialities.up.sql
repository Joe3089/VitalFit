
ALTER TABLE "instructors"
DROP COLUMN "speciality";

CREATE TABLE "instructor_specialties" (
    "instructor_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    

    PRIMARY KEY ("instructor_id", "category_id"),
    
    CONSTRAINT "fk_specialties_instructor"
        FOREIGN KEY("instructor_id")
        REFERENCES "instructors"("instructor_id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "fk_specialties_category"
        FOREIGN KEY("category_id")
        REFERENCES "service_categories"("category_id")
        ON DELETE CASCADE
);