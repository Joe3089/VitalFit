// Datos de prueba para la página de detalle de reserva
export const attendees = Array.from({ length: 18 }).map((_, i) => {
  const idx = i + 1;
  return {
    id: idx,
    name: `Usuario ${idx}`,
    className: `Clase ${idx % 4 === 0 ? "Pilates" : idx % 3 === 0 ? "Yoga" : "HIIT"}`,
    checkinTime: `07:${(5 + idx).toString().padStart(2, "0")}`,
    status: idx % 7 === 0 ? "Cancelado" : idx % 5 === 0 ? "Pendiente" : "Confirmado",
  };
});

export default attendees;
