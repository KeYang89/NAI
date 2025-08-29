import React from "react";
import { render } from "@testing-library/react";
import SpecForm from "../../components/SpecForm";
import { SpecContext } from "../../App";

// Mock uuid
jest.mock("uuid", () => ({
  v4: () => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`,
}));

const mockContextValue = {
  specJson: {}, 
  setSpecJson: jest.fn(),
  handleToast: jest.fn(),
  loadedConfigs: [],
  setLoadedConfigs: jest.fn(),
};

const renderWithContext = (contextValue = mockContextValue) => {
  return render(
    <SpecContext.Provider value={contextValue}>
      <SpecForm />
    </SpecContext.Provider>
  );
};

test("renders SpecForm without crashing", () => {
  renderWithContext();
});
