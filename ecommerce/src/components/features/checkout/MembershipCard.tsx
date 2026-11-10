"use client";

interface MembershipCardProps {
  membership: any;
}

export default function MembershipCard({ membership }: MembershipCardProps) {
  const getEndDate = (start: Date, months: number) => {
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return end.toISOString().split("T")[0];
  };

  const startDate = new Date();
  const durationMonths = membership.duration_months || 1;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border-l-[6px] border-l-orange-500 mb-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500 uppercase tracking-tight">
          {membership.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {membership.description || "Más beneficios para tu vida fitness"}
        </p>
      </div>

      <div className="mb-6">
        <span className="text-xl font-bold text-black">
          Precio: ${membership.price.toFixed(2)}
        </span>
      </div>

      <div>
        <p className="font-bold text-lg text-black">
          Duración: {startDate.toISOString().split("T")[0]} -{" "}
          {getEndDate(startDate, durationMonths)}
        </p>
      </div>
    </div>
  );
}
