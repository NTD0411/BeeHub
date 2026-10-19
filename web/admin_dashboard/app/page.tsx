import { redirect } from "next/navigation";

export default function RootPage() {
  // TEMPORARY: Don't redirect, just show a message
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🏠 Root Page</h1>
      <p>Redirect disabled for debugging</p>
      <a href="/login" style={{ marginRight: '20px' }}>Go to Login</a>
      <a href="/dashboard-simple">Go to Dashboard Simple</a>
    </div>
  );
  // redirect("/dashboard");
}
