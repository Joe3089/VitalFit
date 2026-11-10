"use client";

import Step1 from "./new/components/Step1";
import Step2 from "./new/components/Step2";
import { User } from "@vitalfit/sdk";
import Step3 from "./new/components/Step3";
import Step4 from "./new/components/Step4";

type StepProps = {
  step: number;
  formData: any;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  handleCustomChange: (field: string, value: unknown) => void;
  formErrors?: Record<string, string>;
  allBranchAdmins: User[];
};

export default function StepForm({
  step,
  formData,
  handleChange,
  handleCustomChange,
  formErrors,
  allBranchAdmins = [],
}: StepProps) {
  switch (step) {
    case 1:
      return (
        <Step1
          formData={formData}
          handleChange={handleChange}
          handleCustomChange={handleCustomChange}
          formErrors={formErrors}
        />
      );
    case 2:
      return (
        <Step2
          formData={formData}
          handleChange={handleChange}
          handleCustomChange={handleCustomChange}
          formErrors={formErrors}
        />
      );
    case 3:
      return (
        <Step3
          formData={formData}
          handleChange={handleChange}
          handleCustomChange={handleCustomChange}
          formErrors={formErrors}
          allBranchAdmins={allBranchAdmins}
        />
      );
    case 4:
      return <Step4 formData={formData} formErrors={formErrors} />;
    case 5:

    default:
      return null;
  }
}
