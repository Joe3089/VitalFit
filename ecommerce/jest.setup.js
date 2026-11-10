// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

jest.mock("@vitalfit/sdk", () => ({
  VitalFit: {
    getInstance: jest.fn(() => ({
      auth: {
        login: jest.fn(),
        logout: jest.fn(),
      },
      users: {
        getProfile: jest.fn(),
      },
    })),
  },
}));

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
