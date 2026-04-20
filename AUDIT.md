## DentalScan Discovery Audit

DentalScan presents a clear value proposition and a simple three-step narrative (capture, analyze, claim), which is strong for first-time users. The product framing is persuasive, but the scan journey can become more guided at the moment where users need to produce consistent, clinically useful images.

From a UX perspective, the biggest opportunity is reducing uncertainty during capture. Users need immediate feedback about distance, framing, blur, and lighting before taking each angle. A persistent mouth guide, dynamic quality status, and short angle-specific coaching ("move closer", "hold steady", "tilt up slightly") would likely reduce retakes and abandonment. Progress visibility is already intuitive with the 5-angle concept, but confidence can be improved by confirming why a frame is accepted or rejected.

On mobile, the main technical risks are camera shake, autofocus hunting, exposure swings, and device/browser variability (especially iOS Safari constraints and permission friction). Low-light scenes increase motion blur and noise, which can reduce AI reliability. Front camera mirroring and inconsistent aspect ratios can also impact framing guidance if not normalized.

Recommended mitigations:
- Use lightweight real-time guardrails (face/mouth region centering + scale thresholds) with visual scoring.
- Sample frame sharpness and luminance heuristics before allowing capture.
- Debounce stability checks to avoid flickering feedback.
- Provide graceful fallback messages when camera permissions fail or hardware is limited.
- Keep overlay rendering cheap (CSS/SVG layers) to avoid extra media pipeline overhead.

Overall, the product direction is strong. Improving capture guidance and mobile robustness will directly improve scan quality and downstream AI/claim confidence.
