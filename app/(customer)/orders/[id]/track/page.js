"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button } from "@heroui/react";
import toast from "react-hot-toast";

// Star Rating Selector Component
const StarSelector = ({ rating, onChange, label }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-neutral-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <svg
              className={`h-8 w-8 ${
                star <= rating ? "text-amber-400 fill-amber-400" : "text-neutral-300"
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function TrackOrderPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchOrderDetails = async (showSilently = false) => {
    try {
      if (!showSilently) setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load order details");
      }
      const data = await res.json();
      setOrder(data.order);
      setHasReviewed(data.hasReviewed);
      setError("");
    } catch (err) {
      console.error(err);
      if (!showSilently) setError(err.message || "Could not retrieve order information.");
    } finally {
      if (!showSilently) setLoading(false);
    }
  };

  // Poll for updates every 10 seconds
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchOrderDetails();
    });

    const interval = setInterval(() => {
      if (active) fetchOrderDetails(true);
    }, 10000); // Poll every 10 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      setCancelError("");
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }
      setShowCancelModal(false);
      fetchOrderDetails();
    } catch (err) {
      console.error(err);
      setCancelError(err.message || "Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      setReviewError("");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          restaurantRating,
          riderRating: order?.riderId ? riderRating : undefined,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }
      setHasReviewed(true);
      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      setReviewError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper to format date/time
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };



  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-6">
            <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
              <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
              <div className="mt-8 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4 items-center">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                      <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="w-full md:w-80 space-y-6">
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600">Order not found</h2>
        <p className="mt-2 text-neutral-600">{error || "The requested order could not be located."}</p>
        <Button variant="primary" className="mt-6" as={Link} href="/orders">
          Back to My Orders
        </Button>
      </div>
    );
  }

  const steps = [
    { key: "placed", label: "Placed", desc: "Order submitted" },
    { key: "confirmed", label: "Confirmed", desc: "Accepted by restaurant" },
    { key: "preparing", label: "Preparing", desc: "Cooking your meal" },
    { key: "out_for_delivery", label: "Out for Delivery", desc: "Rider on the way" },
    { key: "delivered", label: "Delivered", desc: "Enjoy your food!" },
  ];

  // Find index of current status
  const currentStepIdx = steps.findIndex((step) => step.key === order.status);
  const isCancelled = order.status === "cancelled";

  // Calculate items subtotal
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = 5.0; // Mock delivery fee
  const tax = subtotal * 0.1; // 10% tax

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm font-semibold text-neutral-600 hover:text-black transition-colors gap-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Orders
        </Link>
      </div>

      {/* Header Info */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Order Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black mt-1">
            Order #{order._id.substring(order._id.length - 8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Cancel Order Action */}
          {["placed", "confirmed"].includes(order.status) && (
            <Button
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
              onPress={() => setShowCancelModal(true)}
            >
              Cancel Order
            </Button>
          )}

          {/* Rate Order Action */}
          {order.status === "delivered" && !hasReviewed && (
            <Button
              variant="primary"
              className="bg-black text-white hover:bg-neutral-800"
              onPress={() => setShowReviewModal(true)}
            >
              Rate Order
            </Button>
          )}

          {order.status === "delivered" && hasReviewed && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              Reviewed ✓
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Tracking Timeline and Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cancelled Banner */}
          {isCancelled && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
              <div className="flex gap-3 items-center">
                <div className="rounded-full bg-rose-100 p-2 text-rose-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-rose-900">Order Cancelled</h3>
                  <p className="text-sm text-rose-700 mt-0.5">
                    This order was cancelled on {formatDate(order.statusTimestamps?.cancelled)} at{" "}
                    {formatTime(order.statusTimestamps?.cancelled)}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stepper/Timeline Card */}
          {!isCancelled && (
            <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 sm:p-8">
              <Card.Header className="px-0 pt-0 pb-6 border-b border-neutral-100">
                <Card.Title className="text-xl font-bold text-black">Delivery Status</Card.Title>
                <Card.Description className="text-neutral-500">
                  Live updates directly from the kitchen and rider.
                </Card.Description>
              </Card.Header>

              <Card.Content className="px-0 py-6">
                <div className="relative pl-8 sm:pl-0 sm:flex sm:justify-between">
                  {/* Vertical Line on Mobile, Horizontal Line on Desktop */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-neutral-200 sm:left-0 sm:right-0 sm:top-4 sm:bottom-auto sm:w-auto sm:h-0.5 sm:mx-8" />
                  
                  {/* Progress Line Filler (Desktop only) */}
                  {currentStepIdx >= 0 && (
                    <div
                      className="hidden sm:block absolute left-0 right-0 top-4 h-0.5 bg-black transition-all duration-500 ease-in-out sm:mx-8"
                      style={{
                        width: `${(currentStepIdx / (steps.length - 1)) * 90}%`,
                      }}
                    />
                  )}

                  {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isActive = idx === currentStepIdx;
                    const timestamp = order.statusTimestamps?.[step.key];

                    return (
                      <div
                        key={step.key}
                        className={`relative mb-8 last:mb-0 sm:mb-0 sm:flex sm:flex-col sm:items-center sm:text-center sm:flex-1`}
                      >
                        {/* Circle Badge Indicator */}
                        <div
                          className={`absolute -left-8 top-1.5 sm:relative sm:left-auto sm:top-0 z-10 flex h-7.5 w-7.5 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isCompleted
                              ? "bg-black border-black text-white"
                              : isActive
                              ? "bg-white border-black text-black ring-4 ring-neutral-100 animate-pulse"
                              : "bg-white border-neutral-200 text-neutral-400"
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-xs font-semibold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Labels */}
                        <div className="sm:mt-4">
                          <h4
                            className={`font-bold text-sm sm:text-base ${
                              isActive ? "text-black" : isCompleted ? "text-neutral-800" : "text-neutral-400"
                            }`}
                          >
                            {step.label}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-0.5 max-w-[150px] mx-auto hidden sm:block">
                            {step.desc}
                          </p>
                          {timestamp && (
                            <span className="inline-block mt-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                              {formatTime(timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Items Summary Card */}
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
            <Card.Header className="px-0 pt-0 pb-4 border-b border-neutral-100">
              <Card.Title className="text-xl font-bold text-black">Order Summary</Card.Title>
            </Card.Header>

            <Card.Content className="px-0 py-4">
              <div className="divide-y divide-neutral-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold text-black">
                        {item.menuItemId?.name || "Menu Item"}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-neutral-500">Variant: {item.variant}</p>
                      )}
                      <p className="text-xs text-neutral-500">Qty: {item.qty} × ৳{item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-semibold text-black">
                      ৳{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-black font-medium">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-black font-medium">৳{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span className="text-black font-medium">৳{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-bold text-black">
                  <span>Total Amount</span>
                  <span>৳{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </Card.Content>

            <Card.Footer className="px-0 pb-0 border-t border-neutral-100 pt-4 flex justify-between text-xs text-neutral-500">
              <div className="flex flex-col gap-0.5">
                <span className="uppercase tracking-wide font-semibold text-[10px] text-neutral-400">Payment Method</span>
                <span className="font-bold text-neutral-800 capitalize">{order.paymentMethod.replace("_", " ")}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="uppercase tracking-wide font-semibold text-[10px] text-neutral-400">Payment Status</span>
                <span className="font-bold text-neutral-800 capitalize">{order.paymentStatus}</span>
              </div>
            </Card.Footer>
          </Card>
        </div>

        {/* Right Column: Restaurant & Rider Info */}
        <div className="space-y-8">
          {/* Restaurant Card */}
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
            <Card.Header className="px-0 pt-0 pb-4 border-b border-neutral-100">
              <Card.Title className="text-lg font-bold text-black">Restaurant Details</Card.Title>
            </Card.Header>
            <Card.Content className="px-0 py-4 space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-base">
                  {order.restaurantId?.name || "Restaurant"}
                </h3>
                <p className="text-xs text-neutral-500 capitalize">
                  Cuisine: {order.restaurantId?.category || "N/A"}
                </p>
              </div>
              
              <div className="flex gap-2 items-start text-xs text-neutral-600">
                <svg className="h-4 w-4 mt-0.5 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {order.restaurantId?.address?.street}, {order.restaurantId?.address?.city}
                </span>
              </div>

              <div className="border-t border-neutral-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-semibold border-neutral-200 text-black"
                  onPress={() => toast.success("Calling restaurant at +1-800-FOOD-MART 📞")}
                >
                  Call Restaurant
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Delivery Address Card */}
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6">
            <Card.Header className="px-0 pt-0 pb-4 border-b border-neutral-100">
              <Card.Title className="text-lg font-bold text-black">Delivery Location</Card.Title>
            </Card.Header>
            <Card.Content className="px-0 py-4 text-xs text-neutral-600 space-y-3">
              <div className="flex gap-2 items-start">
                <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div>
                  <p className="font-bold text-neutral-800 capitalize">
                    {order.deliveryAddress?.label || "Address"}
                  </p>
                  <p className="mt-0.5">
                    {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                  </p>
                </div>
              </div>
              {order.deliveryAddress?.instructions && (
                <div className="border-t border-neutral-100 pt-2.5">
                  <span className="font-bold text-neutral-700 block mb-0.5">Drop-off Note:</span>
                  <span className="italic text-neutral-500">&quot;{order.deliveryAddress.instructions}&quot;</span>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-soft-lg transition-all">
            <h3 className="text-lg font-bold text-black">Cancel Order?</h3>
            <p className="text-sm text-neutral-600 mt-2">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            {cancelError && (
              <p className="text-xs font-semibold text-red-500 mt-2">{cancelError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 text-white hover:bg-red-700"
                onPress={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post-delivery Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-soft-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-black">Rate Your Order</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Share your experience with {order.restaurantId?.name || "the restaurant"}.
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-neutral-400 hover:text-black focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {reviewError && (
              <p className="text-xs font-semibold text-red-500 mb-4">{reviewError}</p>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Restaurant Rating */}
              <StarSelector
                rating={restaurantRating}
                onChange={setRestaurantRating}
                label={`How was the food from ${order.restaurantId?.name || "the restaurant"}?`}
              />

              {/* Rider Rating (if assigned) */}
              {order.riderId && (
                <StarSelector
                  rating={riderRating}
                  onChange={setRiderRating}
                  label="How was the delivery rider's service?"
                />
              )}

              {/* Review Comments */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-neutral-700">
                  Write a comment (optional)
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  className="w-full h-24 p-3 text-sm border border-neutral-200 rounded-xl focus:border-black focus:outline-none resize-none"
                  maxLength={1000}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button
                  variant="ghost"
                  type="button"
                  onPress={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
