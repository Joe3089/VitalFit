export type KPICard = {
    value: number;
    trend?: string; // Optional to match SDK's KPICard structure
};

export type ClassScheduleItem = {
    start_time: string;
    end_time: string;
    class_name: string;
    max_capacity: number;
    location?: string; // Optional based on the user description not explicitly mentioning it but useful for UI
    occupied?: number; // Optional
};

// Note: The user description for 'instructorClassesToday' says "Datos Clave que retorna: Hora de inicio, hora de fin, nombre de la clase y capacidad máxima."
// It does not explicitly mention location or occupied count, but the UI displays them. I might need to map or infer them.
