# AegisNav — Hackathon Pitch Deck (Slide Draft)

This document is formatted slide-by-slide to help you build your PPT presentation chronologically.

---

## Slide 1: Title Slide
*   **Title:** AegisNav
*   **Subtitle:** The Intelligent, Safety-First Navigation Platform for Nagpur
*   **Visual Idea:** The AegisNav logo alongside a sleek, dark-mode map showing a bright green "Safe Route".

---

## Slide 2: The Concept & Problem Statement
*   **The Problem:** Traditional navigation apps (like Google Maps) optimize purely for speed. For vulnerable commuters—especially women travelling alone at night—the fastest route is often through unlit, isolated, or high-crime areas.
*   **The Solution:** AegisNav flips this paradigm. We prioritize physical security over speed.
*   **Core Concept:** A proactive routing engine that dynamically steers users away from known crime hotspots and real-time hazard zones, ensuring peace of mind during their commute.

---

## Slide 3: Whole Working (Architecture)
*   **Frontend:** A mobile-first, highly responsive Web App built with React and Vite.
*   **Backend:** A high-performance Python FastAPI server handling complex geometry.
*   **Routing Engine:** Integration with the Open Source Routing Machine (OSRM) to generate road-snapped paths.
*   **The Flow:** 
    1. User selects a destination.
    2. Backend calculates the fastest route and checks for intersections with danger zones.
    3. If dangers exist, the backend calculates safe detour waypoints and re-queries the engine.
    4. The frontend gracefully deduplicates similar routes to present the single "Recommended Best Route".

---

## Slide 4: Map UI & User Experience
*   **Minimalist Design:** Built on React-Leaflet, the map deliberately hides complex danger-zone polygons to avoid overwhelming the user with visual clutter. 
*   **Visual Hierarchy:** The safest route is highlighted with a thick, confident green line, ensuring immediate clarity.
*   **Dynamic Interface:** A modern, swipeable bottom sheet presents route metadata (Distance, ETA, Safety Score) and a granular breakdown of safety factors without obscuring the map.

---

## Slide 5: Route API (The Safety Engine)
*   **Custom Geometry Engine:** The backend `/api/v1/route` endpoint doesn't just ask for a route; it actively manipulates it. We implemented custom Haversine and Ray-Casting algorithms to detect if a route crosses a high-crime polygon.
*   **Dynamic Waypoint Injection:** When a danger zone is detected, the engine mathematically calculates a perpendicular offset waypoint to steer the route away from the danger area's radius.
*   **Smart Deduplication:** If the safe detour and the fastest route end up being the exact same road, the API and UI smartly merge them into one, preventing redundant choices.

---

## Slide 6: Nagpur Crime Division Dashboard (Data Sourcing)
*   **Automated Fetching:** On startup, the backend attempts to asynchronously scrape and parse live polygon data from the `dashboard.nagpurpolice.in` infrastructure.
*   **Static Fallback Resilience:** Because government dashboards employ anti-scraping measures (HTTP 403), the system seamlessly falls back to a highly detailed, pre-loaded dataset mapping critical Nagpur police jurisdictions (e.g., Sitabuldi, Sadar).
*   **Severity Mapping:** Zones are categorized (critical, high, medium, low) to determine the mathematical radius of the detour required.

---

## Slide 7: AegisNet Emergency Services
*   **Situational Awareness:** A dedicated "AegisNet Services" toggle instantly overlays critical safe havens on the map.
*   **Comprehensive Coverage:** 
    *   🚓 **Police Stations:** Displayed with their exact locations and active jurisdictions.
    *   🏥 **Hospitals:** Major medical centers across Nagpur.
    *   🚇 **Transit Hubs:** Metro stations serving as well-lit, populated fallback points.
*   **Immediate Access:** Users can instantly view the distance to the nearest safe haven in an emergency, ensuring help is always visible.

---

## Slide 8: SOS Option & Immediate Response
*   **High-Friction Trigger:** To prevent accidental triggers, the UI features a deliberate "Slide to send SOS" mechanism.
*   **Immediate Action:** Activating SOS logs a `NEED_HELP` intent. This instantly drops a pulsing red emergency marker on the map.
*   **System Integration:** The exact coordinates are broadcast to the backend. In a production environment, this payload is designed to be wired directly to the Nagpur Police Control Room for immediate dispatch.

---

## Slide 9: Accident & Incident Reporting
*   **Community-Driven Safety:** Users can actively contribute to the safety grid by reporting transient dangers that static police data might miss.
*   **Reporting Modal:** A quick-action modal to drop a pin for Roadblocks, Suspicious Activity, or Accidents, scaled by severity (1 to 5).
*   **Live WebSockets Broadcast:** The moment a report is submitted, the FastAPI backend broadcasts it via WebSockets. All active users instantly see a new caution marker (🟠) appear on their screens in real-time.

---

## Slide 10: Conclusion & Future Scope
*   **Summary:** AegisNav proves that navigation can be both intelligent and empathetic to user safety.
*   **Future Scope:** 
    *   Direct integration with municipal street-lighting APIs.
    *   Voice-activated SOS commands.
    *   Wearable device integration for biometric stress monitoring.
