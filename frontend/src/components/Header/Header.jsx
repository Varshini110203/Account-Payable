import {
  Header as CarbonHeader,
  HeaderName,
  HeaderGlobalBar,
} from "carbon-components-react";
import ICLOGO from "../../assets/images/document-review.png";

import { UserContext } from "../../context/UserContext.jsx";
import { useContext } from "react";

const Header = () => {
  const { themeStyle } = useContext(UserContext);
  return (
    <CarbonHeader aria-label="IC App Header">
      <HeaderName prefix="">
        <img
          src={ICLOGO}
          alt="IC Logo"
          style={{ height: "25px", marginRight: "0.5rem" }}
        />
        <span style={{ color: themeStyle.primary, fontSize: "22px" }}>
          {" "}
          Document
        </span>{" "}
        &nbsp;
        <span style={{ fontSize: "22px" }}>Review</span>
      </HeaderName>

      {/* Filler to push items to the right */}
      <div style={{ flex: 1 }} />

      {/* Custom text menu on the right */}
      <HeaderGlobalBar>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            paddingRight: "1rem",
          }}
        >
          <span style={{ cursor: "pointer" }}>FAQ</span>
          <span style={{ cursor: "pointer" }}>Contact</span>
          <span style={{ cursor: "pointer" }}>Light / Dark</span>
          <div
            style={{
              height: "32px",
              width: "32px",
              borderRadius: "50%",
              backgroundColor: themeStyle.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            SS
          </div>
        </div>
      </HeaderGlobalBar>
    </CarbonHeader>
  );
};

export default Header;
