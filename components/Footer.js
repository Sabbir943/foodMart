import Link from "next/link";
import { Card } from "@heroui/react";

const footerLinks = {
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  partners: [
    { href: "/vendor", label: "Become a Vendor" },
    { href: "/rider", label: "Become a Rider" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="shadow-soft rounded-2xl border border-neutral-100">
          <Card.Header className="border-b border-neutral-100 px-6 py-5">
            <Card.Title className="text-lg font-bold text-black">
              FoodMart
            </Card.Title>
            <Card.Description className="text-neutral-500">
              Fresh food, delivered fast.
            </Card.Description>
          </Card.Header>

          <Card.Content className="grid gap-8 px-6 py-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black">
                  {section}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-600 transition-colors hover:text-black"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card.Content>

          <Card.Footer className="border-t border-neutral-100 px-6 py-4">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} FoodMart. All rights reserved.
            </p>
          </Card.Footer>
        </Card>
      </div>
    </footer>
  );
}
