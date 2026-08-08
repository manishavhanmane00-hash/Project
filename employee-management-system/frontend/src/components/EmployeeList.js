import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import employeeService from '../services/employeeService';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAllEmployees();
      setEmployees(res.data.data);
      setError('');
    } catch (err) {
      setError('Could not load employees. Make sure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await employeeService.deleteEmployee(id);
      fetchEmployees(); // refresh the list
    } catch (err) {
      setError('Failed to delete employee.');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4">All Employees ({employees.length})</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {employees.length === 0 && !error ? (
        <div className="alert alert-info">
          No employees yet. Click <strong>+ Add Employee</strong> to create the first one.
        </div>
      ) : (
        <div className="table-responsive shadow-sm">
          <table className="table table-hover bg-white mb-0">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Position</th>
                <th>Salary</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>${Number(emp.salary).toLocaleString()}</td>
                  <td className="text-end">
                    <Link to={`/edit/${emp._id}`} className="btn btn-sm btn-outline-primary me-2">
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(emp._id, emp.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
