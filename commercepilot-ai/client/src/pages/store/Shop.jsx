import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  MessageSquare,
  Plus,
  ChevronRight,
  Send,
  ShoppingCart,
  X,
  Check,
} from "lucide-react";
import { api, money } from "../../services/api.js";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { OrderTable } from "../../components/orders/OrderTable.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Field } from "../../components/common/Field.jsx";
import { Status } from "../../components/common/Status.jsx";
export function Shop() {
  const products = useData("/products?limit=100"),
    cart = useData("/cart"),
    orders = useData("/orders"),
    m = useAction(),
    [text, setText] = useState(""),
    [chatlog, setChatlog] = useState([
      {
        text: "Hello! I’m your automated store assistant. Browse the catalog, ask about products, or type “human” for support.",
        role: "assistant",
      },
    ]),
    [checkout, setCheckout] = useState(false),
    [quote, setQuote] = useState(null),
    [receipt, setReceipt] = useState(null),
    [key, setKey] = useState("");
  const messages = useQuery({
    queryKey: ["sim-messages"],
    queryFn: () => api("/messages"),
    refetchInterval: 5000,
  });
  return (
    <main className="shop">
      <PageHead
        eyebrow="CUSTOMER EXPERIENCE"
        title="Everyday essentials, thoughtfully chosen."
        description="Find your next everyday favorite. Clear pricing. Cash on delivery."
      />
      <div className="shop-grid">
        <section>
          <State query={products}>
            {(d) => (
              <div className="catalog">
                {d.items.map((p) => (
                  <article className="card catalog-product" key={p._id}>
                    <div className="catalog-image">
                      {p.image ? (
                        <img src={p.image} alt={p.name} />
                      ) : (
                        <Package size={48} strokeWidth={1} />
                      )}
                    </div>
                    <div className="pad">
                      <small>{p.category}</small>
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      {p.variants.map((v) => (
                        <div className="variant-buy" key={v._id}>
                          <div>
                            <span>{v.label}</span>
                            <b>{money(v.price)}</b>
                            <small>{v.stock} available</small>
                          </div>
                          <button
                            aria-label={"Add " + p.name + " " + v.label}
                            disabled={!v.stock || m.isPending}
                            onClick={() => {
                              const n =
                                (cart.data?.items.find(
                                  (i) => i.variant === v._id,
                                )?.quantity || 0) + 1;
                              m.mutate({
                                path: "/cart/items",
                                body: {
                                  variant: v._id,
                                  quantity: n,
                                },
                              });
                            }}
                          >
                            <Plus size={18} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </State>
          <section
            className="card"
            style={{
              marginTop: 24,
            }}
          >
            <div className="card-head">
              <h2>My orders</h2>
            </div>
            <State query={orders}>
              {(d) =>
                d.items.length ? (
                  <OrderTable items={d.items} onSelect={setReceipt} />
                ) : (
                  <div className="empty">
                    No orders in this customer session.
                  </div>
                )
              }
            </State>
          </section>
        </section>
        <div className="shop-side">
          <section className="card">
            <div className="card-head">
              <h2>
                <ShoppingCart size={19} /> Your cart
              </h2>
              <span>{cart.data?.items.length || 0} items</span>
            </div>
            <div className="pad">
              <State query={cart}>
                {(d) => (
                  <>
                    {d.items.map((i) => (
                      <div className="cart-item" key={i.variant}>
                        <div>
                          <b>{i.name}</b>
                          <small>
                            {i.label} · {money(i.price)}
                          </small>
                        </div>
                        <input
                          aria-label={"Quantity for " + i.name}
                          type="number"
                          min="1"
                          max={Math.min(50, i.stock)}
                          value={i.quantity}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (n >= 1)
                              m.mutate({
                                path: "/cart/items/" + i.variant,
                                method: "PATCH",
                                body: {
                                  quantity: n,
                                },
                              });
                          }}
                        />
                        <button
                          className="icon"
                          aria-label={"Remove " + i.name}
                          onClick={() =>
                            m.mutate({
                              path: "/cart/items/" + i.variant,
                              method: "DELETE",
                            })
                          }
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    {!d.items.length && (
                      <p>Your cart is empty. Add a product to begin.</p>
                    )}
                    <div className="split total">
                      <b>Subtotal</b>
                      <b>{money(d.subtotal)}</b>
                    </div>
                    <p className="fine">
                      Delivery and valid discounts are calculated at checkout.
                    </p>
                    <button
                      className="primary full"
                      disabled={!d.items.length}
                      onClick={() => {
                        setCheckout(true);
                        setQuote(null);
                      }}
                    >
                      Review COD checkout <ChevronRight size={17} />
                    </button>
                  </>
                )}
              </State>
              <ErrorBox error={m.error} />
            </div>
          </section>
          <section className="card chat-card">
            <div className="card-head">
              <div>
                <h2>
                  <MessageSquare size={19} /> Store assistant
                </h2>
                <p>English · Urdu · Roman Urdu</p>
              </div>
            </div>
            <div className="messages" aria-live="polite">
              {(messages.data?.length
                ? messages.data.slice().reverse()
                : chatlog
              ).map((msg, i) => (
                <div
                  key={msg._id || i}
                  className={
                    "bubble " + (msg.role === "user" ? "outgoing" : "incoming")
                  }
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <form
              className="composer"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setChatlog([
                    ...chatlog,
                    {
                      text,
                      role: "user",
                    },
                  ]);
                  const reply = await m.mutateAsync({
                    path: "/ai/chat",
                    body: {
                      text,
                    },
                  });
                  setChatlog((prev) => [
                    ...prev,
                    {
                      text: reply.text,
                      role: "assistant",
                    },
                  ]);
                  setText("");
                } catch {}
              }}
            >
              <input
                required
                aria-label="Message the assistant"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about a product…"
              />
              <button
                className="primary icon"
                aria-label="Send message"
                disabled={m.isPending}
              >
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      </div>
      {checkout && (
        <Modal
          title={quote ? "Review your COD order" : "Delivery details"}
          onClose={() => setCheckout(false)}
        >
          <div className="modal-body">
            {!quote ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = Object.fromEntries(new FormData(e.target));
                  const coupon = f.coupon;
                  delete f.coupon;
                  try {
                    const q = await m.mutateAsync({
                      path: "/orders/quote",
                      body: {
                        address: f,
                        ...(coupon
                          ? {
                              coupon,
                            }
                          : {}),
                      },
                    });
                    setQuote(q);
                    setKey(crypto.randomUUID());
                  } catch {}
                }}
              >
                {[
                  ["name", "Full name"],
                  ["phone", "Phone number"],
                  ["city", "Delivery city"],
                  ["address", "Complete address"],
                  ["coupon", "Coupon (optional)"],
                ].map(([k, label]) => (
                  <Field key={k} label={label}>
                    <input
                      name={k}
                      required={k !== "coupon"}
                      autoComplete={
                        k === "name"
                          ? "name"
                          : k === "phone"
                            ? "tel"
                            : k === "address"
                              ? "street-address"
                              : "off"
                      }
                    />
                  </Field>
                ))}
                <ErrorBox error={m.error} />
                <button className="primary full" disabled={m.isPending}>
                  Get final quote
                </button>
              </form>
            ) : (
              <>
                <p>
                  {quote.address.name} · {quote.address.city}
                </p>
                {quote.items.map((i) => (
                  <div className="split" key={i.variant}>
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <b>{money(i.price * i.quantity)}</b>
                  </div>
                ))}
                <div className="split">
                  <span>Delivery</span>
                  {money(quote.shipping)}
                </div>
                <div className="split">
                  <span>Discount</span>−{money(quote.discount)}
                </div>
                <div className="split total">
                  <b>Total cash on delivery</b>
                  <b>{money(quote.total)}</b>
                </div>
                <p className="fine">
                  Quote expires at{" "}
                  {new Date(quote.expires).toLocaleTimeString()}. Confirmation
                  saves a request awaiting staff approval. Payment is not
                  collected online.
                </p>
                <ErrorBox error={m.error} />
                <button
                  className="primary full"
                  disabled={m.isPending}
                  onClick={async () => {
                    try {
                      const o = await m.mutateAsync({
                        path: "/orders",
                        body: {
                          quoteId: quote._id,
                          nonce: quote.nonce,
                          idempotencyKey: key,
                          confirmed: true,
                        },
                      });
                      setReceipt(o);
                      setCheckout(false);
                    } catch {}
                  }}
                >
                  {m.isPending ? "Saving order…" : "Confirm COD order"}
                </button>
                <button className="full" onClick={() => setQuote(null)}>
                  Edit delivery details
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {receipt && (
        <Modal title="Order request saved" onClose={() => setReceipt(null)}>
          <div className="modal-body">
            <div className="success-mark">
              <Check size={30} />
            </div>
            <h2>{receipt.reference}</h2>
            <Status>{receipt.status}</Status>
            <p>Your order is stored. Staff will review the request.</p>
            <div className="split">
              <span>COD amount</span>
              <b>{money(receipt.total)}</b>
            </div>
            <div className="split">
              <span>Payment status</span>
              <b>{receipt.paymentStatus}</b>
            </div>
            <p>
              {receipt.address.address}, {receipt.address.city}
            </p>
            <button className="primary full" onClick={() => setReceipt(null)}>
              Continue shopping
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
