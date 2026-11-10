CREATE TABLE "service_categories" (
    "category_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE "services" (
    "service_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "category_id" UUID NOT NULL,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "duration_minutes" INT,
    "priority_score" INT DEFAULT 50,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP,
    "deleted_at" TIMESTAMP,
    CONSTRAINT "fk_services_service_category"
        FOREIGN KEY("category_id")
        REFERENCES "service_categories"("category_id")
        ON DELETE SET NULL 
);

CREATE INDEX "idx_services_deleted_at" ON "services" ("deleted_at");

CREATE TABLE "service_images" (
    "image_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "service_id" UUID NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "alt_text" VARCHAR(255),
    "display_order" INT NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "fk_service_images_service"
        FOREIGN KEY("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE 
);

CREATE TABLE "service_branch_details" (
    "service_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "max_capacity" INT NOT NULL,
    "price_for_member" DECIMAL(10, 2) NOT NULL,
    "price_for_non_member" DECIMAL(10, 2) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP,
    "deleted_at" TIMESTAMP,
    
    PRIMARY KEY ("service_id", "branch_id"),
    
    CONSTRAINT "fk_service_branch_details_service"
        FOREIGN KEY("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE,
    
    CONSTRAINT "fk_service_branch_details_branch"
        FOREIGN KEY("branch_id")
        REFERENCES "branch"("branch_id") 
        ON DELETE CASCADE
);
CREATE INDEX "idx_service_branch_details_deleted_at" ON "service_branch_details" ("deleted_at");