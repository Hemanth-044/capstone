
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SecurityStatus {
    isDevToolsOpen: boolean;
    isVM: boolean;
    clipboardTampered: boolean;
}

export function useEnvironmentSecurity(onViolation: (type: string, message: string) => void) {
    const [status, setStatus] = useState<SecurityStatus>({
        isDevToolsOpen: false,
        isVM: false,
        clipboardTampered: false,
    });

    // 1. DevTools Detection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'U') // View Source
            ) {
                e.preventDefault();
                onViolation('SECURITY_VIOLATION', 'Attempted to open Developer Tools');
                toast.error('Developer Tools are disabled during the exam.');
            }
        };

        const detectDevTools = () => {
            // Heuristic: Check if window outer width/height specifically matches inner (usually DevTools takes space)
            // This is tricky and prone to false positives, so we rely mainly on key prevention and debugger traps.

            // Debugger Trap: If devtools is open, this debugger statement pauses execution.
            // We can measure the time it takes to execute.
            const start = performance.now();
            // eslint-disable-next-line no-debugger
            // debugger; 
            // Commented out debugger trap for now as it disrupts legitimate testing, 
            // but strictly part of the "Hardening" feature for prod.
            const end = performance.now();

            if (end - start > 100) {
                // Debugger paused execution -> DevTools likely open
                // setStatus(s => ({ ...s, isDevToolsOpen: true }));
                // onViolation('SECURITY_VIOLATION', 'Developer Tools detected (Debugger Pause)');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // const interval = setInterval(detectDevTools, 2000);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            // clearInterval(interval);
        };
    }, [onViolation]);

    // 2. Clipboard & Context Menu Disabling
    useEffect(() => {
        const preventDefault = (e: Event) => e.preventDefault();

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            setStatus(s => ({ ...s, clipboardTampered: true }));
            onViolation('SECURITY_VIOLATION', 'Paste attempt blocked');
            toast.error('Pasting content is prohibited.');
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            toast.error('Copying content is prohibited.');
        };

        window.addEventListener('contextmenu', preventDefault);
        window.addEventListener('paste', handlePaste);
        window.addEventListener('copy', handleCopy);
        window.addEventListener('cut', preventDefault);

        return () => {
            window.removeEventListener('contextmenu', preventDefault);
            window.removeEventListener('paste', handlePaste);
            window.removeEventListener('copy', handleCopy);
            window.removeEventListener('cut', preventDefault);
        };
    }, [onViolation]);

    // 3. VM Detection (Basic Heuristics)
    useEffect(() => {
        const checkVM = () => {
            let score = 0;

            // Check Concurrency (often low in VMs)
            if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) score++;

            // Check Device Memory (often low in VMs)
            // @ts-ignore
            if (navigator.deviceMemory && navigator.deviceMemory < 2) score++;

            // WebGL Renderer check (often reveals virtualization)
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

                        if (renderer.includes('VMware') || renderer.includes('VirtualBox') || renderer.includes('SwiftShader') || renderer.includes('llvmpipe')) {
                            score += 5; // Definite match
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }

            if (score >= 2) {
                setStatus(s => ({ ...s, isVM: true }));
                // Don't autoban, but log it
                // console.warn('Potential VM Detected');
                // onViolation('ENV_WARNING', 'Potential Virtual Machine detected');
            }
        };

        checkVM();
    }, [onViolation]);

    return status;
}
