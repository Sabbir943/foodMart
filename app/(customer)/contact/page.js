"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

const faqs = [
  { q: "How do I track my order?", a: "Go to My Orders, tap your active order and you'll see a live status timeline updated in real-time." },
  { q: "Can I cancel my order?", a: "Yes — orders can be cancelled before a rider is assigned (within ~5 minutes of placing)." },
  { q: "What payment methods are accepted?", a: "Cash on Delivery, bKash, Nagad, Rocket, and all major debit/credit cards." },
  { q: "How do I become a vendor?", a: "Sign up and choose the Vendor role. Your restaurant will be live after admin approval within 24 hours." },
];

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    // Simulate form submission (replace with real endpoint)
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    reset();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-20 px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">We&apos;re Here to Help</p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Contact Us</h1>
        <p className="mt-4 text-neutral-400 text-sm max-w-md mx-auto">
          Questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
        </p>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-2">
        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-extrabold text-black mb-6">Send a Message</h2>
          {submitted ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center">
              <span className="text-4xl">✅</span>
              <h3 className="mt-4 font-bold text-emerald-800 text-lg">Message Sent!</h3>
              <p className="mt-2 text-sm text-emerald-700">We&apos;ll get back to you within 24 hours.</p>
              <button onClick={() => setSubmitted(false)} className="mt-6 text-sm font-semibold text-emerald-700 underline cursor-pointer">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Subject</label>
                <select
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  {...register("subject")}
                >
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Issue</option>
                  <option value="vendor">Vendor Partnership</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us how we can help…"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  {...register("message", { required: "Message is required", minLength: { value: 10, message: "Please write at least 10 characters" } })}
                />
                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black hover:bg-neutral-800 px-6 py-3 text-white font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {loading ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info + FAQ */}
        <div className="space-y-8">
          {/* Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: "📧", title: "Email Us", value: "support@foodmart.com.bd", sub: "Reply within 24 hours" },
              { icon: "📞", title: "Call Us", value: "+880 1700-000000", sub: "Mon–Sat, 9am–9pm" },
              { icon: "📍", title: "Office", value: "Level 4, Gulshan Tower", sub: "Dhaka 1212, Bangladesh" },
              { icon: "💬", title: "Live Chat", value: "Available in app", sub: "Avg response: 5 mins" },
            ].map((info) => (
              <div key={info.title} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
                <span className="text-2xl">{info.icon}</span>
                <h3 className="mt-2 font-bold text-black text-sm">{info.title}</h3>
                <p className="text-sm text-neutral-700 font-medium mt-1">{info.value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{info.sub}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-lg font-extrabold text-black mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-black hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                  >
                    {faq.q}
                    <span className={`ml-3 text-amber-500 text-lg transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
