import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

/**
 * Menu Component
 * Shows all categories as cards; clicking one expands sub-items below
 */
export default function Menu() {
  const [menuData, setMenuData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data } = await api.get('/menu');
      setMenuData(data.data);
      if (data.data.length > 0) setSelectedCategory(data.data[0]._id);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Count cart items for a given subItemId
  const getCartQty = (subItemId) => {
    const item = cartItems.find((i) => i.subItemId === subItemId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (menuItem, subItem) => {
    addToCart({
      menuItemId: menuItem._id,
      subItemId: subItem._id,
      category: menuItem.category,
      name: subItem.name,
      price: subItem.price,
      image: subItem.image,
    });
    toast.success(`${subItem.name} added to cart!`, { autoClose: 1500, icon: '🛒' });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
        <p className="mt-3 text-muted">Loading menu...</p>
      </div>
    );
  }

  const activeCategory = menuData.find((m) => m._id === selectedCategory);

  return (
    <div>
      {/* Category Grid */}
      <h5 className="fw-bold mb-3" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-grid me-2"></i>Menu Categories
      </h5>
      <div className="row g-3 mb-4">
        {menuData.map((category) => (
          <div key={category._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
            <div
              className={`card-cafe category-card text-center p-3 h-100 ${selectedCategory === category._id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedCategory(category._id)}
              aria-label={`Select ${category.category} category`}
            >
              <div style={{ fontSize: '2rem' }}>{category.icon}</div>
              <div className="fw-semibold mt-1" style={{ fontSize: '0.85rem' }}>
                {category.category}
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {category.subItems.length} items
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-items for selected category */}
      {activeCategory && (
        <div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: '1.5rem' }}>{activeCategory.icon}</span>
            <div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--cafe-brown-dark)' }}>
                {activeCategory.category}
              </h5>
              {activeCategory.description && (
                <small className="text-muted">{activeCategory.description}</small>
              )}
            </div>
          </div>

          <div className="row g-3">
            {activeCategory.subItems.map((item) => {
              const qty = getCartQty(item._id);
              return (
                <div key={item._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="menu-item-card card h-100">
                    {/* Item image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="card-img-top"
                        style={{ height: 180, objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light"
                        style={{ height: 180, fontSize: '3rem' }}
                      >
                        {activeCategory.icon}
                      </div>
                    )}
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title fw-bold mb-1">{item.name}</h6>
                      <p className="card-text text-muted small flex-grow-1">{item.description}</p>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="fw-bold" style={{ color: 'var(--cafe-brown)', fontSize: '1.1rem' }}>
                          ₹{item.price}
                        </span>
                        {qty > 0 ? (
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-success rounded-pill">{qty} in cart</span>
                            <button
                              className="btn btn-sm btn-cafe"
                              onClick={() => handleAddToCart(activeCategory, item)}
                              aria-label={`Add more ${item.name}`}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-cafe"
                            onClick={() => handleAddToCart(activeCategory, item)}
                            aria-label={`Add ${item.name} to cart`}
                            disabled={!item.isAvailable}
                          >
                            {item.isAvailable ? (
                              <><i className="bi bi-cart-plus me-1"></i>Add</>
                            ) : (
                              'Unavailable'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
