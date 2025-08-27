import React from "react";
import {CreateTestForm} from "../components/CreateTestForm";
import { TestList } from "../components/TestList";
import { QuestionBankProvider } from "../context/QuestionBankContext";
import { TestProvider } from "../context/TestContext"; // Import the TestProvider

const TestManager = () => {
  return (
    <TestProvider> {/* Add TestProvider wrapper */}
      <QuestionBankProvider>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreateTestForm />
          <TestList />
        </div>
      </QuestionBankProvider>
    </TestProvider>
  );
};

export default TestManager;