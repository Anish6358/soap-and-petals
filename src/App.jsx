
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState("");

  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
const [orderError, setOrderError] = useState("");
const [completedOrder, setCompletedOrder] = useState(null);
const [paymentMethod, setPaymentMethod] = useState("upi");
const [customer, setCustomer] = useState({
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
});

const UPI_ID = "YOUR_MOTHERS_UPI_ID";
const UPI_NAME = "YOUR_MOTHERS_NAME";

  // Load active products from Supabase
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, brand, description, category, price_paise, stock, image_url, is_active"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        setProductError(error.message);
        setLoading(false);
        return;
      }

      const categoryStyles = {
        Bathing: { color: "#e6f0dc", emoji: "🧼" },
        Beauty: { color: "#f7dce5", emoji: "🌹" },
        Herbal: { color: "#dcebd9", emoji: "🌿" },
      };

      const formattedProducts = (data || []).map((product) => ({
        ...product,
        price: product.price_paise / 100,
        color:
          categoryStyles[product.category]?.color || "#e6f0dc",
        emoji:
          categoryStyles[product.category]?.emoji || "🧼",
      }));

      setProducts(formattedProducts);
      setLoading(false);
    }

    loadProducts();
  }, []);

  // Search and category filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        `${product.name} ${product.brand || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // Cart calculations
  const cartItems = products.filter(
    (product) => (cart[product.id] || 0) > 0
  );

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = cartItems.reduce(
    (sum, product) =>
      sum + product.price * cart[product.id],
    0
  );

  // Add an item without exceeding available stock
  function addToCart(id) {
    const product = products.find((item) => item.id === id);

    if (!product) return;

    setCart((current) => {
      const currentQuantity = current[id] || 0;

      if (currentQuantity >= product.stock) {
        return current;
      }

      return {
        ...current,
        [id]: currentQuantity + 1,
      };
    });
  }

  // Increase or decrease quantity
  function changeQuantity(id, amount) {
    setCart((current) => {
      const next = { ...current };
      const newQuantity = (next[id] || 0) + amount;
      const product = products.find((item) => item.id === id);

      if (newQuantity <= 0) {
        delete next[id];
      } else if (product && newQuantity <= product.stock) {
        next[id] = newQuantity;
      }

      return next;
    });
  }
  
  async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (placingOrder) return;

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty. Please add a product first.");
      return;
    }

    setPlacingOrder(true);
    setOrderError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-order",
        {
          body: {
            customer,
            paymentMethod,
            items: cartItems.map((product) => ({
              productId: product.id,
              quantity: cart[product.id],
            })),
          },
        }
      );

      if (error) {
        throw new Error(
          "Could not submit your order. Please try again. " +
          error.message
        );
      }

      if (!data?.success || !data?.order?.id) {
        throw new Error(data?.error || "The order could not be created.");
      }

     setCompletedOrder({
  id: data.order.id,
  total: data.order.total_paise / 100,
  paymentMethod: data.order.payment_method,
  paymentStatus: data.order.payment_status,
  createdAt: data.order.created_at,
});

setCart({});
setShowCheckout(false);
setShowCart(false);
    } catch (error) {
      setOrderError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  }


  return (
    <div className="store">
      <div className="announcement">
        Everyday essentials, delivered with care
      </div>

      <header className="navbar">
        <a className="logo" href="#">
          <span className="logo-icon">✿</span>
          <span>Soap &amp; Petals</span>
        </a>

        <div className="nav-links">
          <a href="#products">Shop</a>
          <a href="#about">About</a>
        </div>

        <button
          className="cart-button"
          onClick={() => setShowCart(true)}
        >
          Bag ({cartCount})
        </button>
      </header>

      <main>
        {/* Hero section */}
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              YOUR NEIGHBOURHOOD SOAP SHOP
            </span>

            <h1>
              Little things.
              <br />
              A fresher everyday.
            </h1>

            <p>
              Discover everyday bathing essentials and personal care
              favourites, all in one place.
            </p>

            <a className="primary-button" href="#products">
              Explore products ↗
            </a>
          </div>

          <div
            className="hero-art"
            aria-label="Soap and botanical illustration"
          >
            <span className="sun"></span>
            <span className="leaf leaf-one">✦</span>
            <span className="soap soap-one"></span>
            <span className="soap soap-two"></span>
            <span className="hero-flower">✿</span>
            <span className="hero-caption">
              A little care,
              <br />
              every day.
            </span>
          </div>
        </section>

        {/* Product catalogue */}
        <section className="catalogue" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE COLLECTION</span>
              <h2>Find your everyday favourites</h2>
            </div>

            <span className="product-count">
              {loading ? "Loading..." : `${filteredProducts.length} products`}
            </span>
          </div>

          <input
            className="search"
            type="search"
            placeholder="Search soaps..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
          />

          <div className="categories">
            {["All", "Bathing", "Beauty", "Herbal"].map((item) => (
              <button
                key={item}
                className={
                  category === item ? "category active" : "category"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {loading ? (
              <p className="empty-state">Loading products...</p>
            ) : productError ? (
              <p className="empty-state">
                Could not load products: {productError}
              </p>
            ) : (
              filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div
                    className="product-art"
                    style={{ background: product.color }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="product-image"
                      />
                    ) : (
                      <span className="product-emoji">
                        {product.emoji}
                      </span>
                    )}

                    <span className="product-art-label">
                      DAILY ESSENTIALS
                    </span>
                  </div>

                  <div className="product-info">
                    <span className="product-brand">
                      {product.brand || "Everyday Care"}
                    </span>

                    <h3>{product.name}</h3>

                    {product.description && (
                      <p>{product.description}</p>
                    )}

                    <div className="product-bottom">
                      <strong>₹{product.price.toFixed(2)}</strong>

                      <button
                        className="add-button"
                        onClick={() => addToCart(product.id)}
                        disabled={
                          product.stock <= (cart[product.id] || 0)
                        }
                      >
                        {product.stock <= (cart[product.id] || 0)
                          ? "Out of stock"
                          : cart[product.id]
                            ? `Add more (${cart[product.id]})`
                            : "+ Add"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {!loading &&
            !productError &&
            filteredProducts.length === 0 && (
              <p className="empty-state">
                No matching products. Try another search.
              </p>
            )}
        </section>

        {/* About section */}
        <section className="about" id="about">
          <span className="about-icon">✿</span>

          <div>
            <span className="eyebrow">
              A SMALL SHOP WITH A BIG HEART
            </span>

            <h2>Your everyday essentials, close to home.</h2>

            <p>
              A family-run shop bringing your favourite everyday
              products closer to you. We&apos;re glad you&apos;re here.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <span>Soap &amp; Petals</span>
        <span>Made with care, for everyday living.</span>
      </footer>

{/* Order confirmation screen */}
{completedOrder && (
  <div className="cart-overlay">
    <section className="cart-panel order-confirmation">
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: "48px" }}>✓</div>

        <h2>Thank you for your order!</h2>

        <p>Your order has been placed successfully.</p>
      </div>

      <div className="cart-total">
        <span>Order ID</span>
      </div>

      <p
        style={{
          overflowWrap: "anywhere",
          fontSize: "13px",
          background: "#f5f5f0",
          padding: "12px",
          borderRadius: "8px",
        }}
      >
        {completedOrder.id}
      </p>

      <div className="cart-total">
        <span>Total amount</span>
        <strong>₹{completedOrder.total.toFixed(2)}</strong>
      </div>

      <div className="cart-total">
        <span>Payment method</span>
        <strong>
          {completedOrder.paymentMethod === "upi"
            ? "UPI"
            : "Cash on Delivery"}
        </strong>
      </div>

      <div className="cart-total">
        <span>Payment status</span>
        <strong>
          {completedOrder.paymentStatus === "cod_due"
            ? "Pay on delivery"
            : "Awaiting payment verification"}
        </strong>
      </div>

      <button
        className="primary-button"
        onClick={() => setCompletedOrder(null)}
        style={{ width: "100%", marginTop: "20px" }}
      >
        Continue shopping
      </button>
    </section>
  </div>
)}

      {/* Shopping cart */}
      {/* Checkout form */}
{showCheckout && (
  <div className="cart-overlay">
    <section className="cart-panel">
      <div className="cart-heading">
        <h2>Checkout</h2>
        <button onClick={() => setShowCheckout(false)}>
          ✕
        </button>
      </div>

      <p>Subtotal: ₹{total.toFixed(2)}</p>

    <form onSubmit={handleCheckoutSubmit}>
        <label>
          Full name
          <input
            required
            value={customer.name}
            onChange={(event) =>
              setCustomer({ ...customer, name: event.target.value })
            }
          />
        </label>

        <label>
          Phone number
          <input
            required
            type="tel"
            pattern="[0-9]{10}"
            placeholder="10-digit mobile number"
            value={customer.phone}
            onChange={(event) =>
              setCustomer({ ...customer, phone: event.target.value })
            }
          />
        </label>

        <label>
          Address
          <textarea
            required
            value={customer.address}
            onChange={(event) =>
              setCustomer({ ...customer, address: event.target.value })
            }
          />
        </label>

        <label>
          City
          <input
            required
            value={customer.city}
            onChange={(event) =>
              setCustomer({ ...customer, city: event.target.value })
            }
          />
        </label>

        <label>
          State
          <input
            required
            value={customer.state}
            onChange={(event) =>
              setCustomer({ ...customer, state: event.target.value })
            }
          />
        </label>

        <label>
          PIN code
          <input
            required
            pattern="[0-9]{6}"
            inputMode="numeric"
            value={customer.pincode}
            onChange={(event) =>
              setCustomer({ ...customer, pincode: event.target.value })
            }
          />
        </label>

        <h3>Payment method</h3>

        <label>
          <input
            type="radio"
            name="payment"
            value="upi"
            checked={paymentMethod === "upi"}
            onChange={() => setPaymentMethod("upi")}
          />
          UPI
        </label>

        <label>
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
          Cash on Delivery
        </label>

        {paymentMethod === "upi" && (
          <div>
            <h3>Pay using UPI</h3>
            <p>UPI ID: {UPI_ID}</p>
            <img
              src="/images/upi-qr.jpeg"
              alt="UPI payment QR code"
              style={{ width: "200px", maxWidth: "100%" }}
            />
            <p>
              Pay ₹{total.toFixed(2)} and keep your transaction
              reference. Your payment will be verified before
              the order is confirmed.
            </p>
          </div>
        )}

        {orderError && (
  <p role="alert" style={{ color: "#b42318" }}>
    {orderError}
  </p>
)}

<button
  type="submit"
  className="primary-button"
  disabled={placingOrder}
>
  {placingOrder ? "Placing Order..." : "Place Order"}
</button>
      </form>
    </section>
  </div>
)}
      {showCart && (
        <div
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >
          <section
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-heading">
              <h2>Your bag ({cartCount})</h2>

              <button
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="empty-state">
                Your bag is empty. Find something you love!
              </p>
            ) : (
              <>
                {cartItems.map((product) => (
                  <div className="cart-item" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <p>₹{product.price.toFixed(2)} each</p>
                    </div>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQuantity(product.id, -1)
                        }
                        aria-label={`Remove one ${product.name}`}
                      >
                        −
                      </button>

                      <span>{cart[product.id]}</span>

                      <button
                        onClick={() =>
                          changeQuantity(product.id, 1)
                        }
                        disabled={
                          cart[product.id] >= product.stock
                        }
                        aria-label={`Add one ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div className="cart-total">
                  <span>Subtotal</span>
                  <strong>₹{total.toFixed(2)}</strong>
                </div>
                

              <button
  className="primary-button"
  onClick={() => {
    setShowCart(false);
    setShowCheckout(true);
  }}
>
  Proceed to Checkout →
</button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
