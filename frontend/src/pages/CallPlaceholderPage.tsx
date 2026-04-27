import { Link, useParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.js";

// M3 replaces this with the real Live Call view.
export const CallPlaceholderPage = (): React.ReactElement => {
  const { id } = useParams();
  return (
    <div className="min-h-full flex flex-col">
      <AppHeader />
      <main className="flex-1 px-10 py-8 max-w-3xl w-full mx-auto">
        <h2 className="text-base font-medium">Live Call</h2>
        <p className="text-sm text-muted mt-1">
          Meeting <span className="font-mono">{id}</span>. The Live Call view lands in M3.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 text-sm text-muted hover:text-ink transition-colors"
        >
          Back to queue
        </Link>
      </main>
    </div>
  );
};
