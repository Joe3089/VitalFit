CREATE TABLE IF NOT EXISTS branch_staff (
    branch_id UUID NOT NULL,
    user_id UUID NOT NULL,
    

    CONSTRAINT pk_branch_staff PRIMARY KEY (branch_id, user_id),

    CONSTRAINT fk_branch_staff_branch 
        FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_branch_staff_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_branch_staff_user_id ON branch_staff(user_id);
