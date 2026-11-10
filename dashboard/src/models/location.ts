export type Country = {
  id: string;
  name: string;
};

export type State = {
  id: string;
  name: string;
  countryId: string;
};

export type City = {
  id: string;
  name: string;
  stateId: string;
};
