import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import employeeService from '../services/employeeService';

const initialState = {
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  salary: '',
};

const EmployeeForm = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // If we're editing, load the existing employee's data into the form
  useEffect(() => {
    if (!isEditMode) return;

    employeeService
      .getEmployee(id)
      .then((res) => {
        const emp = res.data.data;
        setFormData({
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          department: emp.department,
          position: emp.position,
          salary: emp.salary,
        });
      })
      .catch(() => setError('Failed to load employee data.'));
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = { ...formData, salary: Number(formData.salary) };

    try {
      if (isEditMode) {
        await employeeService.updateEmployee(id, payload);
      } else {
        await employeeService.createEmployee(payload);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check your input.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="card-title mb-4">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h4>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-control"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Position</label>
                <input
                  type="text"
                  className="form-control"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Salary ($)</label>
                <input
                  type="number"
                  className="form-control"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : isEditMode ? 'Update Employee' : 'Add Employee'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
