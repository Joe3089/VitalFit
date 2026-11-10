CREATE TABLE IF NOT EXISTS branch_instructors (
    branch_id UUID NOT NULL,
    instructor_id UUID NOT NULL,
    

    CONSTRAINT fk_branch_instructors_branch
        FOREIGN KEY(branch_id) 
        REFERENCES branch(branch_id)
        ON DELETE CASCADE, 
    
   
    CONSTRAINT fk_branch_instructors_instructor
        FOREIGN KEY(instructor_id) 
        REFERENCES instructors(instructor_id)
        ON DELETE CASCADE, 


    PRIMARY KEY (branch_id, instructor_id)
);