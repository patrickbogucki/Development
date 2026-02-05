import { UnifiedFeedbackCenter } from "@/components/UnifiedFeedbackCenter";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-col items-center justify-center text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Welcome to the Portal
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl">
          This is a demo page for the Unified Feedback Center.
          Click the "Feedback" button in the bottom right corner to interact with the component.
        </p>

        <UnifiedFeedbackCenter />
      </main>
    </div>
  );
}
