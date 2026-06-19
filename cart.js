document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartWrapper = document.getElementById('cart-wrapper');
    if (!cartWrapper) return;

    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];

    if (cart.length === 0) {
        cartWrapper.innerHTML = `
            <div class="empty-message">
                <p>Your shopping cart is currently empty.</p>
                <a href="product.html" class="btn btn-primary" style="margin-top: 1.5rem;">Explore Products</a>
            </div>`;
        return;
    }

    let cartHTML = `<div class="cart-container">`;
    let dynamicTotal = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        dynamicTotal += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Variant Size: ${item.variant}</p>
                </div>
                <div><strong>₹${item.price}</strong></div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="adjustQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="adjustQuantity(${index}, 1)">+</button>
                </div>
                <div><strong>₹${itemTotal}</strong></div>
                <div>
                    <button class="remove-btn" onclick="removeCartItem(${index})">Remove</button>
                </div>
            </div>
        `;
    });

    cartHTML += `
        <div class="cart-summary">
            <h3>Grand Total: <span>₹${dynamicTotal}</span></h3>
            <button class="btn btn-primary" onclick="openDetailsModal()" style="background-color: var(--accent-green); color: white;">
                ORDER NOW
            </button>
        </div>
    </div>`;

    cartWrapper.innerHTML = cartHTML;
}

function adjustQuantity(index, shift) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart[index].quantity += shift;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
}

function openDetailsModal() { document.getElementById('detailsModal').style.display = 'flex'; }
function closeDetailsModal() { document.getElementById('detailsModal').style.display = 'none'; }

async function handleFormSubmit(event) {
    event.preventDefault();

    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    if (cart.length === 0) { alert("Bhai cart khali hai!"); return; }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const pincode = document.getElementById('custPincode').value.trim();
    const payment = document.getElementById('paymentMethod').value;

    let dynamicTotal = 0;
    cart.forEach(item => { dynamicTotal += item.price * item.quantity; });

    const orderData = { name, phone, address, pincode, payment, cart, totalAmount: dynamicTotal };

    try {
        const response = await fetch("https://pradh-backend.onrender.com/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert("🎉 Order Placed Successfully! Redirecting you now...");
            // Yahan Email trigger kar
// Order success hone par ye trigger hoga
// Email background mein chala jayega, redirect ko nahi rokege
            emailjs.send("service_87e5plv", "template_a1b2c3d4", {
                name: name 
            }).then(() => console.log("Email Sent!")).catch((err) => console.error("Email Error:", err));

    localStorage.removeItem('pradh_cart');
    // ... baki ka code
            localStorage.removeItem('pradh_cart');
            closeDetailsModal();

            // LOGIC: Agar UPI hai to UPI App, warna WhatsApp
            if (payment.includes("UPI")) {
                const upiUrl = `upi://pay?pa=8979993655@idfcfirst&pn=PRADH_DESI_FUEL&am=${dynamicTotal}&cu=INR&tn=Order_Payment`;
                window.location.assign(upiUrl);
            } else {
                let textMessage = `⚡ *NEW ORDER - PRADH DESI FUEL* ⚡\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nTotal: ₹${dynamicTotal}\nPayment: ${payment}`;
                window.location.assign(`https://wa.me/918979993655?text=${encodeURIComponent(textMessage)}`);
            }
        } else {
            alert("Server Error. Check console.");
        }
    } catch (error) {
        alert("Backend server offline hai!");
    }
}

async function fetchMyOrders() {
    const phoneInput = document.getElementById('searchOrderPhone').value.trim();
    const ordersWrapper = document.getElementById('my-orders-wrapper');
    
    if (phoneInput.length !== 10) { alert("Sahi 10-digit number daalo!"); return; }

    ordersWrapper.innerHTML = "<p>Loading...</p>";
    try {
        const response = await fetch("https://pradh-backend.onrender.com/api/orders");
        const allOrders = await response.json();
        const myOrders = allOrders.filter(o => o.phone === phoneInput);

        if (myOrders.length === 0) { ordersWrapper.innerHTML = "<p>No orders found.</p>"; return; }

        let html = "";
        myOrders.reverse().forEach(o => {
            html += `<div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                        <p><strong>Order ID:</strong> #${o.id}</p>
                        <p><strong>Total:</strong> ₹${o.totalAmount}</p>
                        <p><strong>Status:</strong> ${o.status || 'Placed'}</p>
                     </div>`;
        });
        ordersWrapper.innerHTML = html;
    } catch (e) {
        ordersWrapper.innerHTML = "<p>Error loading orders.</p>";
    }
}
