"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { Button, Card } from "@heroui/react";

export default function CartPage() {
  const {
    cartItems,
    restaurantName,
    coupon,
    updateQty,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    subtotal,
    deliveryFee,
    tax,
    discount,
    totalAmount,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setApplying(true);
      setCouponError("");
      setCouponSuccess("");

      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to validate coupon");
      }

      applyCoupon(result.coupon);
      setCouponSuccess(`Coupon '${result.coupon.code}' applied successfully!`);
      setCouponCode("");
    } catch (err) {
      console.error(err);
      setCouponError(err.message || "Invalid coupon code");
    } finally {
      setApplying(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <span className="text-5xl">🛒</span>
        <h2 className="mt-4 text-2xl font-bold text-black">Your Cart is Empty</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Button
          variant="primary"
          className="mt-6 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold"
          as={Link}
          href="/restaurants"
        >
          Find Delicious Food
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">My Shopping Cart</h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Review your items from <strong className="text-black">{restaurantName}</strong> and proceed to checkout.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card
              key={`${item.menuItemId}-${item.variant}`}
              className="shadow-soft rounded-2xl border border-neutral-100 p-4 flex flex-row items-center gap-4 hover:shadow-soft-lg transition-all duration-300"
            >
              <img
                src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop"}
                alt={item.name}
                className="h-16 w-16 rounded-xl object-cover bg-neutral-50"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-black text-sm truncate">{item.name}</h4>
                {item.variant && (
                  <p className="text-xs text-neutral-400 mt-0.5">Option: {item.variant}</p>
                )}
                <span className="font-extrabold text-neutral-900 text-sm block mt-1">
                  ${item.price.toFixed(2)} each
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQty(item.menuItemId, item.variant, item.qty - 1)}
                  className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center text-md hover:bg-neutral-50 font-bold"
                >
                  -
                </button>
                <span className="text-sm font-extrabold text-black">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.menuItemId, item.variant, item.qty + 1)}
                  className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center text-md hover:bg-neutral-50 font-bold"
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.menuItemId, item.variant)}
                className="text-xs font-bold text-rose-600 hover:text-rose-500 px-2 cursor-pointer"
              >
                Remove
              </button>
            </Card>
          ))}
        </div>

        {/* Pricing Summary Card */}
        <div className="space-y-6">
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
            <h3 className="text-lg font-bold text-black border-b border-neutral-100 pb-4 mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-neutral-800">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vat / Tax (10%)</span>
                <span className="font-bold text-neutral-800">${tax.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Applied ({coupon?.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <hr className="border-neutral-100 my-2" />

              <div className="flex justify-between text-base font-extrabold text-black">
                <span>Total Amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="mt-6 border-t border-neutral-100 pt-6">
              {coupon ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 flex items-center justify-between text-xs text-emerald-800">
                  <div>
                    <span className="font-bold">Coupon '{coupon.code}' Active!</span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {coupon.discountType === "percent"
                        ? `${coupon.discountValue}% Off subtotal`
                        : `$${coupon.discountValue} Flat discount`}
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="PROMOCODE"
                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm uppercase bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={applying}
                    className="rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold px-4 py-2"
                  >
                    Apply
                  </Button>
                </form>
              )}

              {couponError && <p className="mt-2 text-xs text-rose-600">{couponError}</p>}
              {couponSuccess && <p className="mt-2 text-xs text-emerald-600">{couponSuccess}</p>}
            </div>

            <Button
              className="w-full mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 cursor-pointer"
              as={Link}
              href="/checkout"
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
