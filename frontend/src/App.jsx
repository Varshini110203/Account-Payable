// import Header from "./components/Header/Header";
// import { UserContext } from "./context/UserContext.jsx";
import React from "react";

import MainLayout from "./components/MainLayout.jsx";

const App = () => {
  // const {  } = useContext(UserContext);

  return (
    <div className="flex flex-col h-screen">
      {/* <Header /> */}
      <MainLayout />
    </div>
  );
};

export default App;
