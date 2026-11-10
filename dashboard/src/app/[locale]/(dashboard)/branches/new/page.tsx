import CreateForm from "./CreateForm";
import { User } from "@vitalfit/sdk";
import { Country, State, City } from "@/models/location";
const MOCK_COUNTRIES: Country[] = [{ id: "co1", name: "Venezuela" }];
const MOCK_STATES: State[] = [
  { id: "s1", name: "Distrito Capital", countryId: "co1" },
];
const MOCK_CITIES: City[] = [{ id: "c1", name: "Caracas", stateId: "s1" }];
const MOCK_ADMINS: User[] = [];

async function getFormData() {
  try {
    return {
      allCountries: MOCK_COUNTRIES,
      allStates: MOCK_STATES,
      allCities: MOCK_CITIES,
    };
  } catch (error) {
    console.error("Error cargando datos estáticos del servidor:", error);
    return {
      allBranchAdmins: MOCK_ADMINS,
      allCountries: MOCK_COUNTRIES,
      allStates: MOCK_STATES,
      allCities: MOCK_CITIES,
    };
  }
}

export default async function createBranchPage() {
  const formDataProps = await getFormData();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <CreateForm {...formDataProps} />
    </div>
  );
}
