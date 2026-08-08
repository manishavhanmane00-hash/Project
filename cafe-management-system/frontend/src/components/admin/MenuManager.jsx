import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * MenuManager — Admin CRUD for menu categories and sub-items
 */
export default function MenuManager() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [catForm, setCatForm] = useState({ category: '', icon: '🍽️', description: '' });
  const [subForm, setSubForm] = useState({ name: '', description: '', price: '', image: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data } = await api.get('/menu');
      setMenu(data.data);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/menu', catForm);
      toast.success('Category added!');
      setCatForm({ category: '', icon: '🍽️', description: '' });
      setShowCatForm(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its items?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Category deleted');
      if (selectedCat === id) setSelectedCat(null);
      fetchMenu();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAddSubItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/menu/${selectedCat}/subitems`, {
        ...subForm,
        price: parseFloat(subForm.price),
      });
      toast.success('Item added!');
      setSubForm({ name: '', description: '', price: '', image: '' });
      setShowSubForm(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubItem = async (catId, subId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/${catId}/subitems/${subId}`);
      toast.success('Item deleted');
      fetchMenu();
    } catch {
      toast.error('Delete failed');
    }
  };

  const activeCategory = menu.find((m) => m._id === selectedCat);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border spinner-cafe" role="status" /></div>;
  }

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-journal-text me-2"></i>Manage Menu
      </h4>

      <div className="row g-4">
        {/* Categories list */}
        <div className="col-md-4">
          <div className="card-cafe p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Categories</h6>
              <button className="btn btn-sm btn-cafe" onClick={() => setShowCatForm(!showCatForm)}>
                <i className="bi bi-plus-lg me-1"></i>Add
              </button>
            </div>

            {/* Add category form */}
            {showCatForm && (
              <form onSubmit={handleAddCategory} className="mb-3 p-3 bg-light rounded">
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Category name *"
                  value={catForm.category}
                  onChange={(e) => setCatForm({ ...catForm, category: e.target.value })}
                  required
                />
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Icon emoji (e.g. 🍕)"
                  value={catForm.icon}
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                />
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Description"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                />
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-sm btn-cafe" disabled={saving}>Save</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowCatForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            {/* Category list */}
            <div className="d-flex flex-column gap-1">
              {menu.map((cat) => (
                <div
                  key={cat._id}
                  className={`d-flex align-items-center justify-content-between p-2 rounded cursor-pointer ${selectedCat === cat._id ? 'bg-warning bg-opacity-25 fw-semibold' : 'hover-light'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCat(cat._id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedCat(cat._id)}
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <span>{cat.icon} {cat.category}</span>
                  <div className="d-flex align-items-center gap-1">
                    <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>{cat.subItems.length}</span>
                    <button
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id); }}
                      title="Delete category"
                      aria-label={`Delete ${cat.category}`}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-items */}
        <div className="col-md-8">
          {!selectedCat ? (
            <div className="empty-state">
              <div className="empty-icon">👈</div>
              <p className="text-muted">Select a category to manage its items</p>
            </div>
          ) : (
            <div className="card-cafe p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">
                  {activeCategory?.icon} {activeCategory?.category} — Items
                </h6>
                <button className="btn btn-sm btn-cafe" onClick={() => setShowSubForm(!showSubForm)}>
                  <i className="bi bi-plus-lg me-1"></i>Add Item
                </button>
              </div>

              {/* Add sub-item form */}
              {showSubForm && (
                <form onSubmit={handleAddSubItem} className="mb-3 p-3 bg-light rounded">
                  <div className="row g-2">
                    <div className="col-6">
                      <input className="form-control form-control-sm" placeholder="Item name *" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} required />
                    </div>
                    <div className="col-6">
                      <input className="form-control form-control-sm" type="number" placeholder="Price (₹) *" value={subForm.price} onChange={(e) => setSubForm({ ...subForm, price: e.target.value })} required min={0} />
                    </div>
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Description" value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Image URL" value={subForm.image} onChange={(e) => setSubForm({ ...subForm, image: e.target.value })} />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button type="submit" className="btn btn-sm btn-cafe" disabled={saving}>Save Item</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowSubForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Sub-items list */}
              <div className="d-flex flex-column gap-2">
                {activeCategory?.subItems?.length === 0 ? (
                  <p className="text-muted text-center py-3">No items yet. Add your first item!</p>
                ) : activeCategory?.subItems?.map((item) => (
                  <div key={item._id} className="d-flex align-items-center gap-3 p-2 border rounded">
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    )}
                    <div className="flex-grow-1">
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{item.description}</div>
                    </div>
                    <div className="fw-bold" style={{ color: 'var(--cafe-brown)' }}>₹{item.price}</div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteSubItem(selectedCat, item._id)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
