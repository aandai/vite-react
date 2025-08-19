import React, { useEffect, useMemo, useState } from "react";
import { NFTStorage } from "nft.storage";

const logoUrl = "/logo.png";

// ---------- Types ----------
type Post = { v: 1; text: string; ts: number; author: string; cid?: string };

// ---------- Token handling ----------
// Primary source: .env (Vite exposes env vars via import.meta.env)
const ENV_TOKEN = import.meta.env.VITE_NFTSTORAGE_TOKEN as string | undefined;
// Allow overriding at runtime (useful in demos) via localStorage
const LS_KEY = "nft_token_override";

function getActiveToken(): string | null {
  const override = localStorage.getItem(LS_KEY);
  return (override && override.trim()) || (ENV_TOKEN ?? null);
}

export default function App() {
  const [author, setAuthor] = useState("anon-" + crypto.randomUUID().slice(0, 6));
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(false);
  const [hasToken, setHasToken] = useState<boolean>(!!getActiveToken());

  // Persist simple state locally (demo feed)
  useEffect(() => {
    try {
      const a = localStorage.getItem("hope_author");
      const p = localStorage.getItem("hope_posts");
      if (a) setAuthor(a);
      if (p) setPosts(JSON.parse(p));
    } catch {}
  }, []);
  useEffect(() => localStorage.setItem("hope_author", author), [author]);
  useEffect(() => localStorage.setItem("hope_posts", JSON.stringify(posts)), [posts]);

  // NFT.Storage client (recreated if token changes)
  const client = useMemo(() => {
    const token = getActiveToken();
    return token ? new NFTStorage({ token }) : null;
  }, [hasToken]);

  function openSettings() {
    const current = localStorage.getItem(LS_KEY) || "";
    const t = window.prompt(
      "Paste an NFT.Storage API token (get one free at https://nft.storage )",
      current
    );
    if (t === null) return; // cancel
    const trimmed = t.trim();
    if (trimmed) {
      localStorage.setItem(LS_KEY, trimmed);
      setHasToken(true);
      alert("Token saved (override).");
    } else {
      localStorage.removeItem(LS_KEY);
      setHasToken(!!ENV_TOKEN);
      alert("Override cleared. Using .env token if present.");
    }
  }

  async function publish() {
    const t = text.trim();
    if (!t) return;
    if (!client) {
      openSettings();
      return;
    }

    setBusy(true);
    try {
      const doc: Post = { v: 1, text: t, ts: Math.floor(Date.now() / 1000), author };
      const blob = new Blob([JSON.stringify(doc)], { type: "application/json" });

      // Simplest SDK call: returns the CID string
      const cid = await client.storeBlob(blob);

      setPosts((p) => [{ ...doc, cid }, ...p]);
      setText("");
    } catch (e: any) {
      alert(e?.message ?? "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <nav className="nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logoUrl} alt="HOPE" width={42} height={42} style={{ borderRadius: 8 }} />
          <h1 style={{ margin: 0 }}>HOPE</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #0a72ab", borderRadius: 999, background: "#0a73ad" }}>
            IPFS via NFT.Storage
          </span>
          <button
            onClick={openSettings}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #0a72ab", background: "#0a73ad", color: "#fff" }}
          >
            {hasToken ? "Settings" : "Set Token"}
          </button>
        </div>
      </nav>

      <section
        className="card"
        style={{ background: "#0a7fbf", border: "1px solid #0a72ab", borderRadius: 16, padding: 14, boxShadow: "0 6px 20px rgba(0,0,0,.15)", marginBottom: 16 }}
      >
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your handle"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #0a72ab", background: "#0a73ad", color: "#fff" }}
        />
        <div style={{ height: 10 }} />
        <textarea
          placeholder="Write your post (text only). Avoid names/locations if unsafe."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #0a72ab", background: "#0a73ad", color: "#fff" }}
        />
        <div style={{ display: "flex
