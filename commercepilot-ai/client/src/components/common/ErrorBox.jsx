export function ErrorBox({ error }) {
  return error ? (
    <div role="alert" className="error">
      {error.message || error}
    </div>
  ) : null;
}
