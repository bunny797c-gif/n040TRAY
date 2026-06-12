// Re-mounts on every route change, giving each page a soft entrance.
export default function Template({ children }) {
  return <div className="page-transition">{children}</div>;
}
