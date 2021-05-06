import React from "react";
import { Navbar, Nav, Icon } from "rsuite";
import "../styles/styles.css";

function NavHeader({ onSelect, activeKey, ...props }) {
  return (
    <Navbar
      appearance="inverse"
      style={{ backgroundColor: "#171717" }}
      {...props}
    >
      <Navbar.Header>
        <a href="#" className="navbar-brand logo">
          A N I M E
        </a>
      </Navbar.Header>
      <Navbar.Body className="body-nav">
        <Nav onSelect={onSelect} activeKey={activeKey}>
          <Nav.Item eventKey="1" icon={<Icon icon="home" />}>
            Home
          </Nav.Item>
          <Nav.Item eventKey="2">Popular</Nav.Item>
          <Nav.Item eventKey="3">Latest</Nav.Item>
          <Nav.Item eventKey="4">About</Nav.Item>
        </Nav>
      </Navbar.Body>
    </Navbar>
  );
}

export default NavHeader;
