interface WizardStep {
  id: number;
  name: string;
  description: string;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
}

export default function Wizard({ steps, currentStep }: WizardProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex flex-col items-center flex-1 relative"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                step.id === currentStep
                  ? "bg-orange-500 border-orange-500 text-white"
                  : step.id < currentStep
                    ? "bg-gray-300 border-gray-300 text-white"
                    : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              {step.id}
            </div>
            <div className="text-center">
              <div
                className={`text-xs font-medium ${
                  step.id === currentStep ? "text-gray-800" : "text-gray-500"
                }`}
              >
                {step.name}
              </div>
              {step.description && (
                <div className="text-xs text-gray-400 mt-1">
                  {step.description}
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                  step.id < currentStep ? "bg-gray-300" : "bg-gray-200"
                }`}
                style={{ transform: "translateY(-50%)" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
