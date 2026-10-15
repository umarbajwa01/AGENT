import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Compass, Shield, ArrowUpRight } from "lucide-react";
import { useAction } from "../../hooks/useApi.js";
import { Field } from "../../components/common/Field.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
export function Login() {
  const nav = useNavigate(),
    m = useAction();
  const schema = z.object({
    email: z.email(),
    password: z.string().min(1, "Enter your password"),
    otp: z.string(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });
  return (
    <div className="login">
      <div className="login-story">
        <div className="brand">
          <Compass /> CommercePilot <small>AI</small>
        </div>
        <div>
          <div className="eyebrow">YOUR STORE. IN CONTROL.</div>
          <h1>
            Less busywork.
            <br />
            More business.
          </h1>
          <p>
            One workspace for your catalog, conversations and cash-on-delivery
            orders.
          </p>
          <div className="story-line">
            <Shield /> Secure operations, from chat to checkout.
          </div>
        </div>
        <span>CommercePilot AI · Commerce workspace</span>
      </div>
      <main className="login-form">
        <div className="eyebrow">WELCOME BACK</div>
        <h1>Sign in to your store</h1>
        <p>Access your catalog, orders and customer conversations.</p>
        <form
          onSubmit={handleSubmit(async (body) => {
            try {
              await m.mutateAsync({
                path: "/auth/login",
                body,
              });
              nav("/");
            } catch {}
          })}
        >
          <Field label="Work email">
            <input
              type="email"
              autoComplete="username"
              {...register("email")}
            />
          </Field>
          <ErrorBox error={errors.email} />
          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </Field>
          <ErrorBox error={errors.password} />
          <Field label="Authenticator code (if enabled)">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              {...register("otp")}
            />
          </Field>
          <ErrorBox error={m.error} />
          <button className="primary full" disabled={m.isPending}>
            {m.isPending ? "Signing in…" : "Sign in"} <ArrowUpRight size={18} />
          </button>
        </form>
        <Link className="sim-link" to="/simulator">
          Open customer simulator <ArrowUpRight size={16} />
        </Link>
        <p className="fine">
          Use the owner account created with the setup script. No default
          password is included.
        </p>
      </main>
    </div>
  );
}
