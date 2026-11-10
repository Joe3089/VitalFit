CREATE TABLE classes (
    class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    branch_id     UUID NOT NULL,
    service_id    UUID NOT NULL,
    instructor_id UUID NOT NULL,

    starts_at    TIMESTAMPTZ NOT NULL,
    ends_at      TIMESTAMPTZ NOT NULL,
    max_capacity INT NOT NULL CHECK (max_capacity > 0),

    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    notes      TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_classes_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch (branch_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_classes_service
        FOREIGN KEY (service_id)
        REFERENCES services (service_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_classes_instructor
        FOREIGN KEY (instructor_id)
        REFERENCES instructors (instructor_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_classes_branch_id ON classes (branch_id);
CREATE INDEX idx_classes_branch_start ON classes (branch_id, starts_at);
