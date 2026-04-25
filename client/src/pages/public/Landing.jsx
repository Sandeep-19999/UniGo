import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";

import car1 from "../../assets/cars/car1.jpg"; 
import car2 from "../../assets/cars/car2.jpg"; 
import car3 from "../../assets/cars/car3.jpg"; 
import car4 from "../../assets/cars/car4.jpg"; 
import car5 from "../../assets/cars/car5.jpg"; 

/* ─── Car carousel data ───────────────────────────────────────────── */
const CARS = [
  {
    src: car1,
    label: "Premium Sedan",
  },
  {
    src: car2,
    label: "Sports Coupe",
  },
  {
    src: car3,
    label: "Luxury SUV",
  },
  {
    src: car4,
    label: "Campus Cruiser",
  },
  {
    src: car5,
    label: "Night Rider",
  },
];

/* ─── Floating particle ────────────────────────────────────────────── */
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, i) => (
        <span key={i} className="particle" style={{ "--i": i }} />
      ))}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────── */
export default function Landing() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState(2);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    intervalRef.current = setInterval(() => {
      setActive((p) => (p + 1) % CARS.length);
    }, 3200);

    return () => clearInterval(intervalRef.current);
  }, []);

  if (!loading && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "driver") return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  const offset = (i) => {
    const diff = i - active;
    const n = CARS.length;
    const wrapped = ((diff + Math.floor(n / 2)) % n) - Math.floor(n / 2);
    return wrapped;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700;900&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --accent: #10b981;
          --accent-light: #22c55e;
          --accent-dark: #047857;

          --bg: #010403;
          --bg-soft: #020806;

          --surface: rgba(3, 12, 9, 0.88);
          --surface-light: rgba(16, 185, 129, 0.06);

          --border: rgba(16, 185, 129, 0.14);

          --text: #f8fafc;
          --text-muted: rgba(203, 213, 225, 0.58);
        }

        .ug-root {
          font-family: 'Outfit', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 32%),
            radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.06), transparent 26%),
            linear-gradient(135deg, #010403 0%, #020806 45%, #020617 100%);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        .ug-root::before {
          content: '';
          position: fixed;
          top: -24%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 700px;
          background: radial-gradient(
            ellipse at center,
            rgba(16, 185, 129, 0.1) 0%,
            rgba(16, 185, 129, 0.035) 45%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        .particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .particle {
          --i: 0;
          position: absolute;
          left: calc(var(--i) * 4.7% + 1%);
          bottom: -12px;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0;
          animation: rise calc(6s + var(--i) * 0.4s) calc(var(--i) * 0.6s) infinite ease-in;
        }

        @keyframes rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }

          80% {
            opacity: 0.1;
          }

          100% {
            transform: translateY(-105vh) scale(0.3);
            opacity: 0;
          }
        }

        .ug-header {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 48px;
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(14px);
          background: rgba(1, 4, 3, 0.84);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.36);
        }

        .ug-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .ug-logo-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, var(--accent), var(--accent-dark));
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 23px;
          color: #ecfdf5;
          box-shadow: 0 12px 28px rgba(16, 185, 129, 0.24);
        }

        .ug-logo-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 23px;
          letter-spacing: 2px;
          color: var(--text);
        }

        .ug-logo-text span {
          color: var(--accent);
        }

        .ug-nav {
          display: none;
        }

        .ug-nav a {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: color 0.2s;
        }

        .ug-nav a:hover {
          color: var(--text);
        }

        .ug-header-cta {
          display: flex;
          gap: 10px;
        }

        .btn-outline {
          padding: 10px 23px;
          border-radius: 100px;
          border: 1px solid rgba(203, 213, 225, 0.16);
          background: rgba(2, 8, 6, 0.66);
          color: var(--text);
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }

        .btn-outline:hover {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.34);
          transform: translateY(-1px);
        }

        .btn-green {
          padding: 10px 23px;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, var(--accent), var(--accent-dark));
          color: #ecfdf5;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 14px 32px rgba(16, 185, 129, 0.22);
          transition: box-shadow 0.2s, transform 0.15s, filter 0.2s;
        }

        .btn-green:hover {
          filter: brightness(1.06);
          box-shadow: 0 18px 42px rgba(16, 185, 129, 0.32);
          transform: translateY(-1px);
        }

        .ug-hero {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 0;
          min-height: calc(100vh - 73px);
          padding: 60px 48px;
        }

        .ug-copy {
          max-width: 560px;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .ug-copy.in {
          opacity: 1;
          transform: translateY(0);
        }

        .ug-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--accent-light);
          margin-bottom: 18px;
        }

        .ug-eyebrow::before {
          content: '';
          display: block;
          width: 28px;
          height: 1.5px;
          background: var(--accent);
        }

        .ug-headline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(52px, 6vw, 86px);
          line-height: 0.95;
          letter-spacing: 1.5px;
          color: var(--text);
        }

        .ug-headline .green {
          color: var(--accent-light);
          text-shadow: 0 0 24px rgba(16, 185, 129, 0.26);
        }

        .ug-sub {
          margin-top: 22px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-muted);
          max-width: 420px;
        }

        .ug-cta-row {
          margin-top: 36px;
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .btn-green-lg {
          padding: 14px 34px;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, var(--accent), var(--accent-dark));
          color: #ecfdf5;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 14px 32px rgba(16, 185, 129, 0.22);
          transition: box-shadow 0.2s, transform 0.15s, filter 0.2s;
          letter-spacing: 0.3px;
        }

        .btn-green-lg:hover {
          filter: brightness(1.06);
          box-shadow: 0 18px 42px rgba(16, 185, 129, 0.32);
          transform: translateY(-2px);
        }

        .btn-ghost-lg {
          padding: 13px 30px;
          border-radius: 100px;
          border: 1px solid rgba(203, 213, 225, 0.16);
          background: rgba(3, 12, 9, 0.82);
          color: var(--text);
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          backdrop-filter: blur(8px);
        }

        .btn-ghost-lg:hover {
          background: rgba(16, 185, 129, 0.07);
          border-color: rgba(16, 185, 129, 0.32);
          transform: translateY(-2px);
        }

        .ug-stats {
          margin-top: 52px;
          display: flex;
          gap: 36px;
        }

        .ug-stat-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          color: var(--accent-light);
          letter-spacing: 1px;
        }

        .ug-stat-label {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .ug-carousel {
          position: relative;
          height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }

        .car-card {
          position: absolute;
          width: 240px;
          height: 320px;
          border-radius: 28px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(16, 185, 129, 0.1);
          transition:
            transform 0.6s cubic-bezier(0.34, 1.26, 0.64, 1),
            opacity 0.5s ease,
            filter 0.5s ease,
            box-shadow 0.5s ease;
          will-change: transform, opacity;
        }

        .car-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .car-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(1, 4, 3, 0.9) 0%, transparent 58%);
        }

        .car-card-label {
          position: absolute;
          bottom: 14px;
          left: 14px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--accent-light);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .car-card.is-center .car-card-label {
          opacity: 1;
        }

        .car-card.is-center {
          z-index: 10;
          box-shadow:
            0 0 0 1.5px rgba(16, 185, 129, 0.34),
            0 32px 80px rgba(0, 0, 0, 0.88),
            0 0 55px rgba(16, 185, 129, 0.16);
        }

        .ug-pills {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 0 48px 60px;
          flex-wrap: wrap;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 24px;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: var(--surface);
          backdrop-filter: blur(14px);
          transition: border-color 0.25s, background 0.25s, transform 0.2s;
          cursor: default;
        }

        .pill:hover {
          border-color: rgba(16, 185, 129, 0.32);
          background: rgba(16, 185, 129, 0.07);
          transform: translateY(-3px);
        }

        .pill-icon {
          font-size: 20px;
        }

        .pill-text strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }

        .pill-text span {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .ug-tip {
          position: relative;
          z-index: 10;
          text-align: center;
          padding-bottom: 32px;
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.4px;
        }

        .ug-tip b {
          color: var(--accent-light);
          font-weight: 700;
        }

        .green-line {
          width: 48px;
          height: 2px;
          background: linear-gradient(90deg, var(--accent), transparent);
          margin: 0 auto 24px;
          opacity: 0.62;
        }

        @media (max-width: 900px) {
          .ug-hero {
            grid-template-columns: 1fr;
            padding: 40px 24px;
            text-align: center;
          }

          .ug-sub,
          .ug-cta-row,
          .ug-stats,
          .ug-eyebrow {
            justify-content: center;
            margin-left: auto;
            margin-right: auto;
          }

          .ug-copy {
            max-width: 100%;
          }

          .ug-carousel {
            height: 380px;
          }

          .car-card {
            width: 180px;
            height: 240px;
          }

          .ug-header {
            padding: 18px 24px;
          }

          .ug-nav {
            display: none;
          }

          .ug-pills {
            padding: 0 24px 40px;
          }
        }

        @media (max-width: 560px) {
          .ug-header {
            gap: 16px;
            flex-wrap: wrap;
          }

          .ug-header-cta {
            width: 100%;
            justify-content: center;
          }

          .ug-cta-row {
            flex-direction: column;
          }

          .btn-green-lg,
          .btn-ghost-lg {
            width: 100%;
            text-align: center;
          }

          .ug-stats {
            gap: 22px;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="ug-root">
        <Particles />

        <header className="ug-header">
          <Link to="/" className="ug-logo">
            <div className="ug-logo-icon">U</div>
            <div className="ug-logo-text">
              UNIGO <span>RIDE</span>
            </div>
          </Link>

          <nav className="ug-nav">
            <a href="#">Home</a>
            <a href="#">Services</a>
            <a href="#">Activity</a>
            <a href="#">Account</a>
          </nav>

          <div className="ug-header-cta">
            <Link to="/auth/register" className="btn-outline">
              Register
            </Link>
            <Link to="/auth/login" className="btn-green">
              Sign In
            </Link>
          </div>
        </header>

        <section className="ug-hero">
          <div className={`ug-copy ${mounted ? "in" : ""}`}>
            <div className="ug-eyebrow">University Ride Share</div>

            <h1 className="ug-headline">
              EASILY
              <br />
              REQUEST A
              <br />
              <span className="green">SAFE & FAST</span>
              <br />
              RIDE
            </h1>

            <p className="ug-sub">
              Book a safe, fast, and reliable ride using UniGo anytime,
              anywhere on campus — with just a few taps.
            </p>

            <div className="ug-cta-row">
              <Link to="/auth/login" className="btn-green-lg">
                Request a Ride
              </Link>
              <Link to="/auth/register" className="btn-ghost-lg">
                Create Account
              </Link>
            </div>

            <div className="ug-stats">
              <div>
                <div className="ug-stat-val">4.9★</div>
                <div className="ug-stat-label">Driver Rating</div>
              </div>
              <div>
                <div className="ug-stat-val">2 MIN</div>
                <div className="ug-stat-label">Avg Wait</div>
              </div>
              <div>
                <div className="ug-stat-val">100%</div>
                <div className="ug-stat-label">Verified Drivers</div>
              </div>
            </div>
          </div>

          <div className="ug-carousel">
            {CARS.map((car, i) => {
              const off = offset(i);
              const isCenter = off === 0;
              const tx = off * 130;
              const tz = -Math.abs(off) * 80;
              const rot = off * 8;
              const scale = isCenter ? 1.18 : 1 - Math.abs(off) * 0.12;
              const op = 1 - Math.abs(off) * 0.28;

              return (
                <div
                  key={i}
                  className={`car-card${isCenter ? " is-center" : ""}`}
                  style={{
                    transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${rot}deg) scale(${scale})`,
                    opacity: op,
                    filter: isCenter ? "none" : "brightness(0.5) saturate(0.55)",
                    zIndex: isCenter ? 10 : 5 - Math.abs(off),
                  }}
                  onClick={() => setActive(i)}
                >
                  <img src={car.src} alt={car.label} loading="lazy" />
                  <div className="car-card-overlay" />
                  <div className="car-card-label">{car.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="green-line" />

        <div className="ug-pills">
          {[
            {
              icon: "🚗",
              title: "Driver Module",
              desc: "Vehicles · rides · earnings",
            },
            {
              icon: "🎓",
              title: "Passenger Module",
              desc: "Book in seconds",
            },
          ].map((p) => (
            <div className="pill" key={p.title}>
              <span className="pill-icon">{p.icon}</span>
              <div className="pill-text">
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ug-tip">
          Tip: register as <b>driver</b> to manage vehicles and rides
        </div>
      </div>
    </>
  );
}