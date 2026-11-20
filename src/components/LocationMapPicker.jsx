import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const JAIPUR_CENTER = [26.9124, 75.7873];

const toCoordinates = (latitude, longitude) => ({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
});

const LocationMapPicker = ({ coordinates, onSelect }) => {
    const [open, setOpen] = useState(false);
    const [draftCoordinates, setDraftCoordinates] = useState(coordinates || null);
    const mapContainerRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!open || !mapContainerRef.current) return undefined;

        const startingPoint = coordinates
            ? [coordinates.latitude, coordinates.longitude]
            : JAIPUR_CENTER;
        const map = L.map(mapContainerRef.current, { scrollWheelZoom: true }).setView(startingPoint, coordinates ? 15 : 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);

        const placeMarker = (latitude, longitude) => {
            const point = toCoordinates(latitude, longitude);
            setDraftCoordinates(point);
            if (markerRef.current) {
                markerRef.current.setLatLng([point.latitude, point.longitude]);
            } else {
                markerRef.current = L.circleMarker([point.latitude, point.longitude], {
                    radius: 9,
                    color: "#fffefa",
                    weight: 3,
                    fillColor: "#a76449",
                    fillOpacity: 1
                }).addTo(map);
            }
        };

        if (coordinates) placeMarker(coordinates.latitude, coordinates.longitude);
        map.on("click", (event) => placeMarker(event.latlng.lat, event.latlng.lng));
        const resizeTimer = window.setTimeout(() => map.invalidateSize(), 80);

        return () => {
            window.clearTimeout(resizeTimer);
            map.remove();
            markerRef.current = null;
        };
    }, [open, coordinates]);

    const close = () => setOpen(false);

    return (
        <>
            <button className="location-map-trigger" type="button" onClick={() => { setDraftCoordinates(coordinates || null); setOpen(true); }}>
                <MapPin size={16} />{coordinates ? "Change map pin" : "Select on map"}
            </button>
            {open && (
                <div className="location-map-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
                    <section className="location-map-dialog" role="dialog" aria-modal="true" aria-labelledby="location-map-title">
                        <header>
                            <div>
                                <p className="eyebrow">EVENT LOCATION</p>
                                <h2 id="location-map-title">Choose a point on the map</h2>
                                <p>Click the map to place the pin. You can drag and zoom to find the venue.</p>
                            </div>
                            <button type="button" className="location-map-close" onClick={close} aria-label="Close map"><X size={19} /></button>
                        </header>
                        <div className="location-map-canvas" ref={mapContainerRef} />
                        <div className="location-map-footer">
                            <span>{draftCoordinates ? `Lat ${draftCoordinates.latitude.toFixed(6)} · Lng ${draftCoordinates.longitude.toFixed(6)}` : "No pin selected yet"}</span>
                            <div>
                                <button type="button" className="button button-outline" onClick={close}>Cancel</button>
                                <button type="button" className="button button-dark" disabled={!draftCoordinates} onClick={() => { onSelect(draftCoordinates); close(); }}>Use this location</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
};

export default LocationMapPicker;
