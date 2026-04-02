import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Jambu Pro
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          A professional property dealer management app with calculators,
          deal summaries, CRM tools, and visiting card generation — designed
          to simplify real estate workflows.
        </p>

        <Link
          href="/privacy"
          className="inline-block rounded-lg bg-black px-6 py-3 text-white transition hover:opacity-80 dark:bg-white dark:text-black"
        >
          View Privacy Policy
        </Link>

        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link
            href="/terms"
            className="inline-block rounded-lg border border-zinc-400 px-5 py-2 text-sm text-black transition hover:opacity-80 dark:border-zinc-600 dark:text-white"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="inline-block rounded-lg border border-zinc-400 px-5 py-2 text-sm text-black transition hover:opacity-80 dark:border-zinc-600 dark:text-white"
          >
            Contact
          </Link>
          <Link
            href="/delete-account"
            className="inline-block rounded-lg border border-zinc-400 px-5 py-2 text-sm text-black transition hover:opacity-80 dark:border-zinc-600 dark:text-white"
          >
            Delete Account
          </Link>
          <Link
            href="/admin/login"
            className="inline-block rounded-lg border border-zinc-400 px-5 py-2 text-sm text-black transition hover:opacity-80 dark:border-zinc-600 dark:text-white"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </main>
  );
}
