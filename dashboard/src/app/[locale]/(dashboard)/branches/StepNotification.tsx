// components/StepNotification.tsx
import { FC } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface StepNotificationProps {
  title: string;
  description: string;
  className?: string;
}

const StepNotification: FC<StepNotificationProps> = ({
  title,
  description,
  className,
}) => {
  return (
    <div
      className={`w-full rounded-md border border-gray-200 bg-gray-100 mt-4 p-4 shadow-sm flex items-start gap-3 ${className}`}
    >
      <ArrowRightIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
      <div className="flex flex-col">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default StepNotification;
