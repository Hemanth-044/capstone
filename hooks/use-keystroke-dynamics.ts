
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface KeystrokeEvent {
    key: string;
    pressTime: number;
    releaseTime: number;
    dwellTime: number;
    flightTime: number;
}

interface BiometricProfile {
    avgDwellTime: number;
    avgFlightTime: number;
    sampleCount: number;
}

export function useKeystrokeDynamics(enabled: boolean = true) {
    const [status, setStatus] = useState<'Calibrating' | 'Verifying' | 'Mismatch'>('Calibrating');
    const [confidence, setConfidence] = useState(100);

    // Refs for mutable data to avoid re-renders on every keypress
    const activeKeys = useRef<Map<string, number>>(new Map());
    const lastReleaseTime = useRef<number>(0);
    const history = useRef<KeystrokeEvent[]>([]);

    // Baseline Profile
    const baseline = useRef<BiometricProfile>({
        avgDwellTime: 0,
        avgFlightTime: 0,
        sampleCount: 0
    });

    const CALIBRATION_SAMPLES = 30; // Number of keystrokes to build baseline
    const WINDOW_SIZE = 10; // Moving window for verification

    const processKeystroke = useCallback((event: KeystrokeEvent) => {
        history.current.push(event);

        // 1. Calibration Phase
        if (history.current.length <= CALIBRATION_SAMPLES) {
            // Update running average
            const n = baseline.current.sampleCount;
            baseline.current.avgDwellTime = (baseline.current.avgDwellTime * n + event.dwellTime) / (n + 1);
            baseline.current.avgFlightTime = (baseline.current.avgFlightTime * n + event.flightTime) / (n + 1);
            baseline.current.sampleCount++;

            if (history.current.length === CALIBRATION_SAMPLES) {
                setStatus('Verifying');
                console.log('Biometric Baseline Established:', baseline.current);
                toast.success('Typing profile established. Identity verification active.');
            }
            return;
        }

        // 2. Verification Phase
        // Calculate stats for the recent window
        const recent = history.current.slice(-WINDOW_SIZE);
        const recentAvgDwell = recent.reduce((sum, e) => sum + e.dwellTime, 0) / recent.length;
        const recentAvgFlight = recent.reduce((sum, e) => sum + e.flightTime, 0) / recent.length;

        // Compare with baseline (Simple deviation check)
        // Allow 40% deviation (people get tired or speed up)
        const dwellDeviation = Math.abs(recentAvgDwell - baseline.current.avgDwellTime) / baseline.current.avgDwellTime;
        const flightDeviation = Math.abs(recentAvgFlight - baseline.current.avgFlightTime) / baseline.current.avgFlightTime;

        // Heuristic Score
        const anomalyScore = (dwellDeviation + flightDeviation) / 2;

        if (anomalyScore > 0.5) { // Significant deviation
            setStatus('Mismatch');
            setConfidence(Math.max(0, 100 - (anomalyScore * 100)));
            // In a real app, logic would be more complex to avoid false positives from getting tired
        } else {
            setStatus('Verifying');
            setConfidence(100);
        }

    }, []);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            activeKeys.current.set(e.code, performance.now());
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const pressTime = activeKeys.current.get(e.code);
            if (!pressTime) return; // Should not happen

            const releaseTime = performance.now();
            const dwellTime = releaseTime - pressTime;

            // Flight time: Time since LAST key release
            let flightTime = 0;
            if (lastReleaseTime.current > 0) {
                flightTime = pressTime - lastReleaseTime.current;
            }
            lastReleaseTime.current = releaseTime;
            activeKeys.current.delete(e.code);

            // Filter outliers (e.g. extremely long pauses or glitches)
            if (dwellTime < 1000 && flightTime < 2000) {
                processKeystroke({
                    key: e.key,
                    pressTime,
                    releaseTime,
                    dwellTime,
                    flightTime
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [enabled, processKeystroke]);

    return { status, confidence, baseline: baseline.current };
}
