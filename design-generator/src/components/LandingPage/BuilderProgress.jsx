import React, { useEffect, useState } from 'react';

export default function BuilderProgress({ state }) {
    if (!state.isGenerating) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(12, 12, 14, 0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text)',
            fontFamily: 'var(--font-body)'
        }}>
            <div style={{
                width: '600px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--text)' }}>
                        Moldando a Experiência<span style={{ color: 'var(--accent)' }}>.</span>
                    </h2>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
                        Neurociência e Design System trabalhando em conjunto.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500' }}>
                        <span style={{ color: 'var(--accent)' }}>{state.message || 'Iniciando...'}</span>
                        <span>{state.percentage}%</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--bg)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${state.percentage}%`,
                            height: '100%',
                            background: 'var(--accent)',
                            boxShadow: '0 0 10px var(--accent)',
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                </div>

                {/* Skeletons to show activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
                    <div className="skeleton-pulse" style={{ height: '24px', width: '40%', background: 'var(--border)', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ height: '12px', width: '80%', background: 'var(--border)', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ height: '12px', width: '70%', background: 'var(--border)', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ height: '40px', width: '150px', background: 'var(--border)', borderRadius: '4px', marginTop: '1rem' }}></div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
                .skeleton-pulse {
                    animation: pulse 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
