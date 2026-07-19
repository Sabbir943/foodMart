export const metadata = {
  title: "About Us",
  description: "Learn about FoodMart — our mission, team, and story.",
};

const stats = [
  { value: "500+", label: "Partner Restaurants" },
  { value: "50K+", label: "Happy Customers" },
  { value: "30 min", label: "Avg Delivery Time" },
  { value: "4.9★", label: "App Rating" },
];

const team = [
  {
    name: "Arif Rahman",
    role: "Co-Founder & CEO",
    emoji: "👨‍💼",
    bio: "Former engineer at Pathao. Passionate about logistics and local food culture.",
  },
  {
    name: "Nadia Islam",
    role: "Head of Operations",
    emoji: "👩‍💻",
    bio: "10+ years in e-commerce operations. Built delivery networks across Dhaka.",
  },
  {
    name: "Rahim Hossain",
    role: "Head of Partnerships",
    emoji: "🤝",
    bio: "Connects hundreds of restaurants with hungry customers every day.",
  },
];

const values = [
  { icon: "🌱", title: "Fresh & Local", desc: "We partner with local kitchens to support the community and serve the freshest food." },
  { icon: "⚡", title: "Speed First", desc: "From order to doorstep in under 45 minutes — guaranteed or your next delivery is free." },
  { icon: "🔒", title: "Secure & Reliable", desc: "End-to-end encrypted payments and real-time order tracking you can trust." },
  { icon: "❤️", title: "Customer Love", desc: "Our 24/7 support team is here for you. Your satisfaction is our mission." },
];

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 py-24 px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Our Story</p>
        <h1 className="text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
          Feeding <span className="text-amber-500">Bangladesh</span>, One Meal at a Time
        </h1>
        <p className="mt-6 text-neutral-300 text-base max-w-xl mx-auto leading-relaxed">
          FoodMart was born in 2023 from a simple idea: great food should be accessible to everyone,
          anywhere in Dhaka — in under 45 minutes.
        </p>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-100">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-black">{s.value}</p>
                <p className="mt-1 text-sm text-neutral-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-amber-50 border border-amber-100 p-10 text-center">
          <span className="text-5xl">🎯</span>
          <h2 className="mt-6 text-3xl font-extrabold text-black">Our Mission</h2>
          <p className="mt-4 text-neutral-600 text-base leading-relaxed max-w-2xl mx-auto">
            To build the most reliable and delightful food delivery experience in Bangladesh —
            empowering local restaurants, creating jobs for riders, and bringing joy to every customer.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-50 py-20 border-t border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-black">What We Stand For</h2>
            <p className="mt-3 text-neutral-500 text-sm">The values that guide every decision we make.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white border border-neutral-100 p-6 shadow-soft hover:-translate-y-1 transition-all duration-300">
                <span className="text-4xl">{v.icon}</span>
                <h3 className="mt-4 font-bold text-black">{v.title}</h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-black">Meet the Team</h2>
          <p className="mt-3 text-neutral-500 text-sm">The people building FoodMart every day.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
          {team.map((member) => (
            <div key={member.name} className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft text-center hover:-translate-y-1 transition-all duration-300">
              <span className="text-5xl">{member.emoji}</span>
              <h3 className="mt-4 font-bold text-black">{member.name}</h3>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mt-1">{member.role}</p>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-16 px-4 text-center">
        <h2 className="text-3xl font-extrabold text-white">Ready to Order?</h2>
        <p className="mt-3 text-neutral-400 text-sm">Join 50,000+ happy customers today.</p>
        <a
          href="/restaurants"
          className="mt-8 inline-block rounded-2xl bg-amber-500 hover:bg-amber-600 px-8 py-4 text-white font-bold text-sm transition-colors"
        >
          Browse Restaurants →
        </a>
      </section>
    </div>
  );
}
