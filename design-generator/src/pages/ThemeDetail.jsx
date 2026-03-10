import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchThemes, deleteTheme } from '../services/themesService';

function buildDSPage(theme) {
    const t = theme.tokens || {};
    const atoms = t.atoms || t;
    const colors = atoms.colors || t.colors || {};
    const typography = atoms.typography || t.typography || {};
    const shadows = atoms.shadows || t.shadows || {};
    const radius = atoms.radius || t.radius || {};
    const meta = t.meta || {};

    const bg = colors.background || colors.bg || '#0C0C0E';
    const surface = colors.surface || '#131316';
    const surface2 = colors.surface2 || '#1A1A1F';
    const surface3 = colors.surface3 || '#22222A';
    const border = colors.border || '#2A2A32';
    const borderStrong = colors.borderLight || colors.borderStrong || '#3A3A45';
    const text = colors.text || '#FAFAFA';
    const textSec = colors.textSecondary || '#A0A0A8';
    const textMuted = colors.textMuted || '#5A5A65';
    const accent = colors.accent || '#C9A962';
    const accentLight = colors.accentLight || '#DFC07A';
    const accentDark = colors.accentDark || '#A88940';
    const success = colors.success || '#22c55e';
    const warning = colors.warning || '#f59e0b';
    const error = colors.error || '#ef4444';

    const fontHeading = typography.fontHeading || "'DM Serif Display', Georgia, serif";
    const fontBody = typography.fontBody || "'DM Sans', system-ui, sans-serif";
    const googleFonts = typography.googleFontsUrl || 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap';

    const radiusMd = radius.md || '8px';
    const radiusLg = radius.lg || '12px';
    const radiusXl = radius.xl || '16px';

    const shadowXs = shadows.xs || '0 1px 2px rgba(0,0,0,0.3)';
    const shadowSm = shadows.sm || '0 1px 4px rgba(0,0,0,0.4)';
    const shadowMd = shadows.md || '0 4px 12px rgba(0,0,0,0.5)';
    const shadowLg = shadows.lg || '0 8px 24px rgba(0,0,0,0.6)';
    const shadowXl = shadows.xl || '0 16px 48px rgba(0,0,0,0.7)';

    const personality = (meta.personality || []).join(' · ') || '';
    const description = meta.description || theme.description || '';

    const cssVars = meta.cssVariables || `:root {
  /* Backgrounds */
  --bg: ${bg};
  --surface: ${surface};
  --surface2: ${surface2};
  --surface3: ${surface3};
  --border: ${border};
  --border-strong: ${borderStrong};

  /* Text */
  --text: ${text};
  --text-secondary: ${textSec};
  --text-muted: ${textMuted};

  /* Accent */
  --accent: ${accent};
  --accent-light: ${accentLight};
  --accent-dark: ${accentDark};

  /* Semantic */
  --success: ${success};
  --warning: ${warning};
  --error: ${error};

  /* Typography */
  --font-heading: ${fontHeading};
  --font-body: ${fontBody};

  /* Radius */
  --radius-md: ${radiusMd};
  --radius-lg: ${radiusLg};
  --radius-xl: ${radiusXl};

  /* Shadows */
  --shadow-xs: ${shadowXs};
  --shadow-sm: ${shadowSm};
  --shadow-md: ${shadowMd};
  --shadow-lg: ${shadowLg};
  --shadow-xl: ${shadowXl};
}`;

    // Inline accent-rgb for glow
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return isNaN(r) ? '201, 169, 98' : `${r}, ${g}, ${b}`;
    };
    const accentRgb = hexToRgb(accent);

    // Build the template HTML inline (mirrors template.html structure)
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design System — ${theme.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${googleFonts}" rel="stylesheet">
<style>
:root {
  --bg: ${bg}; --surface: ${surface}; --surface2: ${surface2}; --surface3: ${surface3};
  --border: ${border}; --border-strong: ${borderStrong};
  --text: ${text}; --text-secondary: ${textSec}; --text-muted: ${textMuted};
  --accent: ${accent}; --accent-light: ${accentLight}; --accent-dark: ${accentDark};
  --accent-rgb: ${accentRgb};
  --success: ${success}; --warning: ${warning}; --error: ${error};
  --font-heading: ${fontHeading}; --font-body: ${fontBody};
  --font-mono: 'JetBrains Mono', monospace;
  --radius-md: ${radiusMd}; --radius-lg: ${radiusLg}; --radius-xl: ${radiusXl}; --radius-full: 9999px;
  --shadow-xs: ${shadowXs}; --shadow-sm: ${shadowSm}; --shadow-md: ${shadowMd};
  --shadow-lg: ${shadowLg}; --shadow-xl: ${shadowXl};
  --shadow-glow: 0 0 24px rgba(${accentRgb}, 0.35);
  --sidebar-w: 220px; --ease: cubic-bezier(0.4,0,0.2,1); --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:16px;line-height:1.6;display:flex;min-height:100vh}
.sidebar{width:var(--sidebar-w);position:fixed;top:0;left:0;height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:100;overflow-y:auto}
.sb-brand{padding:24px 20px 18px;border-bottom:1px solid var(--border)}
.sb-ey{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.14em;margin-bottom:6px;font-family:var(--font-mono)}
.sb-name{font-family:var(--font-heading);font-size:19px;color:var(--text);display:flex;align-items:center;gap:7px}
.sb-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);flex-shrink:0;box-shadow:0 0 8px rgba(var(--accent-rgb),.6)}
.sb-nav{padding:12px 0;flex:1}
.sb-sec{padding:8px 20px 3px;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.12em;font-family:var(--font-mono)}
.nav-link{display:flex;align-items:center;gap:9px;padding:8px 20px;color:var(--text-secondary);text-decoration:none;font-size:13px;border-left:2px solid transparent;transition:all .18s var(--ease)}
.nav-link:hover{color:var(--text);background:var(--surface2);border-left-color:var(--border-strong)}
.nav-link.active{color:var(--accent);background:rgba(var(--accent-rgb),.08);border-left-color:var(--accent);font-weight:500}
.nn{font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px}
.nav-link.active .nn{color:var(--accent)}
.sb-foot{padding:14px 20px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted);font-family:var(--font-mono);line-height:1.9}
.sb-foot .ac{color:var(--accent)}
.content{margin-left:var(--sidebar-w);flex:1}
.hero{padding:72px 56px 64px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,var(--bg) 0%,var(--surface) 60%);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-80px;right:-80px;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle,rgba(var(--accent-rgb),.07) 0%,transparent 70%);pointer-events:none}
.h-ey{font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.16em;margin-bottom:16px;display:flex;align-items:center;gap:12px;font-family:var(--font-mono)}
.h-ey::after{content:'';width:48px;height:1px;background:var(--accent);opacity:.5}
.h-title{font-family:var(--font-heading);font-size:clamp(48px,7vw,88px);color:var(--text);line-height:1;letter-spacing:-.025em;margin-bottom:16px}
.h-desc{font-size:16px;color:var(--text-secondary);max-width:520px;margin-bottom:40px;line-height:1.75}
.h-sw{display:flex;gap:9px;flex-wrap:wrap}
.sw{width:42px;height:42px;border-radius:var(--radius-md);border:1px solid rgba(255,255,255,.09);cursor:pointer;transition:transform .2s var(--ease-spring),box-shadow .2s var(--ease)}
.sw:hover{transform:scale(1.18) translateY(-3px);box-shadow:var(--shadow-md)}
.ds-section{padding:64px 56px;border-bottom:1px solid var(--border)}
.ds-section:nth-child(even){background:var(--surface)}
.sec-hdr{margin-bottom:44px}
.sec-n{font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.16em;font-family:var(--font-mono);margin-bottom:9px;display:block}
.sec-t{font-family:var(--font-heading);font-size:clamp(32px,4vw,48px);color:var(--text);line-height:1.1;letter-spacing:-.02em}
.sec-d{font-size:15px;color:var(--text-secondary);margin-top:9px;max-width:460px;line-height:1.75}
.cg-title{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-mono);margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.cg-title:first-of-type{margin-top:0}
.c-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:11px}
.c-card{border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border);cursor:pointer;transition:transform .2s var(--ease-spring),box-shadow .2s var(--ease)}
.c-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.c-sw{height:100px}
.c-info{padding:10px 12px;background:var(--surface2)}
.c-name{font-size:13px;color:var(--text);font-weight:500;margin-bottom:2px}
.c-hex{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)}
.c-role{font-size:10px;color:var(--text-muted);margin-top:2px;font-family:var(--font-mono)}
.tfr{display:flex;align-items:center;gap:12px;font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.12em;font-family:var(--font-mono);margin-bottom:18px}
.tfr::after{content:'';flex:1;height:1px;background:var(--border)}
.t-big{font-family:var(--font-heading);font-size:clamp(64px,10vw,120px);line-height:1;color:var(--text);letter-spacing:-.03em;margin-bottom:8px}
.t-big.ib{font-family:var(--font-body);font-weight:400}
.t-meta{font-size:12px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:36px}
.t-scale{border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:40px}
.t-row{display:grid;grid-template-columns:56px 1fr 72px;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border);transition:background .15s}
.t-row:last-child{border-bottom:none}
.t-row:hover{background:var(--surface2)}
.tl{font-family:var(--font-mono);font-size:10px;color:var(--text-muted)}
.tt{color:var(--text);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tsz{font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-align:right}
.w-row{display:flex;gap:11px;flex-wrap:wrap}
.w-card{flex:1;min-width:80px;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);text-align:center}
.w-s{font-size:30px;color:var(--text);display:block;margin-bottom:5px}
.w-l{font-size:10px;color:var(--text-muted);font-family:var(--font-mono)}
.sp-list{display:flex;flex-direction:column;gap:5px}
.sp-row{display:flex;align-items:center;gap:14px;padding:3px 0}
.sp-lbl{font-family:var(--font-mono);font-size:11px;color:var(--text-muted);width:68px;flex-shrink:0}
.sp-bar{height:20px;background:linear-gradient(90deg,var(--accent),var(--accent-dark));border-radius:3px;opacity:.65;min-width:4px;transition:opacity .15s}
.sp-row:hover .sp-bar{opacity:1}
.sp-v{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)}
.r-grid{display:flex;gap:22px;flex-wrap:wrap;align-items:flex-end}
.r-card{display:flex;flex-direction:column;align-items:center;gap:10px}
.r-shape{width:72px;height:72px;background:linear-gradient(135deg,var(--surface3),var(--surface2));border:2px solid var(--border-strong);transition:border-color .2s}
.r-card:hover .r-shape{border-color:var(--accent)}
.r-n{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)}
.r-v{font-family:var(--font-mono);font-size:10px;color:var(--text-muted)}
.sh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:18px}
.sh-card{padding:26px 18px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-lg);text-align:center;transition:transform .2s var(--ease-spring)}
.sh-card:hover{transform:translateY(-3px)}
.sh-l{font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-mono);display:block;margin-bottom:7px}
.sh-v{font-size:10px;color:var(--text-muted);font-family:var(--font-mono);line-height:1.6;word-break:break-all}
.cmp-g{margin-bottom:44px}
.cmp-g:last-child{margin-bottom:0}
.cmp-gt{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-mono);margin-bottom:18px;display:flex;align-items:center;gap:12px}
.cmp-gt::after{content:'';flex:1;height:1px;background:var(--border)}
.btn-row{display:flex;gap:11px;flex-wrap:wrap;align-items:center}
.bp{background:var(--accent);color:#000;border:none;border-radius:var(--radius-md);padding:11px 22px;font-size:14px;font-weight:600;font-family:var(--font-body);cursor:pointer;transition:all .2s var(--ease)}
.bp:hover{background:var(--accent-light);box-shadow:var(--shadow-glow);transform:translateY(-2px)}
.bs{background:transparent;color:var(--accent);border:1.5px solid var(--accent);border-radius:var(--radius-md);padding:10px 22px;font-size:14px;font-weight:500;font-family:var(--font-body);cursor:pointer;transition:all .2s var(--ease)}
.bs:hover{background:rgba(var(--accent-rgb),.1);box-shadow:var(--shadow-glow);transform:translateY(-2px)}
.bg{background:transparent;color:var(--text-secondary);border:1px solid var(--border);border-radius:var(--radius-md);padding:11px 22px;font-size:14px;font-family:var(--font-body);cursor:pointer;transition:all .2s var(--ease)}
.bg:hover{color:var(--text);border-color:var(--border-strong);background:var(--surface2)}
.badge-row{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:500}
.ba{background:rgba(var(--accent-rgb),.14);color:var(--accent);border:1px solid rgba(var(--accent-rgb),.28)}
.bok{background:rgba(34,197,94,.1);color:var(--success);border:1px solid rgba(34,197,94,.22)}
.ber{background:rgba(239,68,68,.1);color:var(--error);border:1px solid rgba(239,68,68,.22)}
.bn{background:var(--surface3);color:var(--text-secondary);border:1px solid var(--border)}
.i-demo{display:flex;flex-direction:column;gap:11px;max-width:400px}
.dsi{background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-md);padding:11px 15px;font-size:14px;color:var(--text);font-family:var(--font-body);width:100%;transition:all .2s var(--ease);outline:none}
.dsi:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.14)}
.dsi::placeholder{color:var(--text-muted)}
.ca-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.ds-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-xl);padding:22px;transition:all .2s var(--ease-spring);cursor:default}
.ds-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-3px);border-color:var(--border-strong)}
.ds-card.ft{border-color:rgba(var(--accent-rgb),.4);box-shadow:var(--shadow-glow)}
.ci{width:42px;height:42px;border-radius:var(--radius-md);background:rgba(var(--accent-rgb),.1);border:1px solid rgba(var(--accent-rgb),.2);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:19px;margin-bottom:14px}
.ct{font-family:var(--font-heading);font-size:19px;color:var(--text);margin-bottom:7px;line-height:1.2}
.cb{font-size:14px;color:var(--text-secondary);line-height:1.65;margin-bottom:12px}
.tok-wrap{position:relative}
.cpbtn{position:absolute;top:14px;right:14px;background:var(--surface3);color:var(--text-secondary);border:1px solid var(--border);border-radius:4px;padding:5px 12px;font-size:11px;font-family:var(--font-mono);cursor:pointer;transition:all .18s var(--ease);z-index:2}
.cpbtn:hover{color:var(--accent);border-color:var(--accent)}
.tok-code{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px 28px;font-family:var(--font-mono);font-size:13px;color:var(--text-secondary);line-height:1.9;overflow-x:auto;white-space:pre;max-height:520px;overflow-y:auto}
.toast{position:fixed;bottom:24px;left:calc(var(--sidebar-w) + 24px);background:var(--surface3);border:1px solid var(--border-strong);color:var(--text);padding:9px 16px;border-radius:9999px;font-size:13px;font-family:var(--font-mono);box-shadow:var(--shadow-xl);opacity:0;transform:translateY(12px);transition:all .28s var(--ease-spring);pointer-events:none;z-index:200;display:flex;align-items:center;gap:7px}
.toast.show{opacity:1;transform:translateY(0)}
.td{width:6px;height:6px;border-radius:50%;background:var(--success);flex-shrink:0}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
/* ── LP Preview Skeletons ─── */
@keyframes sk-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
.sk-block{background:linear-gradient(90deg,var(--surface3) 25%,var(--surface2) 50%,var(--surface3) 75%);background-size:1200px 100%;animation:sk-shimmer 1.6s ease-in-out infinite;border-radius:var(--radius-md)}
.sk-h48{height:48px}.sk-h80{height:80px}.sk-h120{height:120px}.sk-h200{height:200px}.sk-h300{height:300px}.sk-h400{height:400px}.sk-avatar{width:36px;height:36px;border-radius:50%!important}.sk-bon-thumb{width:64px;height:64px;border-radius:var(--radius-md);flex-shrink:0}
/* ── LP Preview Styles ─── */
.lp-wrap{font-family:var(--font-body);background:var(--bg);color:var(--text)}
.lp-s{padding:80px 5%;max-width:1200px;margin:0 auto}
.lp-ey{font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.16em;font-family:var(--font-mono);margin-bottom:12px;display:block}
.lp-h1{font-family:var(--font-heading);font-size:clamp(40px,7vw,80px);line-height:1.05;letter-spacing:-.025em;margin-bottom:20px}
.lp-h2{font-family:var(--font-heading);font-size:clamp(28px,4vw,48px);line-height:1.1;letter-spacing:-.02em;margin-bottom:16px}
.lp-h3{font-family:var(--font-heading);font-size:clamp(20px,2.5vw,28px);line-height:1.2;margin-bottom:10px}
.lp-sub{font-size:18px;color:var(--text-secondary);line-height:1.75;max-width:600px;margin-bottom:32px}
.lp-cta{display:inline-flex;align-items:center;gap:10px;background:var(--accent);color:#000;font-weight:700;font-size:16px;padding:16px 36px;border-radius:var(--radius-md);border:none;cursor:pointer;text-decoration:none;transition:all .2s}
.lp-cta:hover{background:var(--accent-light);box-shadow:0 0 32px rgba(var(--accent-rgb),.35);transform:translateY(-2px)}
.lp-cta-ghost{display:inline-flex;align-items:center;gap:10px;background:transparent;color:var(--accent);font-weight:600;font-size:16px;padding:15px 32px;border-radius:var(--radius-md);border:1.5px solid var(--accent);cursor:pointer;text-decoration:none;transition:all .2s}
.lp-btn-row{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:8px}
.lp-nav{background:var(--surface);border-bottom:1px solid var(--border);padding:16px 5%;display:flex;align-items:center;gap:32px;position:sticky;top:0;z-index:50}
.lp-logo{font-family:var(--font-heading);font-size:22px;color:var(--text);font-weight:700;flex:1}
.lp-nav-links{display:flex;gap:24px}
.lp-nav-links a{color:var(--text-secondary);text-decoration:none;font-size:14px;transition:color .15s}
.lp-nav-links a:hover{color:var(--text)}
.lp-hero{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;padding:100px 5%;max-width:1200px;margin:0 auto}
.lp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px}
.lp-metric{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-xl);padding:28px 24px;text-align:center}
.lp-metric-n{font-family:var(--font-heading);font-size:48px;color:var(--accent);line-height:1;margin-bottom:6px}
.lp-metric-l{font-size:14px;color:var(--text-secondary)}
.lp-ben-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:40px}
.lp-ben{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-xl);padding:28px}
.lp-ben-icon{width:48px;height:48px;border-radius:var(--radius-md);background:rgba(var(--accent-rgb),.1);border:1px solid rgba(var(--accent-rgb),.2);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:22px;margin-bottom:16px}
.lp-quote-wrap{max-width:800px;margin:0 auto;text-align:center;padding:80px 5%}
.lp-quote-text{font-family:var(--font-heading);font-size:clamp(22px,3.5vw,38px);line-height:1.35;color:var(--text);margin-bottom:24px}
.lp-quote-author{font-size:14px;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:.12em}
.lp-desafio{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start}
.lp-list{display:flex;flex-direction:column;gap:14px;margin-top:16px}
.lp-li{display:flex;gap:12px;align-items:flex-start;font-size:15px;color:var(--text-secondary);line-height:1.65}
.lp-dot{width:20px;height:20px;border-radius:50%;background:rgba(var(--accent-rgb),.08);border:1px solid rgba(var(--accent-rgb),.2);color:var(--accent);font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.lp-dot-ok{background:rgba(var(--accent-rgb),.15);border-color:var(--accent)}
.lp-mod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:32px}
.lp-mod{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 24px;display:flex;gap:16px;align-items:flex-start}
.lp-mod-n{font-family:var(--font-mono);font-size:11px;color:var(--accent);width:28px;flex-shrink:0;padding-top:2px}
.lp-dep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-top:40px}
.lp-dep{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-xl);padding:24px}
.lp-dep-text{font-size:15px;color:var(--text-secondary);line-height:1.7;margin-bottom:16px}
.lp-dep-author{display:flex;align-items:center;gap:10px}
.lp-dep-name{font-size:14px;color:var(--text);font-weight:500}
.lp-dep-role{font-size:12px;color:var(--text-muted)}
.lp-bon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;margin-top:40px}
.lp-bon{background:var(--surface2);border:1px solid rgba(var(--accent-rgb),.2);border-radius:var(--radius-xl);padding:24px;display:flex;gap:16px;align-items:flex-start}
.lp-preco-box{background:var(--surface2);border:1px solid rgba(var(--accent-rgb),.35);border-radius:var(--radius-xl);padding:40px;text-align:center;box-shadow:0 0 48px rgba(var(--accent-rgb),.1);max-width:480px;margin:40px auto 0}
.lp-price-de{font-size:18px;color:var(--text-muted);text-decoration:line-through;margin-bottom:4px}
.lp-price-por{font-family:var(--font-heading);font-size:64px;color:var(--accent);line-height:1}
.lp-price-par{font-size:14px;color:var(--text-secondary);margin-top:6px;margin-bottom:24px}
.lp-gar{max-width:600px;margin:0 auto;text-align:center}
.lp-gar-badge{width:80px;height:80px;border-radius:50%;background:rgba(var(--accent-rgb),.1);border:2px solid rgba(var(--accent-rgb),.3);display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 20px}
.lp-faq{max-width:700px;margin:40px auto 0;display:flex;flex-direction:column;gap:12px}
.lp-faq-item{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 24px}
.lp-faq-q{font-size:15px;color:var(--text);font-weight:500;margin-bottom:8px}
.lp-faq-a{font-size:14px;color:var(--text-secondary);line-height:1.7}
.lp-footer{background:var(--surface);border-top:1px solid var(--border);padding:48px 5%;text-align:center}
.lp-footer-logo{font-family:var(--font-heading);font-size:24px;color:var(--text);margin-bottom:16px}
.lp-footer-links{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
.lp-footer-links a{color:var(--text-muted);text-decoration:none;font-size:13px;transition:color .15s}
.lp-footer-links a:hover{color:var(--accent)}
.lp-footer-copy{font-size:12px;color:var(--text-muted)}
</style>
</head>
<body>
<aside class="sidebar">
  <div class="sb-brand">
    <div class="sb-ey">Design System</div>
    <div class="sb-name"><span class="sb-dot"></span>${theme.name}</div>
  </div>
  <nav class="sb-nav">
    <div class="sb-sec">Documentação</div>
    <a href="#cores" class="nav-link" data-s="cores"><span class="nn">01</span>Cores</a>
    <a href="#tipografia" class="nav-link" data-s="tipografia"><span class="nn">02</span>Tipografia</a>
    <a href="#espacamento" class="nav-link" data-s="espacamento"><span class="nn">03</span>Espaçamento</a>
    <a href="#radius" class="nav-link" data-s="radius"><span class="nn">04</span>Border Radius</a>
    <a href="#sombras" class="nav-link" data-s="sombras"><span class="nn">05</span>Sombras</a>
    <a href="#componentes" class="nav-link" data-s="componentes"><span class="nn">06</span>Componentes</a>
    <a href="#tokens" class="nav-link" data-s="tokens"><span class="nn">—</span>Tokens CSS</a>
    <div class="sb-sec" style="margin-top:8px">Preview</div>
    <a href="#lp-preview" class="nav-link" data-s="lp-preview"><span class="nn">LP</span>Landing Page</a>
  </nav>
  <div class="sb-foot">
    <div>${theme.name}</div>
    <div>${new Date(theme.createdAt).toLocaleDateString('pt-BR')}</div>
    ${personality ? `<div class="ac">${personality}</div>` : ''}
  </div>
</aside>
<main class="content">
  <section class="hero">
    <div class="h-ey">Design System Documentation</div>
    <h1 class="h-title">${theme.name}</h1>
    <p class="h-desc">${description || 'Sistema de design extraído e documentado.'}</p>
    <div class="h-sw" id="heroSw"></div>
  </section>

  <section class="ds-section" id="cores">
    <div class="sec-hdr"><span class="sec-n">01 — Cores</span><h2 class="sec-t">Paleta de Cores</h2><p class="sec-d">Os tokens de cor que definem a identidade visual.</p></div>
    <div class="cg-title">Backgrounds & Surfaces</div>
    <div class="c-grid">
      ${[['Background','bg',bg,'--bg'],['Surface','surface',surface,'--surface'],['Surface 2','surface2',surface2,'--surface2'],['Surface 3','surface3',surface3,'--surface3'],['Border','border',border,'--border']].map(([n,k,v,r])=>`<div class="c-card" onclick="cp('${v}')"><div class="c-sw" style="background:${v}"></div><div class="c-info"><div class="c-name">${n}</div><div class="c-hex">${v}</div><div class="c-role">${r}</div></div></div>`).join('')}
    </div>
    <div class="cg-title">Text</div>
    <div class="c-grid">
      ${[['Text','text',text,'--text'],['Text Secondary','textSec',textSec,'--text-secondary'],['Text Muted','textMuted',textMuted,'--text-muted']].map(([n,k,v,r])=>`<div class="c-card" onclick="cp('${v}')"><div class="c-sw" style="background:${v}"></div><div class="c-info"><div class="c-name">${n}</div><div class="c-hex">${v}</div><div class="c-role">${r}</div></div></div>`).join('')}
    </div>
    <div class="cg-title">Accent & Brand</div>
    <div class="c-grid">
      ${[['Accent','accent',accent,'--accent'],['Accent Light','accentLight',accentLight,'--accent-light'],['Accent Dark','accentDark',accentDark,'--accent-dark']].map(([n,k,v,r])=>`<div class="c-card" onclick="cp('${v}')"><div class="c-sw" style="background:${v}"></div><div class="c-info"><div class="c-name">${n}</div><div class="c-hex">${v}</div><div class="c-role">${r}</div></div></div>`).join('')}
    </div>
    <div class="cg-title">Semantic</div>
    <div class="c-grid">
      ${[['Success','success',success,'--success'],['Warning','warning',warning,'--warning'],['Error','error',error,'--error']].map(([n,k,v,r])=>`<div class="c-card" onclick="cp('${v}')"><div class="c-sw" style="background:${v}"></div><div class="c-info"><div class="c-name">${n}</div><div class="c-hex">${v}</div><div class="c-role">${r}</div></div></div>`).join('')}
    </div>
  </section>

  <section class="ds-section" id="tipografia">
    <div class="sec-hdr"><span class="sec-n">02 — Tipografia</span><h2 class="sec-t">Type System</h2><p class="sec-d">Fontes, escala e hierarquia tipográfica.</p></div>
    <div class="tfr">Heading — ${fontHeading.split(',')[0].replace(/['"]/g,'')}</div>
    <div class="t-big">Aa</div><div class="t-meta">${fontHeading} · Títulos, destaques</div>
    <div class="tfr">Body — ${fontBody.split(',')[0].replace(/['"]/g,'')}</div>
    <div class="t-big ib">Aa</div><div class="t-meta">${fontBody} · Corpo, UI, labels</div>
    <div class="tfr" style="margin-top:36px">Escala Tipográfica</div>
    <div class="t-scale">
      <div class="t-row"><span class="tl">7xl</span><span class="tt" style="font-family:var(--font-heading);font-size:clamp(36px,7vw,72px);line-height:1">Display</span><span class="tsz">80px</span></div>
      <div class="t-row"><span class="tl">5xl</span><span class="tt" style="font-family:var(--font-heading);font-size:clamp(28px,4vw,48px);line-height:1.1">Heading 1</span><span class="tsz">48px</span></div>
      <div class="t-row"><span class="tl">4xl</span><span class="tt" style="font-size:36px;line-height:1.2">Heading 2</span><span class="tsz">36px</span></div>
      <div class="t-row"><span class="tl">3xl</span><span class="tt" style="font-size:28px">Heading 3</span><span class="tsz">28px</span></div>
      <div class="t-row"><span class="tl">xl</span><span class="tt" style="font-size:20px">Subtitle</span><span class="tsz">20px</span></div>
      <div class="t-row"><span class="tl">base</span><span class="tt" style="font-size:16px">Body text — experiência de leitura padrão.</span><span class="tsz">16px</span></div>
      <div class="t-row"><span class="tl">sm</span><span class="tt" style="font-size:14px;color:var(--text-secondary)">Small — labels, captions e suporte.</span><span class="tsz">14px</span></div>
      <div class="t-row"><span class="tl">xs</span><span class="tt" style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-muted);font-family:var(--font-mono)">EYEBROW / TAG / META</span><span class="tsz">11px</span></div>
    </div>
    <div class="tfr">Font Weights</div>
    <div class="w-row">
      ${[300,400,500,600,700].map(w=>`<div class="w-card"><span class="w-s" style="font-weight:${w}">Ag</span><span class="w-l">${w}</span></div>`).join('')}
    </div>
  </section>

  <section class="ds-section" id="espacamento">
    <div class="sec-hdr"><span class="sec-n">03 — Espaçamento</span><h2 class="sec-t">Spacing Scale</h2><p class="sec-d">Grid de 4px/8px que governa o espaçamento do sistema.</p></div>
    <div class="sp-list">
      ${[[4,'space-1'],[8,'space-2'],[12,'space-3'],[16,'space-4'],[24,'space-6'],[32,'space-8'],[40,'space-10'],[48,'space-12'],[64,'space-16'],[80,'space-20'],[96,'space-24']].map(([v,l])=>`<div class="sp-row"><span class="sp-lbl">${l}</span><div class="sp-bar" style="width:${v}px"></div><span class="sp-v">${v}px</span></div>`).join('')}
    </div>
  </section>

  <section class="ds-section" id="radius">
    <div class="sec-hdr"><span class="sec-n">04 — Border Radius</span><h2 class="sec-t">Rounding Scale</h2><p class="sec-d">Raios de borda que definem a personalidade geométrica.</p></div>
    <div class="r-grid">
      <div class="r-card"><div class="r-shape" style="border-radius:0"></div><div class="r-n">none</div><div class="r-v">0px</div></div>
      <div class="r-card"><div class="r-shape" style="border-radius:4px"></div><div class="r-n">sm</div><div class="r-v">4px</div></div>
      <div class="r-card"><div class="r-shape" style="border-radius:var(--radius-md)"></div><div class="r-n">md</div><div class="r-v">${radiusMd}</div></div>
      <div class="r-card"><div class="r-shape" style="border-radius:var(--radius-lg)"></div><div class="r-n">lg</div><div class="r-v">${radiusLg}</div></div>
      <div class="r-card"><div class="r-shape" style="border-radius:var(--radius-xl)"></div><div class="r-n">xl</div><div class="r-v">${radiusXl}</div></div>
      <div class="r-card"><div class="r-shape" style="border-radius:9999px;height:40px"></div><div class="r-n">full</div><div class="r-v">9999px</div></div>
    </div>
  </section>

  <section class="ds-section" id="sombras">
    <div class="sec-hdr"><span class="sec-n">05 — Sombras</span><h2 class="sec-t">Shadow Scale</h2><p class="sec-d">Sistema de elevação e profundidade.</p></div>
    <div class="sh-grid">
      ${[['XS',shadowXs],['SM',shadowSm],['MD',shadowMd],['LG',shadowLg],['XL',shadowXl],['Glow','var(--shadow-glow)']].map(([l,v])=>`<div class="sh-card" style="box-shadow:${v}${l==='Glow'?';border-color:rgba('+accentRgb+',.3)':''}"><span class="sh-l">${l}</span><div class="sh-v">${v.length>60?v.slice(0,60)+'…':v}</div></div>`).join('')}
    </div>
  </section>

  <section class="ds-section" id="componentes">
    <div class="sec-hdr"><span class="sec-n">06 — Componentes</span><h2 class="sec-t">Component Library</h2><p class="sec-d">Os átomos e moléculas do sistema em ação.</p></div>
    <div class="cmp-g"><div class="cmp-gt">Buttons</div><div class="btn-row"><button class="bp">Primary</button><button class="bs">Secondary</button><button class="bg">Ghost</button></div></div>
    <div class="cmp-g"><div class="cmp-gt">Badges</div><div class="badge-row"><span class="badge ba">✦ Accent</span><span class="badge bok">✓ Success</span><span class="badge ber">✗ Error</span><span class="badge bn">Neutral</span></div></div>
    <div class="cmp-g"><div class="cmp-gt">Inputs</div><div class="i-demo"><input class="dsi" type="text" placeholder="Input padrão — clique para focar"><input class="dsi" type="email" placeholder="email@exemplo.com"></div></div>
    <div class="cmp-g"><div class="cmp-gt">Cards</div><div class="ca-grid"><div class="ds-card"><div class="ci">✦</div><div class="ct">Card Padrão</div><div class="cb">Componente base. Hover para elevação.</div><span class="badge bn">Default</span></div><div class="ds-card ft"><div class="ci">★</div><div class="ct">Card Destaque</div><div class="cb">Borda accent e glow para elementos em destaque.</div><span class="badge ba">Featured</span></div><div class="ds-card"><div class="ci">◆</div><div class="ct">Card Ação</div><div class="cb">Cards com CTAs seguem este padrão.</div><button class="bp" style="margin-top:4px;font-size:13px;padding:8px 16px">Ação →</button></div></div></div>
  </section>

  <section class="ds-section" id="tokens">
    <div class="sec-hdr"><span class="sec-n">Tokens Completo</span><h2 class="sec-t">CSS Variables</h2><p class="sec-d">Todas as variáveis CSS para importação direta.</p></div>
    <div class="tok-wrap"><button class="cpbtn" onclick="copyTok()">Copiar :root</button><pre class="tok-code" id="tokBlock">${cssVars.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>
  </section>

  <!-- LP Preview -->
  <section class="ds-section" id="lp-preview" style="padding:0;background:var(--bg);border-bottom:none">
    <div style="padding:32px 56px 24px;border-bottom:1px solid var(--border);background:var(--surface)">
      <span class="sec-n">LP — Landing Page Demonstrativa</span>
      <h2 class="sec-t">Como o tema fica no LP Builder</h2>
      <p class="sec-d">Visualização completa das 20 seções com cores, tipografia e espaçamentos deste design system.</p>
    </div>
    <div class="lp-wrap">

      <!-- s01 navbar -->
      <nav class="lp-nav">
        <div class="lp-logo">${theme.name}</div>
        <div class="lp-nav-links">
          <a href="#">Conteúdo</a>
          <a href="#">Bônus</a>
          <a href="#">Depoimentos</a>
          <a href="#">Preço</a>
        </div>
        <a href="#" class="lp-cta" style="padding:10px 24px;font-size:14px">Quero Agora</a>
      </nav>

      <!-- s02 hero -->
      <div style="background:linear-gradient(135deg,var(--bg) 0%,var(--surface) 100%);border-bottom:1px solid var(--border)">
        <div class="lp-hero">
          <div>
            <span class="lp-ey">✦ Lançamento Especial</span>
            <h1 class="lp-h1">Transforme Seu Esforço em <span style="color:var(--accent)">Resultados Reais</span></h1>
            <p class="lp-sub">Descubra o método completo que já ajudou mais de 10.000 pessoas a atingirem seus objetivos com clareza e consistência.</p>
            <div class="lp-btn-row">
              <a href="#" class="lp-cta">Quero Acesso Agora →</a>
              <a href="#" class="lp-cta-ghost">Ver Conteúdo</a>
            </div>
          </div>
          <div style="border-radius:var(--radius-xl);overflow:hidden">
            <div class="sk-block sk-h400"></div>
          </div>
        </div>
      </div>

      <!-- s03 metrics -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <div class="lp-metrics">
            <div class="lp-metric"><div class="lp-metric-n">10k+</div><div class="lp-metric-l">Alunos Transformados</div></div>
            <div class="lp-metric"><div class="lp-metric-n">97%</div><div class="lp-metric-l">Taxa de Satisfação</div></div>
            <div class="lp-metric"><div class="lp-metric-n">4.9</div><div class="lp-metric-l">Avaliação Média</div></div>
            <div class="lp-metric"><div class="lp-metric-n">30d</div><div class="lp-metric-l">Garantia Total</div></div>
          </div>
        </div>
      </div>

      <!-- s04 benefits -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Benefícios</span>
          <h2 class="lp-h2">O Que Você Vai Conquistar</h2>
          <div class="lp-ben-grid">
            <div class="lp-ben"><div class="lp-ben-icon">◆</div><h3 class="lp-h3">Clareza Total</h3><p style="font-size:14px;color:var(--text-secondary);line-height:1.7">Entenda exatamente o que fazer em cada etapa do processo sem se perder.</p></div>
            <div class="lp-ben"><div class="lp-ben-icon">✦</div><h3 class="lp-h3">Método Comprovado</h3><p style="font-size:14px;color:var(--text-secondary);line-height:1.7">Sistema validado com milhares de casos de sucesso documentados e mensurados.</p></div>
            <div class="lp-ben"><div class="lp-ben-icon">▲</div><h3 class="lp-h3">Suporte Completo</h3><p style="font-size:14px;color:var(--text-secondary);line-height:1.7">Acompanhamento em cada fase para garantir que você chegue ao resultado.</p></div>
          </div>
        </div>
      </div>

      <!-- s05 amostra -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Prévia do Conteúdo</span>
          <h2 class="lp-h2">Veja o Que Está Esperando por Você</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-top:32px">
            <div class="sk-block sk-h200"></div>
            <div class="sk-block sk-h200"></div>
            <div class="sk-block sk-h200"></div>
            <div class="sk-block sk-h200"></div>
          </div>
        </div>
      </div>

      <!-- s06 quote1 -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-quote-wrap">
          <div class="lp-quote-text">"Este programa mudou completamente a forma como eu enxergo meu potencial. Os resultados foram além de tudo que eu esperava."</div>
          <div class="lp-quote-author">— Maria Silva, Empreendedora</div>
        </div>
      </div>

      <!-- s07 desafio -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <div class="lp-desafio">
            <div>
              <span class="lp-ey">O Problema</span>
              <h2 class="lp-h2">Você Sente Que Está Travado?</h2>
              <div class="lp-list">
                <div class="lp-li"><div class="lp-dot">✗</div><span>Tentou vários métodos mas nenhum trouxe resultado consistente</span></div>
                <div class="lp-li"><div class="lp-dot">✗</div><span>Não sabe por onde começar ou qual caminho seguir</span></div>
                <div class="lp-li"><div class="lp-dot">✗</div><span>Falta de clareza e direção para alcançar seus objetivos</span></div>
                <div class="lp-li"><div class="lp-dot">✗</div><span>Procrastina e não mantém constância na execução</span></div>
              </div>
            </div>
            <div>
              <span class="lp-ey">A Solução</span>
              <h2 class="lp-h2">O Método Que Realmente Funciona</h2>
              <div class="lp-list">
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Sistema passo a passo com clareza total em cada etapa</span></div>
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Estratégia validada com mais de 10 mil casos de sucesso</span></div>
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Ferramentas prontas para implementar imediatamente</span></div>
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Suporte e acompanhamento garantido até o resultado</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- s08 showcase -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Showcase</span>
          <h2 class="lp-h2">Dentro do Programa</h2>
          <div class="sk-block sk-h300" style="margin-top:32px"></div>
        </div>
      </div>

      <!-- s09 conteúdo -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Conteúdo Completo</span>
          <h2 class="lp-h2">O Que Você Vai Aprender</h2>
          <div class="lp-mod-grid">
            <div class="lp-mod"><span class="lp-mod-n">M01</span><div><div style="font-size:15px;color:var(--text);font-weight:500;margin-bottom:4px">Fundamentos do Método</div><div style="font-size:13px;color:var(--text-secondary)">Base estratégica para resultados sólidos desde o início.</div></div></div>
            <div class="lp-mod"><span class="lp-mod-n">M02</span><div><div style="font-size:15px;color:var(--text);font-weight:500;margin-bottom:4px">Diagnóstico e Clareza</div><div style="font-size:13px;color:var(--text-secondary)">Identificação do ponto atual e definição do destino.</div></div></div>
            <div class="lp-mod"><span class="lp-mod-n">M03</span><div><div style="font-size:15px;color:var(--text);font-weight:500;margin-bottom:4px">Planejamento Estratégico</div><div style="font-size:13px;color:var(--text-secondary)">Montagem do plano de ação personalizado e realista.</div></div></div>
            <div class="lp-mod"><span class="lp-mod-n">M04</span><div><div style="font-size:15px;color:var(--text);font-weight:500;margin-bottom:4px">Execução e Consistência</div><div style="font-size:13px;color:var(--text-secondary)">Técnicas para manter o ritmo e superar obstáculos.</div></div></div>
            <div class="lp-mod"><span class="lp-mod-n">M05</span><div><div style="font-size:15px;color:var(--text);font-weight:500;margin-bottom:4px">Aceleração de Resultados</div><div style="font-size:13px;color:var(--text-secondary)">Alavancagem do progresso para chegar mais rápido.</div></div></div>
            <div class="lp-mod"><span class="lp-mod-n">M06</span><div><div style="font-size:15px;color:var(--text);font-weight:500;margin-bottom:4px">Manutenção e Escala</div><div style="font-size:13px;color:var(--text-secondary)">Como sustentar e ampliar os resultados no longo prazo.</div></div></div>
          </div>
        </div>
      </div>

      <!-- s10 quote2 -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-quote-wrap">
          <div class="lp-quote-text">"Em apenas 30 dias aplicando o método, consegui resultados que não tive em anos tentando sozinho."</div>
          <div class="lp-quote-author">— João Costa, Empresário</div>
        </div>
      </div>

      <!-- s11 para quem -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Para Quem é</span>
          <h2 class="lp-h2">Este Programa é Para Você Se...</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:32px">
            <div>
              <div style="font-size:13px;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-mono);margin-bottom:14px">É para você</div>
              <div class="lp-list">
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Quer resultados rápidos e duradouros na sua área</span></div>
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Está disposto a seguir um método comprovado</span></div>
                <div class="lp-li"><div class="lp-dot lp-dot-ok">✓</div><span>Busca clareza e direção em sua jornada pessoal</span></div>
              </div>
            </div>
            <div>
              <div style="font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-mono);margin-bottom:14px">Não é para você</div>
              <div class="lp-list">
                <div class="lp-li"><div class="lp-dot">✗</div><span>Busca fórmulas mágicas sem esforço real</span></div>
                <div class="lp-li"><div class="lp-dot">✗</div><span>Não quer colocar o método em prática</span></div>
                <div class="lp-li"><div class="lp-dot">✗</div><span>Já está totalmente satisfeito com seus resultados</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- s12 depoimentos -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Depoimentos</span>
          <h2 class="lp-h2">O Que Dizem Nossos Alunos</h2>
          <div class="lp-dep-grid">
            <div class="lp-dep"><p class="lp-dep-text">"Resultado incrível! Em 3 meses consegui triplicar minha renda aplicando o método consistentemente."</p><div class="lp-dep-author"><div class="sk-block sk-avatar"></div><div style="margin-left:2px"><div class="lp-dep-name">Ana Rodrigues</div><div class="lp-dep-role">Designer</div></div></div></div>
            <div class="lp-dep"><p class="lp-dep-text">"O suporte é excepcional. Me senti acompanhado em cada etapa do processo até chegar ao resultado."</p><div class="lp-dep-author"><div class="sk-block sk-avatar"></div><div style="margin-left:2px"><div class="lp-dep-name">Pedro Alves</div><div class="lp-dep-role">Empreendedor</div></div></div></div>
            <div class="lp-dep"><p class="lp-dep-text">"Finalmente um programa que entrega o que promete. Vale cada centavo que investi nessa jornada."</p><div class="lp-dep-author"><div class="sk-block sk-avatar"></div><div style="margin-left:2px"><div class="lp-dep-name">Carla Mendes</div><div class="lp-dep-role">Consultora</div></div></div></div>
          </div>
        </div>
      </div>

      <!-- s13 resumo -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s" style="max-width:700px;margin:0 auto;text-align:center">
          <span class="lp-ey">Resumo</span>
          <h2 class="lp-h2">Tudo Que Você Recebe</h2>
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-xl);padding:32px;margin-top:32px;text-align:left">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text);font-size:15px">✦ Programa Principal Completo</span><span style="color:var(--accent);font-size:13px;font-weight:600">Acesso vitalício</span></div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text);font-size:15px">✦ Bônus Exclusivos</span><span style="color:var(--accent);font-size:13px;font-weight:600">3 materiais complementares</span></div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text);font-size:15px">✦ Comunidade Privada</span><span style="color:var(--accent);font-size:13px;font-weight:600">Suporte contínuo</span></div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0"><span style="color:var(--text);font-size:15px">✦ Atualizações Gratuitas</span><span style="color:var(--accent);font-size:13px;font-weight:600">Para sempre</span></div>
          </div>
        </div>
      </div>

      <!-- s14 bonus -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">Bônus Exclusivos</span>
          <h2 class="lp-h2">Mais 3 Bônus Para Acelerar Seus Resultados</h2>
          <div class="lp-bon-grid">
            <div class="lp-bon"><div class="sk-block sk-bon-thumb"></div><div><div style="font-size:15px;color:var(--accent);font-weight:600;margin-bottom:6px">Bônus 1: Guia Rápido</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6">PDF com os principais atalhos e frameworks do método para consulta rápida.</div></div></div>
            <div class="lp-bon"><div class="sk-block sk-bon-thumb"></div><div><div style="font-size:15px;color:var(--accent);font-weight:600;margin-bottom:6px">Bônus 2: Planilha de Controle</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6">Ferramenta pronta para monitorar seu progresso e mensurar resultados.</div></div></div>
            <div class="lp-bon"><div class="sk-block sk-bon-thumb"></div><div><div style="font-size:15px;color:var(--accent);font-weight:600;margin-bottom:6px">Bônus 3: Masterclass ao Vivo</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6">Sessão exclusiva com acesso à gravação completa para revisitar quando quiser.</div></div></div>
          </div>
        </div>
      </div>

      <!-- s15 preço -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-s" style="text-align:center">
          <span class="lp-ey">Oferta Especial</span>
          <h2 class="lp-h2">Invista no Seu Futuro Hoje</h2>
          <div class="lp-preco-box">
            <div class="lp-price-de">De R$ 997,00</div>
            <div class="lp-price-por">R$ 497</div>
            <div class="lp-price-par">ou 12x de R$ 49,90 sem juros</div>
            <a href="#" class="lp-cta" style="width:100%;justify-content:center">Garantir Minha Vaga →</a>
            <div style="margin-top:16px;font-size:13px;color:var(--text-muted)">🔒 Pagamento seguro · Acesso imediato</div>
          </div>
        </div>
      </div>

      <!-- s16 garantia -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <div class="lp-gar">
            <div class="lp-gar-badge">🛡</div>
            <h2 class="lp-h2">Garantia de 30 Dias</h2>
            <p class="lp-sub" style="margin:0 auto">Se por qualquer motivo você não ficar satisfeito, devolvemos 100% do seu investimento. Sem perguntas, sem burocracia, sem complicação.</p>
          </div>
        </div>
      </div>

      <!-- s17 quote3 -->
      <div style="border-bottom:1px solid var(--border)">
        <div class="lp-quote-wrap">
          <div class="lp-quote-text">"A decisão de investir nesse programa foi a melhor que tomei para minha carreira nos últimos 5 anos."</div>
          <div class="lp-quote-author">— Rafael Lima, Especialista</div>
        </div>
      </div>

      <!-- s18 faq -->
      <div style="background:var(--surface);border-bottom:1px solid var(--border)">
        <div class="lp-s">
          <span class="lp-ey">FAQ</span>
          <h2 class="lp-h2" style="text-align:center">Perguntas Frequentes</h2>
          <div class="lp-faq">
            <div class="lp-faq-item"><div class="lp-faq-q">Quando recebo o acesso?</div><div class="lp-faq-a">Imediatamente após a confirmação do pagamento você recebe o acesso à plataforma por e-mail.</div></div>
            <div class="lp-faq-item"><div class="lp-faq-q">Por quanto tempo tenho acesso?</div><div class="lp-faq-a">O acesso é vitalício. Uma vez dentro, você estuda no seu próprio ritmo, para sempre, sem mensalidade.</div></div>
            <div class="lp-faq-item"><div class="lp-faq-q">Funciona para iniciantes?</div><div class="lp-faq-a">Sim! O programa foi estruturado para atender tanto iniciantes quanto pessoas mais avançadas na jornada.</div></div>
            <div class="lp-faq-item"><div class="lp-faq-q">E se eu não gostar?</div><div class="lp-faq-a">Você tem 30 dias de garantia incondicional. Se não ficar satisfeito por qualquer motivo, devolvemos tudo.</div></div>
          </div>
        </div>
      </div>

      <!-- s19 cta final -->
      <div style="background:linear-gradient(135deg,var(--bg),var(--surface));border-bottom:1px solid var(--border)">
        <div class="lp-s" style="text-align:center">
          <span class="lp-ey">Última Chamada</span>
          <h2 class="lp-h2">Está Pronto Para Transformar Seus Resultados?</h2>
          <p class="lp-sub" style="margin:0 auto 36px">Junte-se a mais de 10.000 pessoas que já transformaram suas vidas com este método comprovado.</p>
          <a href="#" class="lp-cta" style="font-size:18px;padding:20px 52px">Quero Começar Agora →</a>
          <div style="margin-top:20px;font-size:13px;color:var(--text-muted)">✦ Vagas limitadas · Acesso imediato · Garantia de 30 dias</div>
        </div>
      </div>

      <!-- s20 footer -->
      <div class="lp-footer">
        <div class="lp-footer-logo">${theme.name}</div>
        <div class="lp-footer-links">
          <a href="#">Política de Privacidade</a>
          <a href="#">Termos de Uso</a>
          <a href="#">Suporte</a>
          <a href="#">Contato</a>
        </div>
        <div class="lp-footer-copy">© 2025 ${theme.name}. Todos os direitos reservados.</div>
      </div>

    </div>
  </section>

</main>
<div class="toast" id="toast"><span class="td"></span><span id="tm">Copiado!</span></div>
<script>
const secs=document.querySelectorAll('section[id]'),lnks=document.querySelectorAll('.nav-link[data-s]');
secs.forEach(s=>new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){lnks.forEach(l=>l.classList.remove('active'));const a=document.querySelector('.nav-link[data-s="'+x.target.id+'"]');if(a)a.classList.add('active')}})},{rootMargin:'-15% 0px -75% 0px'}).observe(s));
let tt;function toast(m){const e=document.getElementById('toast');document.getElementById('tm').textContent=m||'Copiado!';e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),2200)}
function cp(t){navigator.clipboard.writeText(t).then(()=>toast(t))}
function copyTok(){navigator.clipboard.writeText(document.getElementById('tokBlock').textContent).then(()=>toast('CSS copiado!'))}
[['${bg}','bg'],['${surface}','surface'],['${accent}','accent'],['${accentLight}','accent-light'],['${text}','text'],['${textSec}','secondary']].forEach(([c,l])=>{const d=document.createElement('div');d.className='sw';d.style.background=c;d.title=l+': '+c;d.onclick=()=>cp(c);document.getElementById('heroSw').appendChild(d)});
</script>
</body></html>`;
}

export default function ThemeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [html, setHtml] = useState('');
    const iframeRef = useRef(null);

    useEffect(() => {
        fetchThemes().then(themes => {
            const found = themes.find(t => t.id === id);
            if (found) {
                setTheme(found);
                // Use saved preview_html if it's a full DS page, otherwise build from tokens
                const savedHtml = found.previewHtml || '';
                const isFullDS = savedHtml.includes('id="cores"') || savedHtml.includes('id="tipografia"');
                setHtml(isFullDS ? savedHtml : buildDSPage(found));
            }
            setLoading(false);
        });
    }, [id]);

    if (loading) return (
        <div style={{ padding: '2rem', color: '#fff', fontFamily: 'system-ui' }}>Carregando...</div>
    );

    if (!theme) return (
        <div style={{ padding: '2rem', color: '#fff', fontFamily: 'system-ui' }}>
            Tema não encontrado. <button onClick={() => navigate('/themes')} style={{ color: '#C9A962', background: 'none', border: 'none', cursor: 'pointer' }}>Voltar</button>
        </div>
    );

    return (
        <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', background: '#0f0f12',
                borderBottom: '1px solid #2a2a32', flexShrink: 0, zIndex: 10,
            }}>
                <button
                    onClick={() => navigate('/themes')}
                    style={{ background: 'transparent', border: '1px solid #2a2a32', color: '#9ca3af', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}
                >
                    ← Temas
                </button>
                <span style={{ color: '#6b7280', fontSize: 13 }}>|</span>
                <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>{theme.name}</span>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => {
                        const blob = new Blob([html], { type: 'text/html' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `design-system-${theme.name.toLowerCase().replace(/\s+/g, '-')}.html`;
                        a.click();
                    }}
                    style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                >
                    ⬇ Baixar HTML
                </button>
                <button
                    onClick={() => window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank')}
                    style={{ background: '#4f46e5', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                >
                    ↗ Abrir em nova aba
                </button>
            </div>

            {/* Iframe */}
            <iframe
                ref={iframeRef}
                srcDoc={html}
                style={{ flex: 1, border: 'none', width: '100%' }}
                title={`Design System — ${theme.name}`}
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
    );
}
