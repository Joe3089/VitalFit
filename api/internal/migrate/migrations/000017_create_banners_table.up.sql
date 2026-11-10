CREATE TABLE "banners" (
    "banner_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "link_url" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true
);


CREATE TABLE "banner_services" (
    "banner_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    PRIMARY KEY ("banner_id", "service_id"),
    
  
    CONSTRAINT "fk_banner_services_banner"
        FOREIGN KEY("banner_id")
        REFERENCES "banners"("banner_id")
        ON DELETE CASCADE,
    
    CONSTRAINT "fk_banner_services_service"
        FOREIGN KEY("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE
);