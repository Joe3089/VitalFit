export const getRetentionColor = (value: number) => {
  // 0% o Valores nulos: Tono neutro para no ensuciar la vista
  if (value === 0) {
    return "bg-slate-50 text-slate-500 font-light"; 
  }
  
  // 100%: Naranja Intenso (Máxima retención)
  if (value >= 100) {
    return "bg-orange-600 text-white font-bold shadow-inner";
  }
  
  // 75% a 99%: Naranja Estándar
  if (value >= 75) {
    return "bg-orange-500 text-white font-medium";
  }
  
  // 50% a 74%: Naranja Medio (Alerta suave)
  if (value >= 50) {
    return "bg-orange-400/80 text-white";
  }
  
  // 25% a 49%: Naranja Claro / Piel
  if (value >= 25) {
     return "bg-orange-200 text-orange-900";
  }
  
  // 1% a 24%: Tono muy tenue (Pérdida crítica de clientes)
  return "bg-orange-50 text-orange-700";
};
