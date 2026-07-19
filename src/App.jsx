import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import {
  Home, Wallet as WalletIcon, ShoppingBag, User, ArrowDownLeft, ArrowUpRight,
  Plus, X, Check, ChevronRight, BookOpen, GraduationCap, FileText,
  Smartphone, Loader2, ArrowLeft, Search, Star, RotateCcw, PlayCircle,
  CheckCircle2, Circle, ChevronLeft, Download, Sparkles, Send, Users,
  Heart, MessageCircle, UserPlus, UserCheck, LogOut, AlertTriangle, Award
} from "lucide-react";

// ---------- Config ----------
const API_BASE = "https://vortex-backenda.onrender.com";
const AUTH_KEY = "vortex-auth-v1";
const LOCAL_KEY = "vortex-local-v1";
const LANG_KEY = "vortex-lang-v1";
const CURRENCY_KEY = "vortex-currency-v1";

const fmt = (n) => n.toLocaleString("fr-FR").replace(/,/g, " ") + " F";

const CURRENCIES = {
  XOF: { label: "Franc CFA (XOF)", symbol: "F", rate: 1, decimals: 0 },
  XAF: { label: "Franc CFA (XAF)", symbol: "F", rate: 1, decimals: 0 },
  NGN: { label: "Naira nigérian", symbol: "₦", rate: 2.42, decimals: 0 },
  GHS: { label: "Cedi ghanéen", symbol: "GH₵", rate: 0.0091, decimals: 0 },
  USD: { label: "Dollar US", symbol: "$", rate: 0.0016, decimals: 2 },
};

function fmtCur(amountXof, currency = "XOF") {
  const c = CURRENCIES[currency] || CURRENCIES.XOF;
  const converted = amountXof * c.rate;
  const rounded = c.decimals === 0 ? Math.round(converted) : Math.round(converted * 100) / 100;
  const numStr = rounded.toLocaleString("fr-FR", { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals }).replace(/,/g, " ");
  return currency === "USD" ? `${c.symbol}${numStr}` : `${numStr} ${c.symbol}`;
}

const TRANSLATIONS = {
  fr: {
    nav_home: "Accueil", nav_wallet: "Wallet", nav_market: "Market", nav_community: "Communauté", nav_profile: "Profil",
    auth_login: "Connexion", auth_register: "Inscription", auth_name: "Nom complet", auth_phone: "Téléphone (ex: +221771234567)",
    auth_password: "Mot de passe", auth_login_btn: "Se connecter", auth_register_btn: "Créer mon compte",
    home_greeting: "Bonjour", home_tagline: "Prêt(e) à apprendre et vendre ?", home_balance: "Solde VORTEX Wallet",
    home_manage: "Gérer mon portefeuille", home_deposit: "Déposer", home_via_mm: "via Mobile Money", home_explore: "Explorer", home_market: "le Market",
    home_recent: "Activité récente", home_seeall: "Tout voir",
    wallet_title: "VORTEX Wallet", wallet_subtitle: "Votre portefeuille numérique", wallet_available: "Solde disponible",
    wallet_deposit: "Déposer", wallet_withdraw: "Retirer", wallet_history: "Historique",
    market_title: "VORTEX Market", market_subtitle: "Formations, ebooks & outils", market_search: "Rechercher un contenu…",
    profile_title: "Profil", profile_library: "Ma bibliothèque", profile_logout: "Se déconnecter", profile_admin: "Panneau administrateur",
    profile_settings: "Langue & devise",
  },
  en: {
    nav_home: "Home", nav_wallet: "Wallet", nav_market: "Market", nav_community: "Community", nav_profile: "Profile",
    auth_login: "Log in", auth_register: "Sign up", auth_name: "Full name", auth_phone: "Phone (e.g. +221771234567)",
    auth_password: "Password", auth_login_btn: "Log in", auth_register_btn: "Create my account",
    home_greeting: "Hello", home_tagline: "Ready to learn and sell?", home_balance: "VORTEX Wallet balance",
    home_manage: "Manage my wallet", home_deposit: "Deposit", home_via_mm: "via Mobile Money", home_explore: "Explore", home_market: "the Market",
    home_recent: "Recent activity", home_seeall: "See all",
    wallet_title: "VORTEX Wallet", wallet_subtitle: "Your digital wallet", wallet_available: "Available balance",
    wallet_deposit: "Deposit", wallet_withdraw: "Withdraw", wallet_history: "History",
    market_title: "VORTEX Market", market_subtitle: "Courses, ebooks & tools", market_search: "Search for content…",
    profile_title: "Profile", profile_library: "My library", profile_logout: "Log out", profile_admin: "Admin panel",
    profile_settings: "Language & currency",
  },
};

function useT(lang) {
  return (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.fr[key] || key;
}

// ---------- Upload de fichiers (Cloudinary, gratuit) ----------
const CLOUDINARY_CLOUD_NAME = "ijdj0tvy";
const CLOUDINARY_UPLOAD_PRESET = "vortex_products";

async function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data.secure_url);
        else reject(new Error(data.error?.message || "Échec de l'upload"));
      } catch (e) {
        reject(new Error("Réponse d'upload invalide"));
      }
    };
    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload"));
    xhr.send(formData);
  });
}

const CATEGORY_ICON = { ACADEMY: GraduationCap, LIBRARY: BookOpen, MARKET: FileText };
const CATEGORY_LABEL = { ACADEMY: "Academy", LIBRARY: "Library", MARKET: "Market" };

const PROVIDERS = [
  { id: "ORANGE", name: "Orange Money", color: "#FF6600" },
  { id: "MTN", name: "MTN MoMo", color: "#FFCC00" },
  { id: "WAVE", name: "Wave", color: "#1DC8E8" },
  { id: "MOOV", name: "Moov Money", color: "#0072BC" },
];

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { }
  if (!res.ok) {
    const message = data?.error?.formErrors?.[0] || data?.error || `Erreur ${res.status}`;
    throw new Error(typeof message === "string" ? message : "Erreur serveur");
  }
  return data;
}

function vibrate(pattern = 15) {
  try { navigator.vibrate?.(pattern); } catch (e) { }
}

let sharedAudioCtx = null;
function playChime(kind = "success") {
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sharedAudioCtx;
    const notes = kind === "success" ? [660, 880] : [440];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      const start = ctx.currentTime + i * 0.09;
      gain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) { }
}

const LEVELS = [
  { min: 0, label: "Débutant", color: "#8B8B9A" },
  { min: 11, label: "Confirmé", color: "#2E9E83" },
  { min: 101, label: "Expert", color: "#6C2BD9" },
  { min: 1001, label: "Élite", color: "#D4AF37" },
];
function levelFor(sales) {
  return [...LEVELS].reverse().find((l) => sales >= l.min) || LEVELS[0];
}

function ParticleField({ count = 14 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      left: `${Math.round((i * 137.5) % 100)}%`,
      delay: `${(i % count) * (7 / count)}s`,
      duration: `${6 + (i % 5)}s`,
    }))
  ).current;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <span key={i} className="vortex-particle" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }} />
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 bg-[#1C1626] border border-white/5 rounded-2xl p-3.5">
      <div className="w-12 h-12 rounded-xl vortex-skeleton shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-3/4 rounded vortex-skeleton" />
        <div className="h-2.5 w-1/2 rounded vortex-skeleton" />
      </div>
    </div>
  );
}

function VortexMark({ size = 28, spinning = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={spinning ? "motion-safe:animate-[spin_6s_linear_infinite]" : ""}>
      <path d="M20 4 C11 4 4 11 4 20" stroke="#6C2BD9" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 8 C14 8 8 14 8 20" stroke="#6C2BD9" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <path d="M36 20 C36 29 29 36 20 36" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 20 C32 26 26 32 20 32" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <circle cx="20" cy="20" r="3" fill="#F2EEFB" />
    </svg>
  );
}

function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} aria-label="Retour" className="text-[#F2EEFB]/70 hover:text-[#F2EEFB]">
          <ArrowLeft size={20} />
        </button>
      )}
      <div>
        <h1 className="text-[#F2EEFB] text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[#F2EEFB]/50 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Toast({ message, tone = "teal" }) {
  const bg = tone === "teal" ? "bg-[#2E9E83]" : "bg-[#E0654A]";
  return (
    <div className={`fixed left-1/2 -translate-x-1/2 top-6 z-50 ${bg} text-[#0B0714] text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 max-w-[85%] text-center`}>
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

function AuthScreen({ onAuthed, lang, setLang }) {
  const t = useT(lang);
  const [mode, setMode] = useState("login");
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
    <div className="h-full flex flex-col justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30 vortex-blob-1" style={{ background: "radial-gradient(circle, #6C2BD9, transparent 70%)" }} />
        <div className="absolute -bottom-28 -right-14 w-80 h-80 rounded-full blur-3xl opacity-25 vortex-blob-2" style={{ background: "radial-gradient(circle, #D4AF37, transparent 70%)" }} />
      </div>
      <ParticleField count={16} />
      <button onClick={() => setLang(lang === "fr" ? "en" : "fr")} className="absolute top-4 right-4 z-10 text-[#F2EEFB]/50 text-xs border border-white/10 rounded-full px-3 py-1">
        {lang === "fr" ? "EN" : "FR"}
      </button>
      <div className="relative z-10 flex items-center gap-2.5 mb-8 justify-center">
        <div className="vortex-float"><VortexMark size={36} spinning /></div>
        <span className="premium-text font-bold tracking-widest text-lg">VORTEX</span>
      </div>

      <div className="relative z-10 flex bg-white/[0.04] rounded-xl p-1 mb-5">
        <button onClick={() => setMode("login")} className={`flex-1 text-sm font-medium rounded-lg py-2 ${mode === "login" ? "bg-[#6C2BD9] text-white" : "text-[#F2EEFB]/50"}`}>{t("auth_login")}</button>
        <button onClick={() => setMode("register")} className={`flex-1 text-sm font-medium rounded-lg py-2 ${mode === "register" ? "bg-[#6C2BD9] text-white" : "text-[#F2EEFB]/50"}`}>{t("auth_register")}</button>
      </div>

      <div className="space-y-3">
        {mode === "register" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth_name")}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
        )}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("auth_phone")}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
        {mode === "register" && (
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F2EEFB] outline-none">
            <option value="SN" className="bg-[#1C1626]">Sénégal</option>
            <option value="CI" className="bg-[#1C1626]">Côte d'Ivoire</option>
            <option value="CM" className="bg-[#1C1626]">Cameroun</option>
            <option value="ML" className="bg-[#1C1626]">Mali</option>
            <option value="BF" className="bg-[#1C1626]">Burkina Faso</option>
            <option value="TG" className="bg-[#1C1626]">Togo</option>
            <option value="NG" className="bg-[#1C1626]">Nigeria</option>
            <option value="GH" className="bg-[#1C1626]">Ghana</option>
          </select>
        )}
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={t("auth_password")}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
      </div>

      {error && (
        <p className="text-[#E0654A] text-xs mt-3 flex items-start gap-1.5"><AlertTriangle size={13} className="shrink-0 mt-0.5" /> {error}</p>
      )}
      {waking && (
        <p className="text-[#6C2BD9] text-xs mt-3">Le serveur se réveille (mode gratuit) — jusqu'à 50 secondes la première fois...</p>
      )}

      <button
        onClick={submit}
        disabled={loading || !phone || !password || (mode === "register" && !name)}
        className="w-full bg-[#6C2BD9] disabled:opacity-30 text-white font-semibold rounded-xl py-3 mt-5 premium-glow flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === "login" ? t("auth_login_btn") : t("auth_register_btn"))}
      </button>

      <p className="text-[#F2EEFB]/30 text-[11px] text-center mt-6">
        Connecté à ton vrai backend VORTEX — les données sont enregistrées dans ta base PostgreSQL.
      </p>
    </div>
  );
}

function AcademyViewer({ product, progress, onToggleLesson, onClose }) {
  const lessons = product.lessons || [];
  const done = progress?.completedLessons || [];
  const pct = lessons.length ? Math.round((done.length / lessons.length) * 100) : 0;
  return (
    <div className="absolute inset-0 z-40 bg-[#0B0714] flex flex-col">
      <ScreenHeader title={product.title} subtitle="VORTEX Academy" onBack={onClose} />
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[#F2EEFB]/50 text-xs">{done.length} / {lessons.length} leçons terminées</span>
          <span className="text-[#6C2BD9] text-xs font-semibold">{pct}%</span>
        </div>
        <ProgressBar pct={pct} color="#6C2BD9" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-6">
        {lessons.map((l, i) => {
          const isDone = done.includes(l.id);
          return (
            <button key={l.id} onClick={() => onToggleLesson(l.id)} className="w-full flex items-center gap-3 bg-[#1C1626] border border-white/5 rounded-xl p-3.5 text-left active:scale-[0.99] transition-transform">
              <div className="w-8 h-8 rounded-full bg-[#6C2BD9]/10 flex items-center justify-center text-[#6C2BD9] text-xs font-semibold shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F2EEFB] text-sm font-medium truncate">{l.title}</p>
                <p className="text-[#F2EEFB]/40 text-xs flex items-center gap-1 mt-0.5"><PlayCircle size={11} /> {l.duration}</p>
              </div>
              {isDone ? <CheckCircle2 size={20} className="text-[#2E9E83] shrink-0" /> : <Circle size={20} className="text-[#F2EEFB]/20 shrink-0" />}
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
    <div className="absolute inset-0 z-40 bg-[#0B0714] flex flex-col">
      <ScreenHeader title={product.title} subtitle="VORTEX Library" onBack={onClose} />
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[#F2EEFB]/50 text-xs">Page {currentPage} / {totalPages}</span>
          <span className="text-[#2E9E83] text-xs font-semibold">{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        <div className="bg-[#1C1626] border border-white/5 rounded-2xl p-5">
          <p className="text-[#F2EEFB]/40 text-[10px] uppercase tracking-wider mb-2">Page {currentPage}</p>
          <p className="text-[#F2EEFB]/80 text-sm leading-relaxed">{product.description}</p>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center gap-3 border-t border-white/5">
        <button onClick={() => turn(-1)} disabled={currentPage <= 1} className="flex-1 bg-white/10 disabled:opacity-30 text-[#F2EEFB] rounded-xl py-3 flex items-center justify-center gap-1 text-sm font-medium">
          <ChevronLeft size={16} /> Précédente
        </button>
        <button onClick={() => turn(1)} disabled={currentPage >= totalPages} className="flex-1 bg-[#6C2BD9] disabled:opacity-30 text-white rounded-xl py-3 flex items-center justify-center gap-1 text-sm font-semibold">
          Suivante <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

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
    await new Promise((r) => setTimeout(r, 400));
    setMessages((m) => [...m, { role: "assistant", content: localReply(text, products) }]);
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0B0714] flex flex-col">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={onClose} className="text-[#F2EEFB]/70"><ArrowLeft size={20} /></button>
        <div className="w-8 h-8 rounded-full bg-[#6C2BD9]/15 flex items-center justify-center text-[#6C2BD9]"><Sparkles size={16} /></div>
        <div><h1 className="text-[#F2EEFB] text-base font-semibold">VORTEX AI</h1><p className="text-[#F2EEFB]/40 text-xs">Ton assistant VORTEX</p></div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#6C2BD9] text-white" : "bg-[#1C1626] text-[#F2EEFB]/90 border border-white/5"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-[#1C1626] border border-white/5 rounded-2xl px-3.5 py-2.5"><Loader2 size={16} className="text-[#6C2BD9] animate-spin" /></div></div>}
      </div>
      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Pose ta question à VORTEX AI…"
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
        <button onClick={send} disabled={loading || !input.trim()} className="w-10 h-10 rounded-xl bg-[#6C2BD9] disabled:opacity-30 flex items-center justify-center shrink-0">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ balance, name, goTo, recent, syncing, t, currency }) {
  return (
    <div className="pb-4 relative">
      <ParticleField count={8} />
      <div className="px-5 pt-6 pb-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <VortexMark size={26} spinning={syncing} />
          <span className="premium-text font-bold tracking-widest text-sm">VORTEX</span>
        </div>
        <button onClick={() => goTo("profile")} className="w-8 h-8 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 flex items-center justify-center text-[#6C2BD9] text-xs font-semibold">
          {name.slice(0, 1).toUpperCase()}
        </button>
      </div>
      <div className="px-5 mt-3">
        <p className="text-[#F2EEFB]/50 text-sm">{t("home_greeting")} {name} 👋</p>
        <h2 className="text-[#F2EEFB] text-2xl font-semibold mt-0.5">{t("home_tagline")}</h2>
      </div>
      <button onClick={() => goTo("wallet")} className="mx-5 mt-5 w-[calc(100%-2.5rem)] relative overflow-hidden rounded-3xl vortex-glass premium-glow p-5 text-left group">
        <div className="absolute -right-6 -top-6 opacity-[0.12]"><VortexMark size={140} /></div>
        <p className="text-[#F2EEFB]/50 text-xs uppercase tracking-wider">{t("home_balance")}</p>
        <p className="premium-text text-3xl font-bold mt-1.5 tabular-nums">{fmtCur(balance, currency)}</p>
        <div className="mt-4 flex items-center gap-1 text-[#6C2BD9] text-xs font-medium">{t("home_manage")} <ChevronRight size={14} /></div>
      </button>
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <button onClick={() => goTo("wallet", "deposit")} className="rounded-2xl bg-[#1C1626] border border-white/5 p-4 text-left active:scale-[0.98] transition-transform">
          <ArrowDownLeft size={18} className="text-[#2E9E83]" /><p className="text-[#F2EEFB] text-sm font-medium mt-2">{t("home_deposit")}</p><p className="text-[#F2EEFB]/40 text-xs">{t("home_via_mm")}</p>
        </button>
        <button onClick={() => goTo("market")} className="rounded-2xl bg-[#1C1626] border border-white/5 p-4 text-left active:scale-[0.98] transition-transform">
          <ShoppingBag size={18} className="text-[#6C2BD9]" /><p className="text-[#F2EEFB] text-sm font-medium mt-2">{t("home_explore")}</p><p className="text-[#F2EEFB]/40 text-xs">{t("home_market")}</p>
        </button>
      </div>
      <div className="px-5 mt-6 flex items-center justify-between">
        <h3 className="text-[#F2EEFB] text-sm font-semibold">{t("home_recent")}</h3>
        <button onClick={() => goTo("wallet")} className="text-[#6C2BD9] text-xs">{t("home_seeall")}</button>
      </div>
      <div className="px-5 mt-2 space-y-2">
        {recent.length === 0 && <p className="text-[#F2EEFB]/40 text-sm py-4">Aucune activité pour l'instant.</p>}
        {recent.slice(0, 3).map((tx) => <TransactionRow key={tx.id} t={tx} currency={currency} />)}
      </div>
    </div>
  );
}

const TX_LABEL = { DEPOSIT: "Dépôt", WITHDRAWAL: "Retrait", PURCHASE: "Achat", REFUND: "Remboursement", EARNING: "Revenu" };

function TransactionRow({ t, currency = "XOF" }) {
  const isIn = t.type === "DEPOSIT" || t.type === "REFUND";
  const label = `${TX_LABEL[t.type] || t.type}${t.provider ? ` · ${t.provider}` : ""}`;
  const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
  return (
    <div className="flex items-center gap-3 bg-[#1C1626] rounded-xl px-3.5 py-3 border border-white/5">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isIn ? "bg-[#2E9E83]/15 text-[#2E9E83]" : "bg-[#E0654A]/15 text-[#E0654A]"}`}>
        {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F2EEFB] text-sm font-medium truncate">{label}</p>
        <p className="text-[#F2EEFB]/40 text-xs">{date} {t.status !== "SUCCESS" && `· ${t.status}`}</p>
      </div>
      <p className={`text-sm font-semibold tabular-nums ${isIn ? "text-[#2E9E83]" : "text-[#E0654A]"}`}>{isIn ? "+" : "-"}{fmtCur(t.amount, currency)}</p>
    </div>
  );
}

function VortexCard3D({ children }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleMove = (clientX, clientY) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width - 0.5;
    const py = (clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="mx-5 relative overflow-hidden rounded-3xl vortex-glass premium-glow vortex-card-3d p-6"
      style={{ transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
    >
      {children}
    </motion.div>
  );
}

function WalletScreen({ balance, transactions, onBack, openDeposit, openWithdraw, autoOpen, loadingTx, t, currency }) {
  useEffect(() => { if (autoOpen === "deposit") openDeposit(); }, []);
  const chartData = [...transactions].reverse().reduce((acc, tx) => {
    const prev = acc.length ? acc[acc.length - 1].v : 0;
    const delta = (tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "EARNING") ? tx.amount : -tx.amount;
    acc.push({ v: Math.max(0, prev + delta) });
    return acc;
  }, []);
  return (
    <div className="pb-4">
      <ScreenHeader title={t("wallet_title")} subtitle={t("wallet_subtitle")} onBack={onBack} />
      <VortexCard3D>
        <div className="absolute -right-8 -bottom-10 opacity-[0.1]"><VortexMark size={160} /></div>
        <div className="flex items-center justify-between mb-1">
          <p className="premium-text font-bold tracking-widest text-xs">VORTEX PREMIUM</p>
          <div className="w-7 h-5 rounded bg-gradient-to-br from-[#D4AF37] to-[#6C2BD9] opacity-80" />
        </div>
        <p className="text-[#F2EEFB]/30 text-[11px] tracking-widest mb-3">•••• •••• •••• VRTX</p>
        <p className="text-[#F2EEFB]/50 text-xs uppercase tracking-wider">{t("wallet_available")}</p>
        <p className="premium-text text-4xl font-bold mt-2 tabular-nums">{fmtCur(balance, currency)}</p>
        {chartData.length > 1 && (
          <div className="h-10 -mx-1 mt-2 opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={2} dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={openDeposit} className="flex-1 bg-[#6C2BD9] text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform premium-glow"><Plus size={16} /> {t("wallet_deposit")}</button>
          <button onClick={openWithdraw} className="flex-1 bg-white/10 text-[#F2EEFB] text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"><ArrowUpRight size={16} /> {t("wallet_withdraw")}</button>
        </div>
        <p className="text-[#F2EEFB]/20 text-[10px] text-center mt-4">Carte virtuelle décorative — aperçu de ton solde, pas un moyen de paiement réel.</p>
      </VortexCard3D>
      <div className="px-5 mt-6">
        <h3 className="text-[#F2EEFB] text-sm font-semibold mb-2">{t("wallet_history")}</h3>
        <div className="space-y-2">
          {loadingTx && <div className="space-y-2">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}
          {!loadingTx && transactions.length === 0 && <p className="text-[#F2EEFB]/40 text-sm py-4">Aucune transaction encore.</p>}
          {transactions.map((tx) => <TransactionRow key={tx.id} t={tx} currency={currency} />)}
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
      <div className="relative w-full bg-[#1C1626] rounded-t-3xl border-t border-white/10 px-5 pt-4 pb-8 max-h-[85%] overflow-y-auto">
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
        {step === "form" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#F2EEFB] font-semibold text-base">{isDeposit ? "Déposer via Mobile Money" : "Retirer vers Mobile Money"}</h3>
              <button onClick={onClose}><X size={18} className="text-[#F2EEFB]/50" /></button>
            </div>
            <p className="text-[#F2EEFB]/50 text-xs mb-2">Choisir un opérateur</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PROVIDERS.map((p) => (
                <button key={p.id} onClick={() => setProvider(p)} className={`rounded-xl p-3 border text-left transition-colors ${provider?.id === p.id ? "border-[#6C2BD9] bg-[#6C2BD9]/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-[#F2EEFB] text-sm">{p.name}</span></div>
                </button>
              ))}
            </div>
            <p className="text-[#F2EEFB]/50 text-xs mb-2">Montant (FCFA) — numéro {phone}</p>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 mb-1">
              <Smartphone size={16} className="text-[#F2EEFB]/40" />
              <input type="number" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent outline-none text-[#F2EEFB] text-base w-full placeholder:text-[#F2EEFB]/30" />
            </div>
            <div className="flex gap-2 mb-3">
              {[2000, 5000, 10000, 25000].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))} className="text-xs text-[#6C2BD9] bg-[#6C2BD9]/10 rounded-full px-3 py-1">{fmt(v)}</button>
              ))}
            </div>
            {error && <p className="text-[#E0654A] text-xs mb-3">{error}</p>}
            <button onClick={submit} disabled={!provider || !amount} className="w-full bg-[#6C2BD9] disabled:opacity-30 text-white font-semibold rounded-xl py-3 premium-glow active:scale-[0.98] transition-transform">
              {isDeposit ? "Confirmer le dépôt" : "Confirmer le retrait"}
            </button>
          </>
        )}
        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[#6C2BD9] animate-spin" />
            <p className="text-[#F2EEFB]/70 text-sm">Enregistrement dans ta base VORTEX…</p>
          </div>
        )}
        {step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#2E9E83]/15 flex items-center justify-center"><Check size={26} className="text-[#2E9E83]" strokeWidth={3} /></div>
            <p className="text-[#F2EEFB] text-sm font-medium">{isDeposit ? "Dépôt réussi" : "Retrait réussi"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketScreen({ onBack, balance, token, onBuy, purchasedIds, products, loadingProducts, onOpenContent, onOpenShop, t, currency }) {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const cats = ["Tous", "Library", "Academy", "Market"];
  const list = products.filter((p) => (filter === "Tous" || CATEGORY_LABEL[p.category] === filter) && p.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="pb-4">
      <ScreenHeader title={t("market_title")} subtitle={t("market_subtitle")} onBack={onBack} />
      <div className="px-5">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} className="text-[#F2EEFB]/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("market_search")}
            className="bg-transparent outline-none text-[#F2EEFB] text-sm w-full placeholder:text-[#F2EEFB]/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`shrink-0 text-xs font-medium rounded-full px-3.5 py-1.5 border ${filter === c ? "bg-[#6C2BD9] text-white border-[#6C2BD9]" : "text-[#F2EEFB]/60 border-white/10"}`}>{c}</button>
          ))}
        </div>
      </div>

      {loadingProducts && <div className="px-5 space-y-3 mt-1">{[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}</div>}

      <div className="px-5 space-y-3 mt-1">
        {!loadingProducts && list.map((p) => {
          const Icon = CATEGORY_ICON[p.category] || FileText;
          const owned = purchasedIds.includes(p.id);
          return (
            <button key={p.id} onClick={() => setSelected(p)} className="w-full flex items-center gap-3 bg-[#1C1626] border border-white/5 rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-[#6C2BD9]/10 flex items-center justify-center shrink-0 text-[#6C2BD9]"><Icon size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F2EEFB] text-sm font-medium truncate">{p.title}</p>
                <p className="text-[#F2EEFB]/40 text-xs truncate">{p.description}</p>
              </div>
              {owned ? <span className="text-[#2E9E83] text-xs font-semibold shrink-0">Acquis</span> : <span className="text-[#F2EEFB] text-sm font-semibold shrink-0 tabular-nums">{fmtCur(p.priceXof, currency)}</span>}
            </button>
          );
        })}
        {!loadingProducts && list.length === 0 && <p className="text-[#F2EEFB]/40 text-sm py-8 text-center">Aucun résultat.</p>}
      </div>

      {selected && (
        <ProductSheet product={selected} owned={purchasedIds.includes(selected.id)} balance={balance} token={token} currency={currency}
          onClose={() => setSelected(null)}
          onBuy={async () => { await onBuy(selected); setSelected(null); }}
          onOpen={() => { onOpenContent(selected); setSelected(null); }}
          onOpenShop={(creatorId) => { onOpenShop(creatorId); setSelected(null); }} />
      )}
    </div>
  );
}

function ProductSheet({ product, owned, balance, token, currency = "XOF", onClose, onBuy, onOpen, onOpenShop }) {
  const Icon = CATEGORY_ICON[product.category] || FileText;
  const canAfford = balance >= product.priceXof;
  const consumable = product.category === "ACADEMY" || product.category === "LIBRARY";
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewState, setReviewState] = useState("idle");
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
      <div className="relative w-full bg-[#1C1626] rounded-t-3xl border-t border-white/10 px-5 pt-4 pb-8 max-h-[90%] overflow-y-auto">
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
        <div className="flex items-start gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-[#6C2BD9]/10 flex items-center justify-center text-[#6C2BD9] shrink-0"><Icon size={24} /></div>
          <div className="flex-1"><p className="text-[#F2EEFB] font-semibold leading-snug">{product.title}</p><p className="text-[#F2EEFB]/40 text-xs mt-0.5">{CATEGORY_LABEL[product.category]}</p></div>
          <button onClick={onClose}><X size={18} className="text-[#F2EEFB]/50" /></button>
        </div>
        <button onClick={() => onOpenShop(product.creatorId)} className="text-[#6C2BD9] text-xs mb-4">Voir la boutique du créateur →</button>
        <p className="text-[#F2EEFB]/60 text-sm leading-relaxed mb-5">{product.description}</p>
        {error && <p className="text-[#E0654A] text-xs mb-3">{error}</p>}
        {owned ? (
          <>
            {consumable ? (
              <>
                <button onClick={onOpen} className="w-full bg-[#2E9E83] text-[#0B0714] font-semibold rounded-xl py-3 text-center text-sm active:scale-[0.98] transition-transform">
                  {product.category === "ACADEMY" ? "Continuer la formation" : "Continuer la lecture"}
                </button>
                {product.category === "LIBRARY" && product.fileUrl && (
                  <a href={product.fileUrl} target="_blank" rel="noreferrer" className="w-full mt-2 bg-white/10 text-[#F2EEFB] font-medium rounded-xl py-2.5 text-center text-sm flex items-center justify-center gap-2">
                    <Download size={15} /> Télécharger le PDF
                  </a>
                )}
              </>
            ) : (
              <a href={product.fileUrl || undefined} target="_blank" rel="noreferrer" className={`w-full text-[#0B0714] font-semibold rounded-xl py-3 text-center text-sm flex items-center justify-center gap-2 ${product.fileUrl ? "bg-[#2E9E83]" : "bg-white/10 text-[#F2EEFB]/40 pointer-events-none"}`}>
                <Download size={16} /> {product.fileUrl ? "Télécharger" : "Fichier bientôt disponible"}
              </a>
            )}

            <div className="mt-5 pt-5 border-t border-white/5">
              {reviewState === "done" ? (
                <p className="text-[#2E9E83] text-sm text-center">Merci pour ton avis ! 🙏</p>
              ) : (
                <>
                  <p className="text-[#F2EEFB]/50 text-xs mb-2">Laisser un avis</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)}>
                        <Star size={22} className={n <= rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#F2EEFB]/20"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire (optionnel)"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30 mb-2" rows={2} />
                  {reviewError && <p className="text-[#E0654A] text-xs mb-2">{reviewError}</p>}
                  <button onClick={submitReview} disabled={!rating || reviewState === "sending"} className="w-full bg-white/10 disabled:opacity-30 text-[#F2EEFB] text-sm font-medium rounded-xl py-2.5 flex items-center justify-center gap-2">
                    {reviewState === "sending" ? <Loader2 size={14} className="animate-spin" /> : "Envoyer l'avis"}
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3"><span className="text-[#F2EEFB]/50 text-sm">Prix</span><span className="text-[#F2EEFB] text-xl font-semibold tabular-nums">{fmtCur(product.priceXof, currency)}</span></div>
            <button onClick={handleBuy} disabled={!canAfford || buying} className="w-full bg-[#6C2BD9] disabled:opacity-30 text-white font-semibold rounded-xl py-3 premium-glow active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              {buying ? <Loader2 size={16} className="animate-spin" /> : (canAfford ? "Payer avec mon Wallet" : "Solde insuffisant")}
            </button>
            {!canAfford && !buying && <p className="text-[#E0654A] text-xs text-center mt-2">Rechargez votre Wallet pour continuer</p>}
          </>
        )}
      </div>
    </div>
  );
}

function CommunityScreen({ token, onBack, onOpenShop }) {
  const [creators, setCreators] = useState([]);
  const [feed, setFeed] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [creatorsData, feedData] = await Promise.all([api("/community/creators"), api("/community/feed")]);
        setCreators(creatorsData);
        setFeed(feedData);
        const statuses = await Promise.all(
          creatorsData.map((c) => api(`/creators/${c.id}/follow-status`, { token }).catch(() => ({ following: false })))
        );
        const map = {};
        creatorsData.forEach((c, i) => { map[c.id] = statuses[i].following; });
        setFollowStatus(map);
      } catch (e) { }
      setLoading(false);
    })();
  }, []);

  const toggleFollow = async (creatorId) => {
    try {
      const res = await api(`/creators/${creatorId}/follow`, { method: "POST", token });
      setFollowStatus((s) => ({ ...s, [creatorId]: res.following }));
      setCreators((cs) => cs.map((c) => (c.id === creatorId ? { ...c, followerCount: c.followerCount + (res.following ? 1 : -1) } : c)));
    } catch (e) { }
  };

  return (
    <div className="pb-4">
      <ScreenHeader title="VORTEX Community" subtitle="Les vrais créateurs de VORTEX" onBack={onBack} />

      {loading && <Loader2 size={20} className="text-[#6C2BD9] animate-spin mx-auto my-10" />}

      {!loading && (
        <>
          <div className="px-5 mb-4">
            <p className="text-[#F2EEFB]/50 text-xs mb-2">Créateurs à suivre</p>
            {creators.length === 0 && <p className="text-[#F2EEFB]/40 text-sm py-2">Aucun créateur pour l'instant — les vendeurs apparaîtront ici dès qu'ils publient un contenu.</p>}
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {creators.map((c) => {
                const isFollowed = !!followStatus[c.id];
                return (
                  <div key={c.id} className="shrink-0 w-32 bg-[#1C1626] premium-border rounded-2xl p-3">
                    <button onClick={() => onOpenShop(c.id)} className="w-9 h-9 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 flex items-center justify-center text-xs font-semibold mb-2 text-[#6C2BD9] overflow-hidden">
                      {c.logoUrl ? <img src={c.logoUrl} alt="" className="w-full h-full object-cover" /> : c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </button>
                    <button onClick={() => onOpenShop(c.id)} className="text-left w-full">
                      <p className="text-[#F2EEFB] text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[#F2EEFB]/40 text-[10px] truncate mb-2">{c.productCount} contenu{c.productCount > 1 ? "s" : ""} · {c.followerCount} abonné{c.followerCount > 1 ? "s" : ""}</p>
                    </button>
                    <button onClick={() => toggleFollow(c.id)} className={`w-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-lg py-1.5 ${isFollowed ? "bg-white/10 text-[#F2EEFB]/60" : "bg-[#6C2BD9] text-white"}`}>
                      {isFollowed ? <><UserCheck size={11} /> Suivi</> : <><UserPlus size={11} /> Suivre</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5">
            <p className="text-[#F2EEFB]/50 text-xs mb-2">Fil d'actualité</p>
            <div className="space-y-3">
              {feed.length === 0 && <p className="text-[#F2EEFB]/40 text-sm py-8 text-center">Rien à afficher pour l'instant.</p>}
              {feed.map((item) => (
                <button key={item.id} onClick={() => onOpenShop(item.creatorId)} className="w-full text-left bg-[#1C1626] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#6C2BD9]/20 flex items-center justify-center text-[#6C2BD9] shrink-0">
                      {item.type === "PRODUCT" ? <ShoppingBag size={14} /> : <Star size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F2EEFB] text-sm font-medium truncate">{item.creatorName}</p>
                      <p className="text-[#F2EEFB]/35 text-[11px]">{new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  {item.type === "PRODUCT" ? (
                    <p className="text-[#F2EEFB]/80 text-sm leading-relaxed">A ajouté un nouveau contenu : <span className="font-medium">« {item.title} »</span> ({CATEGORY_LABEL[item.category]})</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} className={n <= item.rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#F2EEFB]/15"} />)}
                      </div>
                      <p className="text-[#F2EEFB]/80 text-sm leading-relaxed">{item.reviewerName} a laissé un avis sur « {item.productTitle} »{item.comment ? ` : "${item.comment}"` : ""}</p>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CreatorShopScreen({ creatorId, onClose, currency = "XOF" }) {
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
    <div className="absolute inset-0 z-40 bg-[#0B0714] flex flex-col">
      <ScreenHeader title="Boutique" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading && <Loader2 size={20} className="text-[#6C2BD9] animate-spin mx-auto my-10" />}
        {error && <p className="text-[#E0654A] text-sm text-center py-8">{error}</p>}
        {data && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 premium-glow-gold flex items-center justify-center text-[#6C2BD9] text-xl font-semibold shrink-0 overflow-hidden">
                {data.creator.logoUrl ? <img src={data.creator.logoUrl} alt="" className="w-full h-full object-cover" /> : data.creator.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[#F2EEFB] font-semibold truncate">{data.creator.name}</p>
                  {(() => {
                    const lvl = levelFor(data.stats.totalSales);
                    return (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ color: lvl.color, background: `${lvl.color}1A`, border: `1px solid ${lvl.color}40` }}>
                        <Award size={10} /> {lvl.label}
                      </span>
                    );
                  })()}
                </div>
                {data.creator.bio && <p className="text-[#F2EEFB]/50 text-xs mt-0.5">{data.creator.bio}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-[#1C1626] rounded-xl p-3 text-center premium-border">
                <p className="text-[#F2EEFB] text-lg font-semibold">{data.stats.productCount}</p>
                <p className="text-[#F2EEFB]/40 text-[10px]">Contenus</p>
              </div>
              <div className="bg-[#1C1626] rounded-xl p-3 text-center premium-border">
                <p className="text-[#F2EEFB] text-lg font-semibold">{data.stats.totalSales}</p>
                <p className="text-[#F2EEFB]/40 text-[10px]">Ventes</p>
              </div>
              <div className="bg-[#1C1626] rounded-xl p-3 text-center premium-border">
                <p className="text-[#F2EEFB] text-lg font-semibold flex items-center justify-center gap-1">
                  {data.stats.avgRating ?? "—"} {data.stats.avgRating && <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />}
                </p>
                <p className="text-[#F2EEFB]/40 text-[10px]">{data.stats.reviewCount} avis</p>
              </div>
            </div>

            <p className="text-[#F2EEFB]/50 text-xs mb-2">Contenus de cette boutique</p>
            <div className="space-y-2">
              {data.products.map((p) => {
                const Icon = CATEGORY_ICON[p.category] || FileText;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-[#1C1626] border border-white/5 rounded-2xl p-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#6C2BD9]/10 flex items-center justify-center shrink-0 text-[#6C2BD9]"><Icon size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F2EEFB] text-sm font-medium truncate">{p.title}</p>
                      <p className="text-[#F2EEFB]/40 text-xs truncate">{p.description}</p>
                    </div>
                    <span className="text-[#F2EEFB] text-sm font-semibold shrink-0 tabular-nums">{fmtCur(p.priceXof, currency)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[#F2EEFB]/25 text-[11px] text-center mt-5">Retourne au Market pour acheter un de ces contenus.</p>
          </>
        )}
      </div>
    </div>
  );
}

function SellScreen({ token, onBack, onProductCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("LIBRARY");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadPct, setUploadPct] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadError("");
    setUploadPct(0);
    try {
      const url = await uploadFile(file, setUploadPct);
      setFileUrl(url);
      vibrate(15);
    } catch (err) {
      setUploadError(err.message || "Échec de l'upload");
      setFileName("");
    } finally {
      setUploadPct(null);
    }
  };

  const submit = async () => {
    setError(""); setSaving(true);
    try {
      await api("/market/products", {
        method: "POST",
        token,
        body: { title, description, priceXof: Number(price), category, fileUrl: fileUrl || null },
      });
      setDone(true);
      vibrate([15, 40, 15]); playChime("success");
      setTitle(""); setDescription(""); setPrice(""); setFileUrl(""); setFileName("");
      onProductCreated?.();
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setError(e.message || "Échec de la création");
    } finally {
      setSaving(false);
    }
  };

  const valid = title && description && price && category;

  return (
    <div className="absolute inset-0 z-40 bg-[#0B0714] overflow-y-auto pb-8">
      <ScreenHeader title="Vendre un produit" subtitle="Visible par tous, sans limite" onBack={onBack} />
      <div className="px-5 space-y-3">
        <div>
          <p className="text-[#F2EEFB]/50 text-xs mb-1.5">Titre</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Guide Forex Débutant"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
        </div>
        <div>
          <p className="text-[#F2EEFB]/50 text-xs mb-1.5">Description</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Décris ton produit ou service..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
        </div>
        <div>
          <p className="text-[#F2EEFB]/50 text-xs mb-1.5">Catégorie</p>
          <div className="flex gap-2">
            {["LIBRARY", "ACADEMY", "MARKET"].map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`flex-1 text-xs font-medium rounded-lg py-2 border ${category === c ? "bg-[#6C2BD9] text-white border-[#6C2BD9]" : "text-[#F2EEFB]/60 border-white/10"}`}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <p className="text-[#F2EEFB]/25 text-[10px] mt-1">Market couvre aussi bien les produits physiques (vêtements, objets) que numériques.</p>
        </div>
        <div>
          <p className="text-[#F2EEFB]/50 text-xs mb-1.5">Prix (FCFA)</p>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" inputMode="numeric" placeholder="5000"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#F2EEFB] outline-none placeholder:text-[#F2EEFB]/30" />
        </div>
        <div>
          <p className="text-[#F2EEFB]/50 text-xs mb-1.5">Fichier ou photo (optionnel)</p>
          <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" accept="image/*,application/pdf,audio/*,video/*" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadPct !== null}
            className="w-full bg-white/[0.04] border border-dashed border-white/15 rounded-xl px-3.5 py-4 text-sm text-[#F2EEFB]/60 flex flex-col items-center justify-center gap-1.5 disabled:opacity-50">
            {uploadPct !== null ? (
              <>
                <Loader2 size={18} className="animate-spin text-[#6C2BD9]" />
                <span className="text-xs">Envoi en cours… {uploadPct}%</span>
              </>
            ) : fileUrl ? (
              <>
                <CheckCircle2 size={18} className="text-[#2E9E83]" />
                <span className="text-xs text-[#2E9E83] truncate max-w-full">{fileName}</span>
              </>
            ) : (
              <>
                <Download size={18} className="rotate-180" />
                <span className="text-xs">Depuis ton téléphone (photo, PDF, audio...)</span>
              </>
            )}
          </button>
          {uploadError && <p className="text-[#E0654A] text-xs mt-1.5">{uploadError}</p>}
        </div>

        {error && <p className="text-[#E0654A] text-xs">{error}</p>}
        {done && <p className="text-[#2E9E83] text-xs">Produit publié — visible dans le Market et ta boutique 🎉</p>}

        <button onClick={submit} disabled={!valid || saving || uploadPct !== null} className="w-full bg-[#6C2BD9] disabled:opacity-30 text-white font-semibold rounded-xl py-3 premium-glow flex items-center justify-center gap-2 mt-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Publier"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-[#1C1626] rounded-2xl p-4 premium-border">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[#F2EEFB]/40 text-xs">{label}</p>
        {Icon && <Icon size={14} className="text-[#6C2BD9]" />}
      </div>
      <p className="premium-text text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function AdminStatsScreen({ token, onBack, currency }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api("/admin/stats", { token });
        setStats(data);
      } catch (e) {
        setError(e.message || "Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-[#0B0714] overflow-y-auto pb-8">
      <ScreenHeader title="Statistiques VORTEX" subtitle="Vue d'ensemble de la plateforme" onBack={onBack} />
      {loading && <div className="px-5 grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl vortex-skeleton" />)}</div>}
      {error && <p className="text-[#E0654A] text-sm text-center py-8">{error}</p>}
      {stats && (
        <div className="px-5 grid grid-cols-2 gap-3">
          <StatCard label="Visites" value={stats.totalVisits} icon={Sparkles} />
          <StatCard label="Utilisateurs inscrits" value={stats.totalUsers} icon={Users} />
          <StatCard label="Vendeurs actifs" value={stats.totalCreators} icon={Award} />
          <StatCard label="Produits publiés" value={stats.totalProducts} icon={ShoppingBag} />
          <StatCard label="Ventes réalisées" value={stats.totalPurchases} icon={Check} />
          <StatCard label="Commission VORTEX" value={fmtCur(stats.totalCommission, currency)} icon={WalletIcon} />
        </div>
      )}
      <p className="text-[#F2EEFB]/25 text-[11px] text-center mt-6 px-5">Les "visites" comptent chaque ouverture de l'app, y compris par des personnes non connectées.</p>
    </div>
  );
}

function ProfileScreen({ name, phone, balance, purchases, progress, isAdmin, onBack, onOpenContent, onLogout, onOpenSell, onOpenAdmin, t, lang, setLang, currency, setCurrency }) {
  return (
    <div className="pb-4">
      <ScreenHeader title={t("profile_title")} onBack={onBack} />
      <div className="px-5 flex items-center gap-3 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 premium-glow-gold flex items-center justify-center text-[#6C2BD9] text-xl font-semibold">{name.slice(0, 1).toUpperCase()}</div>
        <div><p className="text-[#F2EEFB] font-semibold">{name}</p><p className="text-[#F2EEFB]/40 text-xs">{phone}</p></div>
      </div>
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1C1626] rounded-2xl p-4 premium-border"><p className="text-[#F2EEFB]/40 text-xs">Solde Wallet</p><p className="premium-text text-lg font-bold mt-1 tabular-nums">{fmtCur(balance, currency)}</p></div>
        <div className="bg-[#1C1626] rounded-2xl p-4 premium-border"><p className="text-[#F2EEFB]/40 text-xs">Contenus acquis</p><p className="text-[#F2EEFB] text-lg font-semibold mt-1">{purchases.length}</p></div>
      </div>
      <div className="px-5 mb-6">
        <h3 className="text-[#F2EEFB] text-sm font-semibold mb-2">{t("profile_settings")}</h3>
        <div className="bg-[#1C1626] rounded-2xl p-4 border border-white/5 space-y-3">
          <div>
            <p className="text-[#F2EEFB]/40 text-xs mb-1.5">Langue / Language</p>
            <div className="flex gap-2">
              <button onClick={() => setLang("fr")} className={`flex-1 text-xs font-medium rounded-lg py-2 ${lang === "fr" ? "bg-[#6C2BD9] text-white" : "bg-white/5 text-[#F2EEFB]/60"}`}>Français</button>
              <button onClick={() => setLang("en")} className={`flex-1 text-xs font-medium rounded-lg py-2 ${lang === "en" ? "bg-[#6C2BD9] text-white" : "bg-white/5 text-[#F2EEFB]/60"}`}>English</button>
            </div>
          </div>
          <div>
            <p className="text-[#F2EEFB]/40 text-xs mb-1.5">Devise affichée</p>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2EEFB] outline-none">
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <option key={code} value={code} className="bg-[#1C1626]">{c.label}</option>
              ))}
            </select>
            <p className="text-[#F2EEFB]/25 text-[10px] mt-1.5">Les montants réels restent en Franc CFA (XOF) — ceci n'est qu'un affichage indicatif.</p>
          </div>
        </div>
      </div>
      <div className="px-5 mb-6">
        <h3 className="text-[#F2EEFB] text-sm font-semibold mb-2">{t("profile_library")}</h3>
        <div className="space-y-2">
          {purchases.length === 0 && <p className="text-[#F2EEFB]/40 text-sm py-4">Rien acheté pour l'instant — direction le Market !</p>}
          {purchases.map(({ product }) => {
            const Icon = CATEGORY_ICON[product.category] || FileText;
            const consumable = product.category === "ACADEMY" || product.category === "LIBRARY";
            const prog = progress[product.id];
            let pct = null;
            if (product.category === "ACADEMY") pct = Math.round(((prog?.completedLessons?.length || 0) / (product.lessons?.length || 1)) * 100);
            if (product.category === "LIBRARY") pct = Math.round(((prog?.currentPage || 1) / (product.totalPages || 60)) * 100);
            return (
              <button key={product.id} onClick={() => consumable && onOpenContent(product)} className="w-full flex items-center gap-3 bg-[#1C1626] rounded-xl px-3.5 py-3 border border-white/5 text-left">
                <div className="w-9 h-9 rounded-lg bg-[#6C2BD9]/10 flex items-center justify-center text-[#6C2BD9] shrink-0"><Icon size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F2EEFB] text-sm truncate">{product.title}</p>
                  {pct !== null && <div className="mt-1.5 flex items-center gap-2"><div className="flex-1"><ProgressBar pct={pct} color={product.category === "ACADEMY" ? "#6C2BD9" : "#2E9E83"} /></div><span className="text-[#F2EEFB]/40 text-[10px] shrink-0">{pct}%</span></div>}
                </div>
                {consumable && <ChevronRight size={16} className="text-[#F2EEFB]/30 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-5">
        <button onClick={onOpenSell} className="w-full flex items-center justify-center gap-2 bg-[#6C2BD9] text-white text-sm font-semibold rounded-xl py-3 mb-3 premium-glow">
          <ShoppingBag size={14} /> Vendre un produit
        </button>
        <p className="text-[#F2EEFB]/25 text-[10px] text-center -mt-2 mb-3">Publie un contenu et tu apparais automatiquement dans la Communauté.</p>
        {isAdmin && (
          <button onClick={onOpenAdmin} className="w-full flex items-center justify-center gap-2 bg-[#6C2BD9]/10 text-[#6C2BD9] text-sm font-medium rounded-xl py-3 mb-3">
            <Sparkles size={14} /> {t("profile_admin")}
          </button>
        )}
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-[#E0654A]/80 text-xs py-3"><LogOut size={13} /> {t("profile_logout")}</button>
      </div>
    </div>
  );
}

function BottomNav({ screen, goTo, t }) {
  const items = [
    { id: "home", label: t("nav_home"), icon: Home },
    { id: "wallet", label: t("nav_wallet"), icon: WalletIcon },
    { id: "market", label: t("nav_market"), icon: ShoppingBag },
    { id: "community", label: t("nav_community"), icon: Users },
    { id: "profile", label: t("nav_profile"), icon: User },
  ];
  return (
    <div className="border-t border-white/5 bg-[#130D1D] px-2 pt-2 pb-3 flex justify-around">
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.id;
        return (
          <button key={it.id} onClick={() => goTo(it.id)} className="flex flex-col items-center gap-1 px-3 py-1">
            <Icon size={20} className={active ? "text-[#6C2BD9]" : "text-[#F2EEFB]/35"} strokeWidth={active ? 2.4 : 2} />
            <span className={`text-[10px] ${active ? "text-[#6C2BD9] font-medium" : "text-[#F2EEFB]/35"}`}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function VortexApp() {
  const [booting, setBooting] = useState(true);
  const [auth, setAuth] = useState(null);
  const [lang, setLangState] = useState("fr");
  const [currency, setCurrencyState] = useState("XOF");
  const [screen, setScreen] = useState("home");
  const [autoOpen, setAutoOpen] = useState(null);
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewingShop, setViewingShop] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [local, setLocal] = useState({ progress: {} });
  const [syncing, setSyncing] = useState(false);

  const showToast = (message, tone) => { setToast({ message, tone }); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_KEY);
      if (savedAuth) setAuth(JSON.parse(savedAuth));
    } catch (e) { }
    try {
      const savedLocal = localStorage.getItem(LOCAL_KEY);
      if (savedLocal) setLocal(JSON.parse(savedLocal));
    } catch (e) { }
    try {
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang) setLangState(savedLang);
    } catch (e) { }
    try {
      const savedCurrency = localStorage.getItem(CURRENCY_KEY);
      if (savedCurrency) setCurrencyState(savedCurrency);
    } catch (e) { }
    setBooting(false);
    api("/analytics/visit", { method: "POST" }).catch(() => {});
  }, []);

  const setLang = (l) => { setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch (e) {} };
  const setCurrency = (c) => { setCurrencyState(c); try { localStorage.setItem(CURRENCY_KEY, c); } catch (e) {} };
  const t = useT(lang);

  const persistLocal = (next) => {
    setLocal(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch (e) { }
  };

  const handleAuthed = (data) => {
    setAuth(data);
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(data)); } catch (e) { }
  };

  const handleLogout = () => {
    setAuth(null);
    try { localStorage.removeItem(AUTH_KEY); } catch (e) { }
  };

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

  useEffect(() => { refreshProducts(); }, []);

  const refreshWallet = async () => {
    if (!auth) return;
    try {
      const bal = await api("/wallet/balance", { token: auth.token });
      setBalance(bal.balance);
    } catch (e) { }
  };

  const refreshTransactions = async () => {
    if (!auth) return;
    setLoadingTx(true);
    try {
      const tx = await api("/wallet/transactions", { token: auth.token });
      setTransactions(tx);
    } catch (e) { }
    setLoadingTx(false);
  };

  const refreshPurchases = async () => {
    if (!auth) return;
    try {
      const p = await api("/market/me/purchases", { token: auth.token });
      setPurchases(p);
    } catch (e) { }
  };

  useEffect(() => {
    if (!auth) return;
    setSyncing(true);
    Promise.all([refreshWallet(), refreshTransactions(), refreshPurchases()]).finally(() => setSyncing(false));
  }, [auth]);

  const goTo = (s, sub) => { setScreen(s); setAutoOpen(sub || null); };

  const handleMoneyConfirm = async (amount, providerId) => {
    const path = modal === "deposit" ? "/wallet/deposit" : "/wallet/withdraw";
    await api(path, { method: "POST", token: auth.token, body: { amount, provider: providerId, phone: auth.phone } });
    await Promise.all([refreshWallet(), refreshTransactions()]);
    vibrate(20); playChime("success");
    showToast(modal === "deposit" ? "Dépôt effectué" : "Retrait effectué", "teal");
  };

  const handleBuy = async (product) => {
    await api(`/market/products/${product.id}/purchase`, { method: "POST", token: auth.token });
    await Promise.all([refreshWallet(), refreshPurchases()]);
    vibrate([15, 40, 15]); playChime("success");
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

  const purchasedIds = purchases.map((p) => p.productId);

  if (booting) {
    return (
      <div className="w-full min-h-screen bg-[#080611] flex items-center justify-center">
        <VortexMark size={40} spinning />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#080611]" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <div className="relative w-full max-w-md mx-auto min-h-screen bg-[#0B0714] flex flex-col">
        <div className="flex-1 overflow-y-auto relative">
          {toast && <Toast message={toast.message} tone={toast.tone} />}

          {!auth && <AuthScreen onAuthed={handleAuthed} lang={lang} setLang={setLang} />}

          {auth && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={screen}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {screen === "home" && <HomeScreen balance={balance} name={auth.name} goTo={goTo} recent={transactions} syncing={syncing} t={t} currency={currency} />}
                  {screen === "wallet" && (
                    <WalletScreen balance={balance} transactions={transactions} onBack={() => goTo("home")}
                      openDeposit={() => setModal("deposit")} openWithdraw={() => setModal("withdraw")} autoOpen={autoOpen} loadingTx={loadingTx} t={t} currency={currency} />
                  )}
                  {screen === "market" && (
                    <MarketScreen onBack={() => goTo("home")} balance={balance} token={auth.token} onBuy={handleBuy} purchasedIds={purchasedIds}
                      products={products} loadingProducts={loadingProducts} onOpenContent={setViewing} onOpenShop={setViewingShop} t={t} currency={currency} />
                  )}
                  {screen === "community" && (
                    <CommunityScreen token={auth.token} onBack={() => goTo("home")} onOpenShop={setViewingShop} />
                  )}
                  {screen === "profile" && (
                    <ProfileScreen name={auth.name} phone={auth.phone} balance={balance} purchases={purchases} progress={local.progress}
                      isAdmin={auth.isAdmin} onBack={() => goTo("home")} onOpenContent={setViewing} onLogout={handleLogout} onOpenSell={() => setSellOpen(true)} onOpenAdmin={() => setAdminOpen(true)}
                      t={t} lang={lang} setLang={setLang} currency={currency} setCurrency={setCurrency} />
                  )}
                </motion.div>
              </AnimatePresence>

              {modal && <MoneyModal mode={modal} phone={auth.phone} onClose={() => setModal(null)} onConfirm={handleMoneyConfirm} />}

              {viewing && viewing.category === "ACADEMY" && (
                <AcademyViewer product={viewing} progress={local.progress[viewing.id]} onToggleLesson={(lid) => handleToggleLesson(viewing.id, lid)} onClose={() => setViewing(null)} />
              )}
              {viewing && viewing.category === "LIBRARY" && (
                <LibraryViewer product={viewing} progress={local.progress[viewing.id]} onSetPage={(pg) => handleSetPage(viewing.id, pg)} onClose={() => setViewing(null)} />
              )}

              {viewingShop && <CreatorShopScreen creatorId={viewingShop} onClose={() => setViewingShop(null)} currency={currency} />}

              {sellOpen && <SellScreen token={auth.token} onBack={() => setSellOpen(false)} onProductCreated={refreshProducts} />}

              {adminOpen && <AdminStatsScreen token={auth.token} onBack={() => setAdminOpen(false)} currency={currency} />}

              {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} products={products} />}

              {!modal && !viewing && !viewingShop && !sellOpen && !adminOpen && !aiOpen && (
                <button onClick={() => setAiOpen(true)} className="fixed right-4 bottom-20 rounded-full bg-[#6C2BD9] premium-glow flex items-center justify-center active:scale-95 transition-transform z-30" style={{ width: 52, height: 52 }} aria-label="Ouvrir VORTEX AI">
                  <Sparkles size={22} className="text-white" />
                </button>
              )}
            </>
          )}
        </div>

        {auth && <BottomNav screen={screen} goTo={goTo} t={t} />}
      </div>
    </div>
  );
}
