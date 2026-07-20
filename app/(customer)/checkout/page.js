"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { Button, Card } from "@heroui/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, restaurantId, coupon, subtotal, deliveryFee, tax, discount, totalAmount, clearCart } = useCart();

  const [user, setUser] = useState(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash, card, mobile_banking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/cart");
    }
  }, [cartItems]);

  const fetchUserSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.addresses && data.user.addresses.length > 0) {
          setSelectedAddressIndex(0);
        } else {
          setShowNewAddressForm(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchUserSession();
    });
    return () => {
      active = false;
    };
  }, []);

  const handleAddNewAddress = async (data) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/users/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to add address");
      }

      // Success
      setUser((prev) => ({
        ...prev,
        addresses: result.addresses,
      }));
      setSelectedAddressIndex(result.addresses.length - 1);
      setShowNewAddressForm(false);
      reset();
      toast.success("New address added successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push("/auth/login?returnTo=/checkout");
      return;
    }

    const selectedAddress = user.addresses[selectedAddressIndex];
    if (!selectedAddress) {
      setError("Please select or add a delivery address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const orderData = {
        restaurantId,
        items: cartItems,
        deliveryAddress: selectedAddress,
        paymentMethod,
        couponCode: coupon?.code || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to place order");
      }

      const orderId = result.order._id;
      clearCart();

      if (paymentMethod === "cash") {
        // Redirect directly to tracking
        router.push(`/orders/${orderId}/track`);
      } else {
        // Card or Mobile banking - Initiate Payment Session and redirect to mock gateway
        router.push(`/payments/mock-gateway?orderId=${orderId}&method=${paymentMethod}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-neutral-500">
        Loading checkout details...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-white min-h-screen">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Checkout</h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Complete your order from <strong className="text-black">{restaurantId ? cartItems[0]?.name : ""}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Address Card */}
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-black">Delivery Address</h3>
              {user.addresses && user.addresses.length > 0 && (
                <button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-500"
                >
                  {showNewAddressForm ? "Select Saved Address" : "+ Add New Address"}
                </button>
              )}
            </div>

            {/* List Saved Addresses */}
            {!showNewAddressForm && user.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map((addr, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAddressIndex(index)}
                    className={`w-full text-left rounded-xl p-4 border text-sm font-medium transition-all ${
                      selectedAddressIndex === index
                        ? "border-amber-500 bg-amber-50/20 text-black"
                        : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold uppercase tracking-wider text-xs bg-black text-white px-2 py-0.5 rounded">
                        {addr.label}
                      </span>
                      {selectedAddressIndex === index && (
                        <span className="text-xs text-amber-600 font-bold">Selected</span>
                      )}
                    </div>
                    <div className="font-semibold text-neutral-900">{addr.street}</div>
                    <div className="text-xs text-neutral-500">
                      {addr.city}, {addr.district} - {addr.postalCode}
                    </div>
                    {addr.instructions && (
                      <div className="text-xs text-amber-700 mt-2 italic">
                        Note: {addr.instructions}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* Add New Address Form */
              <form onSubmit={handleSubmit(handleAddNewAddress)} className="space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Address Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Home, Office"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      {...register("label", { required: "Label is required" })}
                    />
                    {errors.label && <p className="text-xs text-red-600 mt-1">{errors.label.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      {...register("street", { required: "Street is required" })}
                    />
                    {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Dhaka"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      {...register("city", { required: "City is required" })}
                    />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">District</label>
                    <input
                      type="text"
                      placeholder="Dhaka"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      {...register("district", { required: "District is required" })}
                    />
                    {errors.district && <p className="text-xs text-red-600 mt-1">{errors.district.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Postal Code</label>
                    <input
                      type="text"
                      placeholder="1212"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      {...register("postalCode", { required: "Postal Code is required" })}
                    />
                    {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Delivery Instructions (Optional)</label>
                  <textarea
                    placeholder="e.g. Ring bell, leave at reception..."
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 h-20"
                    {...register("instructions")}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {user.addresses && user.addresses.length > 0 && (
                    <Button
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => setShowNewAddressForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-black text-white hover:bg-neutral-800 font-bold"
                  >
                    Save Address
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Payment Method Card */}
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
            <h3 className="text-lg font-bold text-black border-b border-neutral-100 pb-4 mb-4">
              Payment Method
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                  paymentMethod === "cash"
                    ? "border-amber-500 bg-amber-50/20 text-black font-bold"
                    : "border-neutral-100 hover:bg-neutral-50 text-neutral-500"
                }`}
              >
                <span className="text-2xl mb-2">💵</span>
                <span className="text-xs font-bold tracking-wide uppercase">Cash on Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                  paymentMethod === "card"
                    ? "border-amber-500 bg-amber-50/20 text-black font-bold"
                    : "border-neutral-100 hover:bg-neutral-50 text-neutral-500"
                }`}
              >
                <span className="text-2xl mb-2">💳</span>
                <span className="text-xs font-bold tracking-wide uppercase">Card / Stripe</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("mobile_banking")}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                  paymentMethod === "mobile_banking"
                    ? "border-amber-500 bg-amber-50/20 text-black font-bold"
                    : "border-neutral-100 hover:bg-neutral-50 text-neutral-500"
                }`}
              >
                <span className="text-2xl mb-2">📱</span>
                <span className="text-xs font-bold tracking-wide uppercase">Mobile / bKash</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Side summary */}
        <div>
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-black border-b border-neutral-100 pb-4 mb-4">
              Items Summary
            </h3>

            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 mb-6 pr-2">
              {cartItems.map((item) => (
                <div key={`${item.menuItemId}-${item.variant}`} className="py-3 flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900">{item.name}</span>
                    {item.variant && <p className="text-[10px] text-neutral-400">({item.variant})</p>}
                    <p className="text-neutral-500 mt-0.5">Qty: {item.qty} x ৳{item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-neutral-900">৳{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-neutral-100 pt-4 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>৳{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vat / Tax (10%)</span>
                <span>৳{tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({coupon?.code})</span>
                  <span>-৳{discount.toFixed(2)}</span>
                </div>
              )}
              <hr className="border-neutral-100 my-2" />
              <div className="flex justify-between text-sm font-black text-black">
                <span>Total Amount</span>
                <span>৳{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <Button
              disabled={loading || showNewAddressForm}
              onClick={handlePlaceOrder}
              className="w-full mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Processing..." : paymentMethod === "cash" ? "Confirm Order" : "Pay & Place Order"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
