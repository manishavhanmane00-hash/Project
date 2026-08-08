import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          Employee Management System
        </Link>
        <div className="d-flex">
          <Link to="/" className="btn btn-outline-light btn-sm me-2">
            All Employees
          </Link>
          <Link to="/add" className="btn btn-light btn-sm">
            + Add Employee
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
