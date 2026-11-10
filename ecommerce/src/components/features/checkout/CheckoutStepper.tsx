import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export const CheckoutStepper = ({ currentStep }: { currentStep: number }) => {
  const t = useTranslations("Checkout.Stepper");
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <div className="flex justify-center mb-8">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={label} className="flex items-center mx-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
              ${isActive || isCompleted ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300 text-gray-400"}`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
            </div>
            <span
              className={`ml-2 text-sm ${isActive ? "font-bold text-orange-500" : "text-gray-500"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
