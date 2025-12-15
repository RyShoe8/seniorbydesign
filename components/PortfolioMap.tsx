'use client';

import { useEffect, useRef, useState } from 'react';

interface Project {
  _id?: string | { toString(): string };
  name: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  projects: Project[];
}

export default function PortfolioMap({ projects }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Only load map if API key is available
    if (!apiKey || !mapRef.current || projects.length === 0) {
      if (!apiKey) {
        setMapError(true);
      }
      return;
    }

    // Lazy load Google Maps only when component is in viewport
    const loadMap = async () => {
      try {
        // Dynamically import Google Maps loader
        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
        });

        const { Map } = await loader.importLibrary('maps');
        const { Marker } = await loader.importLibrary('marker');

        const map = new Map(mapRef.current!, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          zoom: 4,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }],
            },
          ],
        });

        // Add markers for each project
        projects.forEach((project) => {
          if (project.latitude && project.longitude) {
            new Marker({
              position: { lat: project.latitude, lng: project.longitude },
              map,
              title: project.name,
            });
          }
        });

        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError(true);
      }
    };

    // Use Intersection Observer to lazy load map when in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !mapLoaded && !mapError) {
          loadMap();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [projects, mapLoaded, mapError]);

  return (
    <div className="portfolio-map-container">
      {mapError ? (
        <div className="map-placeholder">
          <p>Map will be available once Google Maps API key is configured.</p>
          <p className="map-placeholder-info">
            {projects.length} project{projects.length !== 1 ? 's' : ''} available
          </p>
        </div>
      ) : (
        <div ref={mapRef} className="portfolio-map">
          {!mapLoaded && (
            <div className="map-loading">
              <p>Loading map...</p>
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        .portfolio-map-container {
          width: 100%;
          height: 500px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          background: var(--warm-grey-1);
        }

        .portfolio-map {
          width: 100%;
          height: 100%;
        }

        .map-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
          text-align: center;
          color: var(--sbd-brown);
        }

        .map-placeholder-info {
          margin-top: var(--spacing-sm);
          font-size: 16px;
          color: var(--warm-grey-3);
        }

        .map-loading {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sbd-brown);
        }
      `}</style>
    </div>
  );
}

