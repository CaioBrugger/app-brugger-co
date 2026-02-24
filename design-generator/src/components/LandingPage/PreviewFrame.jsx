import { useEffect, useRef } from 'react';

export default function PreviewFrame({ html, viewMode, onSelectSection }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        const handleMessage = (event) => {
            // Check origin if necessary, for now we accept any since it's an iframe we control
            if (event.data && event.data.type === 'SELECT_SECTION' && onSelectSection) {
                onSelectSection(event.data.id);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSelectSection]);

    useEffect(() => {
        if (iframeRef.current && html) {
            const document = iframeRef.current.contentDocument;
            if (document) {
                document.open();
                document.write(html);
                document.close();
            }
        } else if (iframeRef.current && !html) {
            const document = iframeRef.current.contentDocument;
            if (document) {
                document.open();
                document.write(`
                    <div style="
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background-color: #0C0C0E;
                        color: #6B6B75;
                        font-family: 'DM Sans', sans-serif;
                    ">
                        <div style="font-family: 'DM Serif Display', serif; font-size: 32px; color: #3A3A45; margin-bottom: 16px;">
                            Saber Cristão <span style="color: #A88C4A;">Builder</span>
                        </div>
                        <p style="font-size: 16px; letter-spacing: 0.5px;">A renderização da landing page aparecerá aqui.</p>
                    </div>
                `);
                document.close();
            }
        }
    }, [html]);

    const isMobile = viewMode === 'mobile';

    return (
        <div style={{
            width: isMobile ? '375px' : '100%',
            height: isMobile ? '812px' : '100%',
            margin: isMobile ? '0 auto' : '0',
            border: isMobile ? '16px solid #1A1A1F' : 'none',
            borderRadius: isMobile ? '36px' : '0',
            boxShadow: isMobile ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
            overflow: 'hidden',
            backgroundColor: '#0C0C0E',
            transition: 'all 0.3s ease'
        }}>
            <iframe
                ref={iframeRef}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#0C0C0E'
                }}
                title="Landing Page Preview"
            />
        </div>
    );
}
