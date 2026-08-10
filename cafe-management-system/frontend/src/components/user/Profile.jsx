import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, login, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name cannot be empty');
    setLoading(true);
    try {
      const { data } = await api.put('/auth/me', form);
      login(data.data, token); // update stored user
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <div className="card-cafe p-4">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h5 className="fw-bold mb-0">{user?.name}</h5>
              <span className="badge bg-warning text-dark text-capitalize">{user?.role}</span>
            </div>
          </div>

          {!editing ? (
            <>
              <div className="profile-field">
                <span className="profile-label"><i className="bi bi-person me-2"></i>Full Name</span>
                <span className="profile-value">{user?.name}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label"><i className="bi bi-envelope me-2"></i>Email</span>
                <span className="profile-value">{user?.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label"><i className="bi bi-telephone me-2"></i>Phone</span>
                <span className="profile-value">{user?.phone || <span className="text-muted fst-italic">Not provided</span>}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label"><i className="bi bi-shield-check me-2"></i>Role</span>
                <span className="profile-value text-capitalize">{user?.role}</span>
              </div>

              <button className="btn btn-cafe mt-3 w-100" onClick={() => {
                setForm({ name: user?.name || '', phone: user?.phone || '' });
                setEditing(true);
              }}>
                <i className="bi bi-pencil me-2"></i>Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-person"></i></span>
                  <input type="text" name="name" className="form-control" value={form.name}
                    onChange={handleChange} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email <span className="text-muted small">(cannot be changed)</span></label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                  <input type="email" className="form-control" value={user?.email} disabled />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                  <input type="tel" name="phone" className="form-control" placeholder="+91 98765 43210"
                    value={form.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-cafe flex-grow-1" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
