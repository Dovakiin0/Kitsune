import React from "react";
import { Navbar, Nav, Icon } from "rsuite";
import "../styles/styles.css";
import { Link } from "react-router-dom";
import Search from "./Search";
import Login from "./login";

function NavHeader({ onSelect, activeKey, ...props }) {
  return (
    <Navbar appearance="sublte" {...props}>
      <Navbar.Header>
        <span className="navbar-brand logo">A N I M E W O R L D Z</span>
      </Navbar.Header>
      <Navbar.Body className="body-nav">
        <Nav onSelect={onSelect} activeKey={activeKey}>
          <Link to="/">
            <Nav.Item eventKey="1" icon={<Icon icon="home" />}>
              Home
            </Nav.Item>
          </Link>
          <Link to="/popular">
            <Nav.Item eventKey="2">Popular</Nav.Item>
          </Link>
          <Link to="/latest">
            <Nav.Item eventKey="3">Latest</Nav.Item>
          </Link>
          <Nav.Item eventKey="4">About</Nav.Item>
        </Nav>
        <Nav pullRight>
          <Login />
        </Nav>
        <Nav pullRight>
          <Search {...props} />
        </Nav>
      </Navbar.Body>
    </Navbar>
  );
}

export default NavHeader;
