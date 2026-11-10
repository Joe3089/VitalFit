CREATE TABLE "promotions" (
    "promotion_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) UNIQUE,
    "discount_type" VARCHAR(50) NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "check_discount_type"
        CHECK ("discount_type" IN ('Percentage', 'FixedAmount')),

    CONSTRAINT "check_discount_value_positive"
        CHECK ("discount_value" > 0),

    CONSTRAINT "check_end_date_after_start_date"
        CHECK ("end_date" > "start_date")
);

CREATE INDEX "idx_promotions_deleted_at" ON "promotions"("deleted_at");
CREATE INDEX "idx_promotions_code" ON "promotions"("code");
CREATE INDEX "idx_promotions_is_active" ON "promotions"("is_active");


CREATE TABLE "promotion_memberships" (
    "promotion_id" UUID NOT NULL,
    "membership_type_id" UUID NOT NULL,

    PRIMARY KEY ("promotion_id", "membership_type_id"),

    CONSTRAINT "fk_promotion_memberships_promotion"
        FOREIGN KEY("promotion_id")
        REFERENCES "promotions"("promotion_id")
        ON DELETE CASCADE,

    CONSTRAINT "fk_promotion_memberships_membership_type"
        FOREIGN KEY("membership_type_id")
        REFERENCES "membership_types"("membership_type_id")
        ON DELETE CASCADE
);


CREATE TABLE "promotion_services" (
    "promotion_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    PRIMARY KEY ("promotion_id", "service_id"),

    CONSTRAINT "fk_promotion_services_promotion"
        FOREIGN KEY("promotion_id")
        REFERENCES "promotions"("promotion_id")
        ON DELETE CASCADE,

    CONSTRAINT "fk_promotion_services_service"
        FOREIGN KEY("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE
);