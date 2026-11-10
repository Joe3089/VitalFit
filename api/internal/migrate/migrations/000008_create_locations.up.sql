CREATE TABLE countries (
    country_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE states (
    state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    
    CONSTRAINT fk_country
        FOREIGN KEY(country_id) 
        REFERENCES countries(country_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_state_country_name
        UNIQUE (country_id, name)
);

CREATE INDEX IF NOT EXISTS idx_states_country_id ON states(country_id);