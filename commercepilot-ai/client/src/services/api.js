let csrf = "";
export async function api(path, options = {}) {
  const response = await fetch("/api/v1" + path, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrf,
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "API unavailable. Start the backend and check the proxy configuration.",
    );
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  if (data.csrf) csrf = data.csrf;
  return data;
}
export const money = (n) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format((n || 0) / 100);
