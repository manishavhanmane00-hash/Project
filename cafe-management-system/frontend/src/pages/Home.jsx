import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await api.get('/menu');
        const items = data.data || [];
        setMenu(items);

        const topItems = items
          .flatMap((category) => category.subItems.map((subItem) => ({ ...subItem, category: category.category, categoryIcon: category.icon })))
          .slice(0, 6);

        setFeatured(topItems);
      } catch {
        setFeatureFallback();
      }
    };

    fetchMenu();
  }, []);

  const setFeatureFallback = () => {
    setFeatured([
      { name: 'Cappuccino', price: 119, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', category: 'Coffee', categoryIcon: '☕' },
      { name: 'Veg Burger', price: 129, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', category: 'Burger', categoryIcon: '🍔' },
      { name: 'Cold Coffee', price: 139, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735', category: 'Cold Drinks', categoryIcon: '🥤' },
    ]);
  };

  const categories = menu.slice(0, 6);

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <nav className="container landing-nav">
          <div className="brand-mark">☕ Brew &amp; Bite</div>
          <div className="landing-links">
            <a href="#menu">Menu</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="landing-actions">
            <button className="btn btn-cafe-outline" onClick={() => navigate('/login')}>Login</button>
            <button className="btn btn-cafe" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
        </nav>
      </header>

      <main className="container landing-main">
        <section className="landing-hero card-cafe">
          <div className="hero-copy">
            <span className="hero-badge">Freshly brewed every day</span>
            <h1>Your cozy cafe, now just a tap away.</h1>
            <p>
              Savor handcrafted coffee, comforting bites, and warm hospitality in a space built for good mornings and great evenings.
            </p>
            <div className="hero-actions">
              <button className="btn btn-cafe" onClick={() => navigate('/login')}>Order Now</button>
              <Link className="btn btn-cafe-outline" to="/signup">Create Account</Link>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>4.9/5</strong>
                <span>Customer rating</span>
              </div>
              <div>
                <strong>12 min</strong>
                <span>Average prep time</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Happy customers</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card main-card">
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
                alt="Coffee cup"
              />
            </div>
            <div className="hero-card floating-card">
              <span>☕</span>
              <div>
                <strong>Signature Latte</strong>
                <small>₹119</small>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <div>
              <span className="overline">Popular Picks</span>
              <h2>Featured favorites</h2>
            </div>
            <button className="btn btn-cafe-outline" onClick={() => navigate('/login')}>See Menu</button>
          </div>

          <div className="featured-grid">
            {featured.map((item, index) => (
              <div key={`${item.name}-${index}`} className="card-cafe feature-card">
                <img src={item.image} alt={item.name} />
                <div className="feature-body">
                  <div className="feature-meta">
                    <span>{item.categoryIcon}</span>
                    <small>{item.category}</small>
                  </div>
                  <h3>{item.name}</h3>
                  <div className="feature-footer">
                    <strong>₹{item.price}</strong>
                    <button className="btn btn-cafe btn-sm" onClick={() => navigate('/login')}>Order</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="menu" className="landing-section">
          <div className="section-heading">
            <div>
              <span className="overline">Our kitchen</span>
              <h2>Explore all categories</h2>
            </div>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <div key={category._id} className="card-cafe category-panel">
                <div className="category-emoji">{category.icon || '☕'}</div>
                <h3>{category.category}</h3>
                <p>{category.description || 'Freshly prepared cafe favorites.'}</p>
                <small>{category.subItems?.length || 0} menu items</small>
              </div>
            ))}
          </div>
        </section>

        <section className="promo-strip card-cafe">
          <div>
            <span className="overline">Today's special</span>
            <h3>Buy 2 coffees, get 1 breakfast combo free</h3>
          </div>
          <button className="btn btn-cafe" onClick={() => navigate('/login')}>Claim Offer</button>
        </section>

        <section id="about" className="about-grid">
          <div className="card-cafe about-card">
            <span className="overline">Why customers love us</span>
            <h2>Crafted for slow mornings and busy afternoons.</h2>
            <p>
              From signature espresso pours to comfort-food favorites, every item is made with premium ingredients and served with genuine cafe hospitality.
            </p>
            <ul>
              <li>Fresh ingredients and seasonal menu updates</li>
              <li>Fast online ordering and live order tracking</li>
              <li>Warm ambience with premium coffee culture</li>
            </ul>
          </div>

          <div className="card-cafe about-image-panel">
            <img
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80"
              alt="Cafe interior"
            />
          </div>
        </section>
      </main>

      <footer id="contact" className="landing-footer">
        <div className="container footer-inner">
          <div>
            <div className="brand-mark">☕ Brew &amp; Bite</div>
            <p>Fresh coffee, warm meals, and a welcoming neighborhood vibe.</p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>+91 98765 43210</p>
            <p>hello@brewandbite.com</p>
          </div>
          <div>
            <h4>Visit Us</h4>
            <p>22 Coffee Lane, Downtown</p>
            <p>Open daily: 8:00 AM – 11:00 PM</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
