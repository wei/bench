import RealtimePosts from "@/components/RealtimePosts";

export default function RealtimePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Realtime Demo</h1>
      <p className="mb-4">
        This page demonstrates Supabase Realtime. Open this page in multiple
        tabs and insert data into the 'posts' table to see updates instantly.
      </p>
      <RealtimePosts />
    </div>
  );
}
