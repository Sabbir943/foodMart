import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl">🍔</span>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-black">
        404
      </h1>
      <p className="mt-3 text-lg font-semibold text-neutral-700">
        Page Not Found
      </p>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white hover:bg-neutral-800 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
