import React, { useState, useRef, useEffect } from "react";
import {
  Home, Wallet as WalletIcon, ShoppingBag, User, ArrowDownLeft, ArrowUpRight,
  Plus, X, Check, ChevronRight, BookOpen, GraduationCap, FileText,
  Smartphone, Loader2, ArrowLeft, Search, Star, RotateCcw, PlayCircle,
  CheckCircle2, Circle, ChevronLeft, Download, Sparkles, Send, Users,
  Heart, MessageCircle, UserPlus, UserCheck, LogOut, AlertTriangle
} from "lucide-react";

// ---------- Config ----------
const API_BASE = "https://vortex-backenda.onrender.com";
const AUTH_KEY = "vortex-auth-v1";
const LOCAL_KEY = "vortex-local-v1"; // progress + community : pas encore côté serveur

const fmt = (n) => n.toLocaleString("fr-FR").replace(/,/g, " ") + " F";

const CATEGORY_ICON = { ACADEMY: GraduationCap, LIBRARY: BookOpen, MARKET: FileText };
const CATEGORY_LABEL = { ACADEMY: "Academy", LIBRARY: "Library", MARKET: "Market" };

const PROVIDERS = [
  { id: "ORANGE", name: "Orange Money", color: "#FF6600" },
  { id: "MTN", name: "MTN MoMo", color: "#FFCC00" },
  { id: "WAVE", name: "Wave", color: "#1DC8E8" },
  { id: "MOOV", name: "Moov Money", color: "#0072BC" },
];

const CREATORS = [
  { id: "c1", name: "Aïcha Diallo", bio: "Coach en Analyse Technique", color: "#D6A337" },
  { id: "c2", name: "Yao Koffi", bio: "Auteur — Psychologie du Trader", color: "#2E9E83" },
  { id: "c3", name: "Fatou Sarr", bio: "Formatrice Money Management", color: "#E0654A" },
  { id: "c4", name: "YOS Vortex", bio: "Équipe pédagogique VORTEX", color: "#D6A337" },
];

const POSTS = [
  { id: "p1", creatorId: "c4", tag: "Academy", content: "Nouvelle leçon ajoutée dans « Analyse Technique — Niveau 1 » : étude de cas sur les paires africaines et USD.", likes: 58, comments: 12, date: "Il y a 2h" },
  { id: "p2", creatorId: "c1", tag: "Conseil", content: "Erreur classique de débutant : ouvrir une position juste avant une annonce économique majeure. Attendez la publication.", likes: 134, comments: 27, date: "Il y a 5h" },
  { id: "p3", creatorId: "c2", tag: "Library", content: "La vengeance après une perte est le piège n°1 des traders débutants. Un plan écrit vaut mieux qu'une décision à chaud.", likes: 96, comments: 14, date: "Hier" },
  { id: "p4", creatorId: "c3", tag: "Wallet", content: "Astuce Mobile Money : gardez une trace écrite de vos dépôts/retraits liés au trading, séparée du quotidien.", likes: 71, comments: 9, date: "Hier" },
];

// ---------- API helper ----------
async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* réponse vide */ }
  if (!res.ok) {
    const message = data?.error?.formErrors?.[0] || data?.error || `Erreur ${res.status}`;
    throw new Error(typeof message === "string" ? message : "Erreur serveur");
  }
  return data;
}

// ---------- Small building blocks ----------

function VortexMark({ size = 28, spinning = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={spinning ? "motion-safe:animate-[spin_6s_linear_infinite]" : ""}>
      <path d="M20 4 C11 4 4 11 4 20" stroke="#D6A337" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 8 C14 8 8 14 8 20" stroke="#D6A337" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <path d="M36 20 C36 29 29 36 20 36" stroke="#2E9E83" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 20 C32 26 26 32 20 32" stroke="#2E9E83" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <circle cx="20" cy="20" r="3" fill="#F6F2E9" />
    </svg>
  );
}

function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} aria-label="Retour" className="text-[#F6F2E9]/70 hover:text-[#F6F2E9]">
          <ArrowLeft size={20} />
        </button>
      )}
      <div>
        <h1 className="text-[#F6F2E9] text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[#F6F2E9]/50 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Toast({ message, tone = "teal" }) {
  const bg = tone === "teal" ? "bg-[#2E9E83]" : "bg-[#E0654A]";
  return (
    <div className={`fixed left-1/2 -translate-x-1/2 top-6 z-50 ${bg} text-[#0F1626] text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 max-w-[85%] text-center`}>
      <Check size={16} strokeWidth={3} className="shrink-0" />
      {message}
    </div>
  );
}

function ProgressBar({ pct, color = "#2E9E83" }) {
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ---------- Auth ----------

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | register
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("SN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waking, setWaking] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    const wakeTimer = setTimeout(() => setWaking(true), 3000);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { phone, password } : { phone, name, password, country };
      const data = await api(path, { method: "POST", body });
      onAuthed({ token: data.token, name: data.user.name, phone: data.user.phone, isAdmin: data.user.isAdmin });
    } catch (e) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      clearTimeout(wakeTimer);
      setWaking(false);
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center px-6">
      <div className="flex items-center gap-2.5 mb-8 justify-center">
        <VortexMark size={32} />
        <span className="text-[#F6F2E9] font-semibold tracking-wide text-lg">VORTEX</span>
      </div>

      <div className="flex bg-white/[0.04] rounded-xl p-1 mb-5">
        <button onClick={() => setMode("login")} className={`flex-1 text-sm font-medium rounded-lg py-2 ${mode === "login" ? "bg-[#D6A337] text-[#0F1626]" : "text-[#F6F2E9]/50"}`}>Connexion</button>
        <button onClick={() => setMode("register")} className={`flex-1 text-sm font-medium rounded-lg py-2 ${mode === "register" ? "bg-[#D6A337] text-[#0F1626]" : "text-[#F6F2E9]/50"}`}>Inscription</button>
      </div>

      <div className="space-y-3">
        {mode === "register" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
        )}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (ex: +221771234567)"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
        {mode === "register" && (
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F6F2E9] outline-none">
            <option value="SN" className="bg-[#182238]">Sénégal</option>
            <option value="CI" className="bg-[#182238]">Côte d'Ivoire</option>
            <option value="CM" className="bg-[#182238]">Cameroun</option>
            <option value="ML" className="bg-[#182238]">Mali</option>
            <option value="BF" className="bg-[#182238]">Burkina Faso</option>
            <option value="TG" className="bg-[#182238]">Togo</option>
          </select>
        )}
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
      </div>

      {error && (
        <p className="text-[#E0654A] text-xs mt-3 flex items-start gap-1.5"><AlertTriangle size={13} className="shrink-0 mt-0.5" /> {error}</p>
      )}
      {waking && (
        <p className="text-[#D6A337] text-xs mt-3">Le serveur se réveille (mode gratuit) — jusqu'à 50 secondes la première fois...</p>
      )}

      <button
        onClick={submit}
        disabled={loading || !phone || !password || (mode === "register" && !name)}
        className="w-full bg-[#D6A337] disabled:opacity-30 text-[#0F1626] font-semibold rounded-xl py-3 mt-5 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === "login" ? "Se connecter" : "Créer mon compte")}
      </button>

      <p className="text-[#F6F2E9]/30 text-[11px] text-center mt-6">
        Connecté à ton vrai backend VORTEX — les données sont enregistrées dans ta base PostgreSQL.
      </p>
    </div>
  );
}

// ---------- Content viewers (Academy / Library) — progression stockée localement ----------

function AcademyViewer({ product, progress, onToggleLesson, onClose }) {
  const lessons = product.lessons || [];
  const done = progress?.completedLessons || [];
  const pct = lessons.length ? Math.round((done.length / lessons.length) * 100) : 0;
  return (
    <div className="absolute inset-0 z-40 bg-[#0F1626] flex flex-col">
      <ScreenHeader title={product.title} subtitle="VORTEX Academy" onBack={onClose} />
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[#F6F2E9]/50 text-xs">{done.length} / {lessons.length} leçons terminées</span>
          <span className="text-[#D6A337] text-xs font-semibold">{pct}%</span>
        </div>
        <ProgressBar pct={pct} color="#D6A337" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-6">
        {lessons.map((l, i) => {
          const isDone = done.includes(l.id);
          return (
            <button key={l.id} onClick={() => onToggleLesson(l.id)} className="w-full flex items-center gap-3 bg-[#182238] border border-white/5 rounded-xl p-3.5 text-left active:scale-[0.99] transition-transform">
              <div className="w-8 h-8 rounded-full bg-[#D6A337]/10 flex items-center justify-center text-[#D6A337] text-xs font-semibold shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F6F2E9] text-sm font-medium truncate">{l.title}</p>
                <p className="text-[#F6F2E9]/40 text-xs flex items-center gap-1 mt-0.5"><PlayCircle size={11} /> {l.duration}</p>
              </div>
              {isDone ? <CheckCircle2 size={20} className="text-[#2E9E83] shrink-0" /> : <Circle size={20} className="text-[#F6F2E9]/20 shrink-0" />}
            </button>
          );
        })}
        {pct === 100 && lessons.length > 0 && (
          <div className="mt-4 bg-[#2E9E83]/10 border border-[#2E9E83]/30 rounded-xl p-4 text-center">
            <p className="text-[#2E9E83] text-sm font-semibold">🎓 Formation terminée — certificat débloqué</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryViewer({ product, progress, onSetPage, onClose }) {
  const totalPages = product.totalPages || 60;
  const currentPage = progress?.currentPage || 1;
  const pct = Math.round((currentPage / totalPages) * 100);
  const turn = (delta) => onSetPage(Math.min(totalPages, Math.max(1, currentPage + delta)));
  return (
    <div className="absolute inset-0 z-40 bg-[#0F1626] flex flex-col">
      <ScreenHeader title={product.title} subtitle="VORTEX Library" onBack={onClose} />
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[#F6F2E9]/50 text-xs">Page {currentPage} / {totalPages}</span>
          <span className="text-[#2E9E83] text-xs font-semibold">{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        <div className="bg-[#182238] border border-white/5 rounded-2xl p-5">
          <p className="text-[#F6F2E9]/40 text-[10px] uppercase tracking-wider mb-2">Page {currentPage}</p>
          <p className="text-[#F6F2E9]/80 text-sm leading-relaxed">{product.description}</p>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center gap-3 border-t border-white/5">
        <button onClick={() => turn(-1)} disabled={currentPage <= 1} className="flex-1 bg-white/10 disabled:opacity-30 text-[#F6F2E9] rounded-xl py-3 flex items-center justify-center gap-1 text-sm font-medium">
          <ChevronLeft size={16} /> Précédente
        </button>
        <button onClick={() => turn(1)} disabled={currentPage >= totalPages} className="flex-1 bg-[#D6A337] disabled:opacity-30 text-[#0F1626] rounded-xl py-3 flex items-center justify-center gap-1 text-sm font-semibold">
          Suivante <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------- VORTEX AI ----------

// Recommandation gratuite par mots-clés — aucune API payante requise.
// Le vrai relais IA (src/services/ai.service.js côté backend) reste prêt
// à être rebranché plus tard, une fois des crédits API disponibles.
function matchProducts(query, products) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const scored = products
    .map((p) => {
      const text = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      const score = words.reduce((s, w) => (text.includes(w) ? s + 1 : s), 0);
      return { product: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.product);
}

function localReply(query, products) {
  const matches = matchProducts(query, products);
  if (matches.length === 0) {
    return "Je n'ai pas trouvé de contenu correspondant précisément à ta question dans le catalogue actuel. Jette un œil au Market — tu y trouveras des formations, ebooks et outils classés par catégorie (Library, Academy, Market).";
  }
  const lines = matches.map((p) => `• "${p.title}" (${CATEGORY_LABEL[p.category] || p.category}) — ${fmt(p.priceXof)}`);
  return `Voici ce que je te recommande dans le catalogue :\n\n${lines.join("\n")}\n\nTu peux les retrouver dans l'onglet Market.`;
}

function AIAssistant({ onClose, products }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Salut ! Je suis VORTEX AI 👋 Dis-moi ce que tu cherches (ex: \"un livre pour débuter en trading\") et je te recommande un contenu du catalogue." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400)); // petit délai pour que ça ne semble pas instantané/robotique
    setMessages((m) => [...m, { role: "assistant", content: localReply(text, products) }]);
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0F1626] flex flex-col">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={onClose} className="text-[#F6F2E9]/70"><ArrowLeft size={20} /></button>
        <div className="w-8 h-8 rounded-full bg-[#D6A337]/15 flex items-center justify-center text-[#D6A337]"><Sparkles size={16} /></div>
        <div><h1 className="text-[#F6F2E9] text-base font-semibold">VORTEX AI</h1><p className="text-[#F6F2E9]/40 text-xs">Ton assistant VORTEX</p></div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#D6A337] text-[#0F1626]" : "bg-[#182238] text-[#F6F2E9]/90 border border-white/5"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-[#182238] border border-white/5 rounded-2xl px-3.5 py-2.5"><Loader2 size={16} className="text-[#D6A337] animate-spin" /></div></div>}
      </div>
      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Pose ta question à VORTEX AI…"
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
        <button onClick={send} disabled={loading || !input.trim()} className="w-10 h-10 rounded-xl bg-[#D6A337] disabled:opacity-30 flex items-center justify-center shrink-0">
          <Send size={16} className="text-[#0F1626]" />
        </button>
      </div>
    </div>
  );
}

// ---------- Screens ----------

function HomeScreen({ balance, name, goTo, recent, syncing }) {
  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <VortexMark size={26} spinning={syncing} />
          <span className="text-[#F6F2E9] font-semibold tracking-wide text-sm">VORTEX</span>
        </div>
        <button onClick={() => goTo("profile")} className="w-8 h-8 rounded-full bg-[#D6A337]/20 border border-[#D6A337]/40 flex items-center justify-center text-[#D6A337] text-xs font-semibold">
          {name.slice(0, 1).toUpperCase()}
        </button>
      </div>
      <div className="px-5 mt-3">
        <p className="text-[#F6F2E9]/50 text-sm">Bonjour {name} 👋</p>
        <h2 className="text-[#F6F2E9] text-2xl font-semibold mt-0.5">Prêt(e) à apprendre et vendre ?</h2>
      </div>
      <button onClick={() => goTo("wallet")} className="mx-5 mt-5 w-[calc(100%-2.5rem)] relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#182238] to-[#101828] border border-white/5 p-5 text-left group">
        <div className="absolute -right-6 -top-6 opacity-[0.12]"><VortexMark size={140} /></div>
        <p className="text-[#F6F2E9]/50 text-xs uppercase tracking-wider">Solde VORTEX Wallet</p>
        <p className="text-[#F6F2E9] text-3xl font-semibold mt-1.5 tabular-nums">{fmt(balance)}</p>
        <div className="mt-4 flex items-center gap-1 text-[#D6A337] text-xs font-medium">Gérer mon portefeuille <ChevronRight size={14} /></div>
      </button>
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <button onClick={() => goTo("wallet", "deposit")} className="rounded-2xl bg-[#182238] border border-white/5 p-4 text-left active:scale-[0.98] transition-transform">
          <ArrowDownLeft size={18} className="text-[#2E9E83]" /><p className="text-[#F6F2E9] text-sm font-medium mt-2">Déposer</p><p className="text-[#F6F2E9]/40 text-xs">via Mobile Money</p>
        </button>
        <button onClick={() => goTo("market")} className="rounded-2xl bg-[#182238] border border-white/5 p-4 text-left active:scale-[0.98] transition-transform">
          <ShoppingBag size={18} className="text-[#D6A337]" /><p className="text-[#F6F2E9] text-sm font-medium mt-2">Explorer</p><p className="text-[#F6F2E9]/40 text-xs">le Market</p>
        </button>
      </div>
      <div className="px-5 mt-6 flex items-center justify-between">
        <h3 className="text-[#F6F2E9] text-sm font-semibold">Activité récente</h3>
        <button onClick={() => goTo("wallet")} className="text-[#D6A337] text-xs">Tout voir</button>
      </div>
      <div className="px-5 mt-2 space-y-2">
        {recent.length === 0 && <p className="text-[#F6F2E9]/40 text-sm py-4">Aucune activité pour l'instant.</p>}
        {recent.slice(0, 3).map((t) => <TransactionRow key={t.id} t={t} />)}
      </div>
    </div>
  );
}

const TX_LABEL = { DEPOSIT: "Dépôt", WITHDRAWAL: "Retrait", PURCHASE: "Achat", REFUND: "Remboursement" };

function TransactionRow({ t }) {
  const isIn = t.type === "DEPOSIT" || t.type === "REFUND";
  const label = `${TX_LABEL[t.type] || t.type}${t.provider ? ` · ${t.provider}` : ""}`;
  const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
  return (
    <div className="flex items-center gap-3 bg-[#182238] rounded-xl px-3.5 py-3 border border-white/5">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isIn ? "bg-[#2E9E83]/15 text-[#2E9E83]" : "bg-[#E0654A]/15 text-[#E0654A]"}`}>
        {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F6F2E9] text-sm font-medium truncate">{label}</p>
        <p className="text-[#F6F2E9]/40 text-xs">{date} {t.status !== "SUCCESS" && `· ${t.status}`}</p>
      </div>
      <p className={`text-sm font-semibold tabular-nums ${isIn ? "text-[#2E9E83]" : "text-[#E0654A]"}`}>{isIn ? "+" : "-"}{fmt(t.amount)}</p>
    </div>
  );
}

function WalletScreen({ balance, transactions, onBack, openDeposit, openWithdraw, autoOpen, loadingTx }) {
  useEffect(() => { if (autoOpen === "deposit") openDeposit(); }, []); // eslint-disable-line
  return (
    <div className="pb-4">
      <ScreenHeader title="VORTEX Wallet" subtitle="Votre portefeuille numérique" onBack={onBack} />
      <div className="mx-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#182238] to-[#101828] border border-white/5 p-6">
        <div className="absolute -right-8 -bottom-10 opacity-[0.1]"><VortexMark size={160} /></div>
        <p className="text-[#F6F2E9]/50 text-xs uppercase tracking-wider">Solde disponible</p>
        <p className="text-[#F6F2E9] text-4xl font-semibold mt-2 tabular-nums">{fmt(balance)}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={openDeposit} className="flex-1 bg-[#D6A337] text-[#0F1626] text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"><Plus size={16} /> Déposer</button>
          <button onClick={openWithdraw} className="flex-1 bg-white/10 text-[#F6F2E9] text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"><ArrowUpRight size={16} /> Retirer</button>
        </div>
      </div>
      <div className="px-5 mt-6">
        <h3 className="text-[#F6F2E9] text-sm font-semibold mb-2">Historique</h3>
        <div className="space-y-2">
          {loadingTx && <Loader2 size={18} className="text-[#D6A337] animate-spin mx-auto my-4" />}
          {!loadingTx && transactions.length === 0 && <p className="text-[#F6F2E9]/40 text-sm py-4">Aucune transaction encore.</p>}
          {transactions.map((t) => <TransactionRow key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

function MoneyModal({ mode, phone, onClose, onConfirm }) {
  const [step, setStep] = useState("form");
  const [provider, setProvider] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const isDeposit = mode === "deposit";

  const submit = async () => {
    if (!provider || !amount || Number(amount) <= 0) return;
    setStep("processing");
    setError("");
    try {
      await onConfirm(Number(amount), provider.id);
      setStep("done");
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e.message || "Échec de l'opération");
      setStep("form");
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={step === "form" ? onClose : undefined} />
      <div className="relative w-full bg-[#182238] rounded-t-3xl border-t border-white/10 px-5 pt-4 pb-8 max-h-[85%] overflow-y-auto">
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
        {step === "form" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#F6F2E9] font-semibold text-base">{isDeposit ? "Déposer via Mobile Money" : "Retirer vers Mobile Money"}</h3>
              <button onClick={onClose}><X size={18} className="text-[#F6F2E9]/50" /></button>
            </div>
            <p className="text-[#F6F2E9]/50 text-xs mb-2">Choisir un opérateur</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PROVIDERS.map((p) => (
                <button key={p.id} onClick={() => setProvider(p)} className={`rounded-xl p-3 border text-left transition-colors ${provider?.id === p.id ? "border-[#D6A337] bg-[#D6A337]/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-[#F6F2E9] text-sm">{p.name}</span></div>
                </button>
              ))}
            </div>
            <p className="text-[#F6F2E9]/50 text-xs mb-2">Montant (FCFA) — numéro {phone}</p>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 mb-1">
              <Smartphone size={16} className="text-[#F6F2E9]/40" />
              <input type="number" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent outline-none text-[#F6F2E9] text-base w-full placeholder:text-[#F6F2E9]/30" />
            </div>
            <div className="flex gap-2 mb-3">
              {[2000, 5000, 10000, 25000].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))} className="text-xs text-[#D6A337] bg-[#D6A337]/10 rounded-full px-3 py-1">{fmt(v)}</button>
              ))}
            </div>
            {error && <p className="text-[#E0654A] text-xs mb-3">{error}</p>}
            <button onClick={submit} disabled={!provider || !amount} className="w-full bg-[#D6A337] disabled:opacity-30 text-[#0F1626] font-semibold rounded-xl py-3 active:scale-[0.98] transition-transform">
              {isDeposit ? "Confirmer le dépôt" : "Confirmer le retrait"}
            </button>
          </>
        )}
        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[#D6A337] animate-spin" />
            <p className="text-[#F6F2E9]/70 text-sm">Enregistrement dans ta base VORTEX…</p>
          </div>
        )}
        {step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#2E9E83]/15 flex items-center justify-center"><Check size={26} className="text-[#2E9E83]" strokeWidth={3} /></div>
            <p className="text-[#F6F2E9] text-sm font-medium">{isDeposit ? "Dépôt réussi" : "Retrait réussi"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketScreen({ onBack, balance, token, onBuy, purchasedIds, products, loadingProducts, onOpenContent, onOpenShop }) {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const cats = ["Tous", "Library", "Academy", "Market"];
  const list = products.filter((p) => (filter === "Tous" || CATEGORY_LABEL[p.category] === filter) && p.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="pb-4">
      <ScreenHeader title="VORTEX Market" subtitle="Formations, ebooks & outils" onBack={onBack} />
      <div className="px-5">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} className="text-[#F6F2E9]/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un contenu…"
            className="bg-transparent outline-none text-[#F6F2E9] text-sm w-full placeholder:text-[#F6F2E9]/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`shrink-0 text-xs font-medium rounded-full px-3.5 py-1.5 border ${filter === c ? "bg-[#D6A337] text-[#0F1626] border-[#D6A337]" : "text-[#F6F2E9]/60 border-white/10"}`}>{c}</button>
          ))}
        </div>
      </div>

      {loadingProducts && <Loader2 size={20} className="text-[#D6A337] animate-spin mx-auto my-8" />}

      <div className="px-5 space-y-3 mt-1">
        {!loadingProducts && list.map((p) => {
          const Icon = CATEGORY_ICON[p.category] || FileText;
          const owned = purchasedIds.includes(p.id);
          return (
            <button key={p.id} onClick={() => setSelected(p)} className="w-full flex items-center gap-3 bg-[#182238] border border-white/5 rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-[#D6A337]/10 flex items-center justify-center shrink-0 text-[#D6A337]"><Icon size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F6F2E9] text-sm font-medium truncate">{p.title}</p>
                <p className="text-[#F6F2E9]/40 text-xs truncate">{p.description}</p>
              </div>
              {owned ? <span className="text-[#2E9E83] text-xs font-semibold shrink-0">Acquis</span> : <span className="text-[#F6F2E9] text-sm font-semibold shrink-0 tabular-nums">{fmt(p.priceXof)}</span>}
            </button>
          );
        })}
        {!loadingProducts && list.length === 0 && <p className="text-[#F6F2E9]/40 text-sm py-8 text-center">Aucun résultat.</p>}
      </div>

      {selected && (
        <ProductSheet product={selected} owned={purchasedIds.includes(selected.id)} balance={balance} token={token}
          onClose={() => setSelected(null)}
          onBuy={async () => { await onBuy(selected); setSelected(null); }}
          onOpen={() => { onOpenContent(selected); setSelected(null); }}
          onOpenShop={(creatorId) => { onOpenShop(creatorId); setSelected(null); }} />
      )}
    </div>
  );
}

function ProductSheet({ product, owned, balance, token, onClose, onBuy, onOpen, onOpenShop }) {
  const Icon = CATEGORY_ICON[product.category] || FileText;
  const canAfford = balance >= product.priceXof;
  const consumable = product.category === "ACADEMY" || product.category === "LIBRARY";
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewState, setReviewState] = useState("idle"); // idle | sending | done | error
  const [reviewError, setReviewError] = useState("");

  const handleBuy = async () => {
    setBuying(true); setError("");
    try { await onBuy(); } catch (e) { setError(e.message || "Échec de l'achat"); setBuying(false); }
  };

  const submitReview = async () => {
    if (!rating) return;
    setReviewState("sending"); setReviewError("");
    try {
      await api(`/market/products/${product.id}/reviews`, { method: "POST", token, body: { rating, comment } });
      setReviewState("done");
    } catch (e) {
      setReviewError(e.message || "Échec de l'envoi");
      setReviewState("error");
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full bg-[#182238] rounded-t-3xl border-t border-white/10 px-5 pt-4 pb-8 max-h-[90%] overflow-y-auto">
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
        <div className="flex items-start gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-[#D6A337]/10 flex items-center justify-center text-[#D6A337] shrink-0"><Icon size={24} /></div>
          <div className="flex-1"><p className="text-[#F6F2E9] font-semibold leading-snug">{product.title}</p><p className="text-[#F6F2E9]/40 text-xs mt-0.5">{CATEGORY_LABEL[product.category]}</p></div>
          <button onClick={onClose}><X size={18} className="text-[#F6F2E9]/50" /></button>
        </div>
        <button onClick={() => onOpenShop(product.creatorId)} className="text-[#D6A337] text-xs mb-4">Voir la boutique du créateur →</button>
        <p className="text-[#F6F2E9]/60 text-sm leading-relaxed mb-5">{product.description}</p>
        {error && <p className="text-[#E0654A] text-xs mb-3">{error}</p>}
        {owned ? (
          <>
            {consumable ? (
              <>
                <button onClick={onOpen} className="w-full bg-[#2E9E83] text-[#0F1626] font-semibold rounded-xl py-3 text-center text-sm active:scale-[0.98] transition-transform">
                  {product.category === "ACADEMY" ? "Continuer la formation" : "Continuer la lecture"}
                </button>
                {product.category === "LIBRARY" && product.fileUrl && (
                  <a href={product.fileUrl} target="_blank" rel="noreferrer" className="w-full mt-2 bg-white/10 text-[#F6F2E9] font-medium rounded-xl py-2.5 text-center text-sm flex items-center justify-center gap-2">
                    <Download size={15} /> Télécharger le PDF
                  </a>
                )}
              </>
            ) : (
              <a href={product.fileUrl || undefined} target="_blank" rel="noreferrer" className={`w-full text-[#0F1626] font-semibold rounded-xl py-3 text-center text-sm flex items-center justify-center gap-2 ${product.fileUrl ? "bg-[#2E9E83]" : "bg-white/10 text-[#F6F2E9]/40 pointer-events-none"}`}>
                <Download size={16} /> {product.fileUrl ? "Télécharger" : "Fichier bientôt disponible"}
              </a>
            )}

            <div className="mt-5 pt-5 border-t border-white/5">
              {reviewState === "done" ? (
                <p className="text-[#2E9E83] text-sm text-center">Merci pour ton avis ! 🙏</p>
              ) : (
                <>
                  <p className="text-[#F6F2E9]/50 text-xs mb-2">Laisser un avis</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)}>
                        <Star size={22} className={n <= rating ? "text-[#D6A337] fill-[#D6A337]" : "text-[#F6F2E9]/20"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire (optionnel)"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30 mb-2" rows={2} />
                  {reviewError && <p className="text-[#E0654A] text-xs mb-2">{reviewError}</p>}
                  <button onClick={submitReview} disabled={!rating || reviewState === "sending"} className="w-full bg-white/10 disabled:opacity-30 text-[#F6F2E9] text-sm font-medium rounded-xl py-2.5 flex items-center justify-center gap-2">
                    {reviewState === "sending" ? <Loader2 size={14} className="animate-spin" /> : "Envoyer l'avis"}
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3"><span className="text-[#F6F2E9]/50 text-sm">Prix</span><span className="text-[#F6F2E9] text-xl font-semibold tabular-nums">{fmt(product.priceXof)}</span></div>
            <button onClick={handleBuy} disabled={!canAfford || buying} className="w-full bg-[#D6A337] disabled:opacity-30 text-[#0F1626] font-semibold rounded-xl py-3 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              {buying ? <Loader2 size={16} className="animate-spin" /> : (canAfford ? "Payer avec mon Wallet" : "Solde insuffisant")}
            </button>
            {!canAfford && !buying && <p className="text-[#E0654A] text-xs text-center mt-2">Rechargez votre Wallet pour continuer</p>}
          </>
        )}
      </div>
    </div>
  );
}

function CommunityScreen({ onBack, followed, liked, onToggleFollow, onToggleLike }) {
  return (
    <div className="pb-4">
      <ScreenHeader title="VORTEX Community" subtitle="Suis tes créateurs préférés" onBack={onBack} />
      <div className="px-5 mb-4">
        <p className="text-[#F6F2E9]/50 text-xs mb-2">Créateurs à suivre</p>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {CREATORS.map((c) => {
            const isFollowed = followed.includes(c.id);
            return (
              <div key={c.id} className="shrink-0 w-32 bg-[#182238] border border-white/5 rounded-2xl p-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold mb-2" style={{ background: `${c.color}30`, color: c.color }}>{c.name.split(" ").map((w) => w[0]).join("")}</div>
                <p className="text-[#F6F2E9] text-xs font-medium truncate">{c.name}</p>
                <p className="text-[#F6F2E9]/40 text-[10px] truncate mb-2">{c.bio}</p>
                <button onClick={() => onToggleFollow(c.id)} className={`w-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-lg py-1.5 ${isFollowed ? "bg-white/10 text-[#F6F2E9]/60" : "bg-[#D6A337] text-[#0F1626]"}`}>
                  {isFollowed ? <><UserCheck size={11} /> Suivi</> : <><UserPlus size={11} /> Suivre</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-5">
        <p className="text-[#F6F2E9]/50 text-xs mb-2">Fil d'actualité</p>
        <div className="space-y-3">
          {POSTS.map((post) => {
            const creator = CREATORS.find((c) => c.id === post.creatorId);
            const isLiked = liked.includes(post.id);
            return (
              <div key={post.id} className="bg-[#182238] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: `${creator.color}30`, color: creator.color }}>{creator.name.split(" ").map((w) => w[0]).join("")}</div>
                  <div className="flex-1 min-w-0"><p className="text-[#F6F2E9] text-sm font-medium truncate">{creator.name}</p><p className="text-[#F6F2E9]/35 text-[11px]">{post.date}</p></div>
                  <span className="text-[10px] font-medium text-[#D6A337] bg-[#D6A337]/10 rounded-full px-2 py-0.5 shrink-0">{post.tag}</span>
                </div>
                <p className="text-[#F6F2E9]/80 text-sm leading-relaxed mb-3">{post.content}</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => onToggleLike(post.id)} className="flex items-center gap-1.5"><Heart size={16} className={isLiked ? "text-[#E0654A] fill-[#E0654A]" : "text-[#F6F2E9]/40"} /><span className={`text-xs ${isLiked ? "text-[#E0654A]" : "text-[#F6F2E9]/40"}`}>{post.likes + (isLiked ? 1 : 0)}</span></button>
                  <div className="flex items-center gap-1.5"><MessageCircle size={16} className="text-[#F6F2E9]/40" /><span className="text-xs text-[#F6F2E9]/40">{post.comments}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CreatorShopScreen({ creatorId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api(`/creators/${creatorId}`);
        setData(res);
      } catch (e) {
        setError(e.message || "Impossible de charger cette boutique");
      } finally {
        setLoading(false);
      }
    })();
  }, [creatorId]);

  return (
    <div className="absolute inset-0 z-40 bg-[#0F1626] flex flex-col">
      <ScreenHeader title="Boutique" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading && <Loader2 size={20} className="text-[#D6A337] animate-spin mx-auto my-10" />}
        {error && <p className="text-[#E0654A] text-sm text-center py-8">{error}</p>}
        {data && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#D6A337]/20 border border-[#D6A337]/40 flex items-center justify-center text-[#D6A337] text-xl font-semibold shrink-0 overflow-hidden">
                {data.creator.logoUrl ? <img src={data.creator.logoUrl} alt="" className="w-full h-full object-cover" /> : data.creator.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[#F6F2E9] font-semibold truncate">{data.creator.name}</p>
                {data.creator.bio && <p className="text-[#F6F2E9]/50 text-xs mt-0.5">{data.creator.bio}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-[#182238] rounded-xl p-3 text-center border border-white/5">
                <p className="text-[#F6F2E9] text-lg font-semibold">{data.stats.productCount}</p>
                <p className="text-[#F6F2E9]/40 text-[10px]">Contenus</p>
              </div>
              <div className="bg-[#182238] rounded-xl p-3 text-center border border-white/5">
                <p className="text-[#F6F2E9] text-lg font-semibold">{data.stats.totalSales}</p>
                <p className="text-[#F6F2E9]/40 text-[10px]">Ventes</p>
              </div>
              <div className="bg-[#182238] rounded-xl p-3 text-center border border-white/5">
                <p className="text-[#F6F2E9] text-lg font-semibold flex items-center justify-center gap-1">
                  {data.stats.avgRating ?? "—"} {data.stats.avgRating && <Star size={12} className="text-[#D6A337] fill-[#D6A337]" />}
                </p>
                <p className="text-[#F6F2E9]/40 text-[10px]">{data.stats.reviewCount} avis</p>
              </div>
            </div>

            <p className="text-[#F6F2E9]/50 text-xs mb-2">Contenus de cette boutique</p>
            <div className="space-y-2">
              {data.products.map((p) => {
                const Icon = CATEGORY_ICON[p.category] || FileText;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-[#182238] border border-white/5 rounded-2xl p-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#D6A337]/10 flex items-center justify-center shrink-0 text-[#D6A337]"><Icon size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F6F2E9] text-sm font-medium truncate">{p.title}</p>
                      <p className="text-[#F6F2E9]/40 text-xs truncate">{p.description}</p>
                    </div>
                    <span className="text-[#F6F2E9] text-sm font-semibold shrink-0 tabular-nums">{fmt(p.priceXof)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[#F6F2E9]/25 text-[11px] text-center mt-5">Retourne au Market pour acheter un de ces contenus.</p>
          </>
        )}
      </div>
    </div>
  );
}

function AdminScreen({ token, onBack, onProductCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("LIBRARY");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(""); setSaving(true);
    try {
      await api("/admin/products", {
        method: "POST",
        token,
        body: { title, description, priceXof: Number(price), category, fileUrl: fileUrl || null },
      });
      setDone(true);
      setTitle(""); setDescription(""); setPrice(""); setFileUrl("");
      onProductCreated?.();
      setTimeout(() => setDone(false), 2000);
    } catch (e) {
      setError(e.message || "Échec de la création");
    } finally {
      setSaving(false);
    }
  };

  const valid = title && description && price && category;

  return (
    <div className="pb-8">
      <ScreenHeader title="Ajouter un produit" subtitle="Panneau administrateur" onBack={onBack} />
      <div className="px-5 space-y-3">
        <div>
          <p className="text-[#F6F2E9]/50 text-xs mb-1.5">Titre</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Guide Forex Débutant"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
        </div>
        <div>
          <p className="text-[#F6F2E9]/50 text-xs mb-1.5">Description</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Décris le contenu..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
        </div>
        <div>
          <p className="text-[#F6F2E9]/50 text-xs mb-1.5">Catégorie</p>
          <div className="flex gap-2">
            {["LIBRARY", "ACADEMY", "MARKET"].map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`flex-1 text-xs font-medium rounded-lg py-2 border ${category === c ? "bg-[#D6A337] text-[#0F1626] border-[#D6A337]" : "text-[#F6F2E9]/60 border-white/10"}`}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[#F6F2E9]/50 text-xs mb-1.5">Prix (FCFA)</p>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" inputMode="numeric" placeholder="5000"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
        </div>
        <div>
          <p className="text-[#F6F2E9]/50 text-xs mb-1.5">Lien du fichier (optionnel)</p>
          <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F6F2E9] outline-none placeholder:text-[#F6F2E9]/30" />
          <p className="text-[#F6F2E9]/30 text-[11px] mt-1">Uploade le PDF sur ton dépôt GitHub `vortex-files`, colle ici le lien "raw" du fichier.</p>
        </div>

        {error && <p className="text-[#E0654A] text-xs">{error}</p>}
        {done && <p className="text-[#2E9E83] text-xs">Produit créé avec succès ✓</p>}

        <button onClick={submit} disabled={!valid || saving} className="w-full bg-[#D6A337] disabled:opacity-30 text-[#0F1626] font-semibold rounded-xl py-3 flex items-center justify-center gap-2 mt-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Ajouter au catalogue"}
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ name, phone, balance, purchases, progress, isAdmin, onBack, onOpenContent, onLogout, onOpenAdmin }) {
  return (
    <div className="pb-4">
      <ScreenHeader title="Profil" onBack={onBack} />
      <div className="px-5 flex items-center gap-3 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#D6A337]/20 border border-[#D6A337]/40 flex items-center justify-center text-[#D6A337] text-xl font-semibold">{name.slice(0, 1).toUpperCase()}</div>
        <div><p className="text-[#F6F2E9] font-semibold">{name}</p><p className="text-[#F6F2E9]/40 text-xs">{phone}</p></div>
      </div>
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#182238] rounded-2xl p-4 border border-white/5"><p className="text-[#F6F2E9]/40 text-xs">Solde Wallet</p><p className="text-[#F6F2E9] text-lg font-semibold mt-1 tabular-nums">{fmt(balance)}</p></div>
        <div className="bg-[#182238] rounded-2xl p-4 border border-white/5"><p className="text-[#F6F2E9]/40 text-xs">Contenus acquis</p><p className="text-[#F6F2E9] text-lg font-semibold mt-1">{purchases.length}</p></div>
      </div>
      <div className="px-5 mb-6">
        <h3 className="text-[#F6F2E9] text-sm font-semibold mb-2">Ma bibliothèque</h3>
        <div className="space-y-2">
          {purchases.length === 0 && <p className="text-[#F6F2E9]/40 text-sm py-4">Rien acheté pour l'instant — direction le Market !</p>}
          {purchases.map(({ product }) => {
            const Icon = CATEGORY_ICON[product.category] || FileText;
            const consumable = product.category === "ACADEMY" || product.category === "LIBRARY";
            const prog = progress[product.id];
            let pct = null;
            if (product.category === "ACADEMY") pct = Math.round(((prog?.completedLessons?.length || 0) / (product.lessons?.length || 1)) * 100);
            if (product.category === "LIBRARY") pct = Math.round(((prog?.currentPage || 1) / (product.totalPages || 60)) * 100);
            return (
              <button key={product.id} onClick={() => consumable && onOpenContent(product)} className="w-full flex items-center gap-3 bg-[#182238] rounded-xl px-3.5 py-3 border border-white/5 text-left">
                <div className="w-9 h-9 rounded-lg bg-[#D6A337]/10 flex items-center justify-center text-[#D6A337] shrink-0"><Icon size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F6F2E9] text-sm truncate">{product.title}</p>
                  {pct !== null && <div className="mt-1.5 flex items-center gap-2"><div className="flex-1"><ProgressBar pct={pct} color={product.category === "ACADEMY" ? "#D6A337" : "#2E9E83"} /></div><span className="text-[#F6F2E9]/40 text-[10px] shrink-0">{pct}%</span></div>}
                </div>
                {consumable && <ChevronRight size={16} className="text-[#F6F2E9]/30 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-5">
        {isAdmin && (
          <button onClick={onOpenAdmin} className="w-full flex items-center justify-center gap-2 bg-[#D6A337]/10 text-[#D6A337] text-sm font-medium rounded-xl py-3 mb-3">
            <Sparkles size={14} /> Panneau administrateur
          </button>
        )}
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-[#E0654A]/80 text-xs py-3"><LogOut size={13} /> Se déconnecter</button>
      </div>
    </div>
  );
}

function BottomNav({ screen, goTo }) {
  const items = [
    { id: "home", label: "Accueil", icon: Home },
    { id: "wallet", label: "Wallet", icon: WalletIcon },
    { id: "market", label: "Market", icon: ShoppingBag },
    { id: "community", label: "Communauté", icon: Users },
    { id: "profile", label: "Profil", icon: User },
  ];
  return (
    <div className="border-t border-white/5 bg-[#101828] px-2 pt-2 pb-3 flex justify-around">
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.id;
        return (
          <button key={it.id} onClick={() => goTo(it.id)} className="flex flex-col items-center gap-1 px-3 py-1">
            <Icon size={20} className={active ? "text-[#D6A337]" : "text-[#F6F2E9]/35"} strokeWidth={active ? 2.4 : 2} />
            <span className={`text-[10px] ${active ? "text-[#D6A337] font-medium" : "text-[#F6F2E9]/35"}`}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Root ----------

export default function VortexApp() {
  const [booting, setBooting] = useState(true);
  const [auth, setAuth] = useState(null); // { token, name, phone }
  const [screen, setScreen] = useState("home");
  const [autoOpen, setAutoOpen] = useState(null);
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewingShop, setViewingShop] = useState(null); // creatorId
  const [adminOpen, setAdminOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [local, setLocal] = useState({ progress: {}, community: { followed: ["c4"], liked: [] } });
  const [syncing, setSyncing] = useState(false);

  const showToast = (message, tone) => { setToast({ message, tone }); setTimeout(() => setToast(null), 2500); };

  // Boot: charger le token sauvegardé + les données locales (progression/communauté)
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_KEY);
      if (savedAuth) setAuth(JSON.parse(savedAuth));
    } catch (e) { /* pas de session sauvegardée */ }
    try {
      const savedLocal = localStorage.getItem(LOCAL_KEY);
      if (savedLocal) setLocal(JSON.parse(savedLocal));
    } catch (e) { /* rien de sauvegardé encore */ }
    setBooting(false);
  }, []);

  const persistLocal = (next) => {
    setLocal(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch (e) { /* silencieux */ }
  };

  const handleAuthed = (data) => {
    setAuth(data);
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(data)); } catch (e) { /* silencieux */ }
  };

  const handleLogout = () => {
    setAuth(null);
    try { localStorage.removeItem(AUTH_KEY); } catch (e) { /* déjà absent */ }
  };

  // Charger produits (public) dès que possible
  const refreshProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await api("/market/products");
      setProducts(data);
    } catch (e) {
      showToast("Impossible de charger le catalogue — le serveur se réveille peut-être", "coral");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => { refreshProducts(); }, []); // eslint-disable-line

  // Charger wallet + achats une fois connecté
  const refreshWallet = async () => {
    if (!auth) return;
    try {
      const bal = await api("/wallet/balance", { token: auth.token });
      setBalance(bal.balance);
    } catch (e) { /* géré silencieusement, on garde le dernier solde connu */ }
  };

  const refreshTransactions = async () => {
    if (!auth) return;
    setLoadingTx(true);
    try {
      const tx = await api("/wallet/transactions", { token: auth.token });
      setTransactions(tx);
    } catch (e) { /* silencieux */ }
    setLoadingTx(false);
  };

  const refreshPurchases = async () => {
    if (!auth) return;
    try {
      const p = await api("/market/me/purchases", { token: auth.token });
      setPurchases(p);
    } catch (e) { /* silencieux */ }
  };

  useEffect(() => {
    if (!auth) return;
    setSyncing(true);
    Promise.all([refreshWallet(), refreshTransactions(), refreshPurchases()]).finally(() => setSyncing(false));
  }, [auth]); // eslint-disable-line

  const goTo = (s, sub) => { setScreen(s); setAutoOpen(sub || null); };

  const handleMoneyConfirm = async (amount, providerId) => {
    const path = modal === "deposit" ? "/wallet/deposit" : "/wallet/withdraw";
    await api(path, { method: "POST", token: auth.token, body: { amount, provider: providerId, phone: auth.phone } });
    await Promise.all([refreshWallet(), refreshTransactions()]);
    showToast(modal === "deposit" ? "Dépôt effectué" : "Retrait effectué", "teal");
  };

  const handleBuy = async (product) => {
    await api(`/market/products/${product.id}/purchase`, { method: "POST", token: auth.token });
    await Promise.all([refreshWallet(), refreshPurchases()]);
    showToast("Achat réussi — disponible dans Profil", "teal");
  };

  const handleToggleLesson = (productId, lessonId) => {
    const existing = local.progress[productId]?.completedLessons || [];
    const next = existing.includes(lessonId) ? existing.filter((l) => l !== lessonId) : [...existing, lessonId];
    persistLocal({ ...local, progress: { ...local.progress, [productId]: { completedLessons: next } } });
  };

  const handleSetPage = (productId, page) => {
    persistLocal({ ...local, progress: { ...local.progress, [productId]: { currentPage: page } } });
  };

  const handleToggleFollow = (creatorId) => {
    const followed = local.community.followed.includes(creatorId) ? local.community.followed.filter((c) => c !== creatorId) : [...local.community.followed, creatorId];
    persistLocal({ ...local, community: { ...local.community, followed } });
  };

  const handleToggleLike = (postId) => {
    const liked = local.community.liked.includes(postId) ? local.community.liked.filter((p) => p !== postId) : [...local.community.liked, postId];
    persistLocal({ ...local, community: { ...local.community, liked } });
  };

  const purchasedIds = purchases.map((p) => p.productId);

  if (booting) {
    return (
      <div className="w-full min-h-screen bg-[#0B1120] flex items-center justify-center">
        <VortexMark size={40} spinning />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0B1120] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="relative w-full max-w-[380px] h-[780px] bg-[#0F1626] rounded-[2.5rem] border-8 border-[#1B1F2E] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-6 shrink-0 flex items-center justify-center relative"><div className="w-24 h-4 bg-[#1B1F2E] rounded-b-2xl absolute top-0" /></div>

        <div className="flex-1 overflow-y-auto relative">
          {toast && <Toast message={toast.message} tone={toast.tone} />}

          {!auth && <AuthScreen onAuthed={handleAuthed} />}

          {auth && (
            <>
              {screen === "home" && <HomeScreen balance={balance} name={auth.name} goTo={goTo} recent={transactions} syncing={syncing} />}
              {screen === "wallet" && (
                <WalletScreen balance={balance} transactions={transactions} onBack={() => goTo("home")}
                  openDeposit={() => setModal("deposit")} openWithdraw={() => setModal("withdraw")} autoOpen={autoOpen} loadingTx={loadingTx} />
              )}
              {screen === "market" && (
                <MarketScreen onBack={() => goTo("home")} balance={balance} token={auth.token} onBuy={handleBuy} purchasedIds={purchasedIds}
                  products={products} loadingProducts={loadingProducts} onOpenContent={setViewing} onOpenShop={setViewingShop} />
              )}
              {screen === "community" && (
                <CommunityScreen onBack={() => goTo("home")} followed={local.community.followed} liked={local.community.liked}
                  onToggleFollow={handleToggleFollow} onToggleLike={handleToggleLike} />
              )}
              {screen === "profile" && (
                <ProfileScreen name={auth.name} phone={auth.phone} balance={balance} purchases={purchases} progress={local.progress}
                  isAdmin={auth.isAdmin} onBack={() => goTo("home")} onOpenContent={setViewing} onLogout={handleLogout} onOpenAdmin={() => setAdminOpen(true)} />
              )}

              {modal && <MoneyModal mode={modal} phone={auth.phone} onClose={() => setModal(null)} onConfirm={handleMoneyConfirm} />}

              {viewing && viewing.category === "ACADEMY" && (
                <AcademyViewer product={viewing} progress={local.progress[viewing.id]} onToggleLesson={(lid) => handleToggleLesson(viewing.id, lid)} onClose={() => setViewing(null)} />
              )}
              {viewing && viewing.category === "LIBRARY" && (
                <LibraryViewer product={viewing} progress={local.progress[viewing.id]} onSetPage={(pg) => handleSetPage(viewing.id, pg)} onClose={() => setViewing(null)} />
              )}

              {viewingShop && <CreatorShopScreen creatorId={viewingShop} onClose={() => setViewingShop(null)} />}

              {adminOpen && <AdminScreen token={auth.token} onBack={() => setAdminOpen(false)} onProductCreated={refreshProducts} />}

              {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} products={products} />}

              {!modal && !viewing && !viewingShop && !adminOpen && !aiOpen && (
                <button onClick={() => setAiOpen(true)} className="absolute right-4 bottom-4 rounded-full bg-[#D6A337] shadow-lg flex items-center justify-center active:scale-95 transition-transform" style={{ width: 52, height: 52 }} aria-label="Ouvrir VORTEX AI">
                  <Sparkles size={22} className="text-[#0F1626]" />
                </button>
              )}
            </>
          )}
        </div>

        {auth && <BottomNav screen={screen} goTo={goTo} />}
      </div>
    </div>
  );
}
