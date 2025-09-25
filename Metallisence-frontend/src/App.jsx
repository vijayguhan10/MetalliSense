import React, { useState } from "react";
import Header from "./Components/Header";

import SideBar from "./Components/Sidebar";
import InitialRouter from "./Router/InitialRouter";

const App = () => {
  const [runTour, setRunTour] = useState(false);
  const shouldHideSidebar = false; // You can modify this logic as needed

  return (
    <div className="flex font-poppins overflow-x-hidden">
      {!shouldHideSidebar && <SideBar setRunTour={setRunTour} />}

      <div className={shouldHideSidebar ? "w-full" : "xl:ml-[17%] w-full"}>
        {!shouldHideSidebar && <Header />}
        <InitialRouter />
      </div>
    </div>
  );
};

export default App;
