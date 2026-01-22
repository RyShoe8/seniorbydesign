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
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Cleanup function
  const cleanupMarkers = () => {
    markersRef.current.forEach(marker => {
      try {
        marker.map = null;
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    markersRef.current = [];
  };

  // Update markers when projects change (if map is already loaded)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) {
      return;
    }

    // Remove old markers
    cleanupMarkers();

    // Add new markers
    const projectsWithCoords = projects.filter(
      p => p.latitude != null && p.longitude != null
    );

    if (projectsWithCoords.length > 0) {
      import('@googlemaps/js-api-loader').then(({ Loader }) => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return Promise.reject('API key not found');
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
        });
        return loader.importLibrary('marker');
      }).then(({ Marker }: { Marker: any }) => {
        const positions: Array<{ lat: number; lng: number }> = [];
        
        projectsWithCoords.forEach((project) => {
          if (project.latitude != null && project.longitude != null && mapInstanceRef.current) {
            try {
              const position = { lat: project.latitude, lng: project.longitude };
              const marker = new Marker({
                position,
                map: mapInstanceRef.current,
                title: project.name,
              });
              markersRef.current.push(marker);
              positions.push(position);
            } catch (e) {
              console.error('Error creating marker:', e);
            }
          }
        });

        // Fit map bounds to show all markers
        if (positions.length > 0 && mapInstanceRef.current) {
          // Calculate bounds manually
          const lats = positions.map(p => p.lat);
          const lngs = positions.map(p => p.lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          
          try {
            const bounds = {
              north: maxLat,
              south: minLat,
              east: maxLng,
              west: minLng,
            };
            mapInstanceRef.current.fitBounds(bounds as any);
          } catch (e) {
            // Fallback: center on average position
            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;
            mapInstanceRef.current.setCenter({ lat: centerLat, lng: centerLng });
            mapInstanceRef.current.setZoom(6);
          }
        }
      }).catch((error) => {
        console.error('Error updating markers:', error);
      });
    }
  }, [projects, mapLoaded]);

  // Load map effect
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Only load map if API key is available
    if (!apiKey || !mapRef.current) {
      if (!apiKey) {
        setMapError(true);
      }
      return;
    }

    // Disconnect observer cleanup
    const disconnectObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };

    // Lazy load Google Maps only when component is in viewport
    const loadMap = async () => {
      // Don't load if already loaded or if container doesn't exist
      if (mapInstanceRef.current || !mapRef.current) {
        return;
      }

      try {
        // Clean up any existing markers
        cleanupMarkers();

        // Dynamically import Google Maps loader
        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
        });

        const { Map } = await loader.importLibrary('maps') as { Map: any };
        const { Marker } = await loader.importLibrary('marker') as { Marker: any };

        // Check if container still exists before creating map
        if (!mapRef.current) {
          return;
        }

        const map = new Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          zoom: 4,
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }],
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }],
            },
            {
              featureType: 'administrative',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#c9c9c9' }, { weight: 1 }],
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#999999' }, { weight: 1.5 }],
            },
            {
              featureType: 'administrative.province',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#b3b3b3' }, { weight: 1 }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Add markers for each project with coordinates
        const projectsWithCoords = projects.filter(
          p => p.latitude != null && p.longitude != null
        );

        console.log('Projects with coordinates:', projectsWithCoords.length, projectsWithCoords);

        if (projectsWithCoords.length > 0) {
          const positions: Array<{ lat: number; lng: number }> = [];
          
          projectsWithCoords.forEach((project) => {
            if (project.latitude != null && project.longitude != null) {
              try {
                const position = { lat: project.latitude, lng: project.longitude };
                const marker = new Marker({
                  position,
                  map,
                  title: project.name,
                });
                markersRef.current.push(marker);
                positions.push(position);
              } catch (e) {
                console.error('Error creating marker:', e);
              }
            }
          });

          // Fit map bounds to show all markers
          if (positions.length > 0) {
            // Calculate bounds manually
            const lats = positions.map(p => p.lat);
            const lngs = positions.map(p => p.lng);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            // Use fitBounds if available, otherwise set center and zoom
            try {
              const bounds = {
                north: maxLat,
                south: minLat,
                east: maxLng,
                west: minLng,
              };
              map.fitBounds(bounds as any);
            } catch (e) {
              // Fallback: center on average position
              const centerLat = (minLat + maxLat) / 2;
              const centerLng = (minLng + maxLng) / 2;
              map.setCenter({ lat: centerLat, lng: centerLng });
              map.setZoom(6);
            }
          }
        } else {
          console.log('No projects with coordinates found. Total projects:', projects.length);
          console.log('Projects data:', projects);
        }

        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError(true);
        cleanupMarkers();
      }
    };

    // Use Intersection Observer to lazy load map when in viewport
    if (!mapLoaded && !mapError && mapRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !mapInstanceRef.current) {
            loadMap();
            disconnectObserver();
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(mapRef.current);
    }

    return () => {
      disconnectObserver();
      cleanupMarkers();
      // Reset map instance reference
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, mapError]);

  return (
    <div className="portfolio-map-container">
      <div ref={mapRef} className="portfolio-map" />
      {mapError && (
        <div className="map-placeholder">
          <p>Map will be available once Google Maps API key is configured.</p>
          <p className="map-placeholder-info">
            {projects.length} project{projects.length !== 1 ? 's' : ''} available
          </p>
        </div>
      )}
      {!mapLoaded && !mapError && (
        <div className="map-loading">
          <p>Loading map...</p>
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
          position: relative;
        }

        .map-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
          text-align: center;
          color: var(--sbd-brown);
          background: var(--warm-grey-1);
          z-index: 1;
        }

        .map-placeholder-info {
          margin-top: var(--spacing-sm);
          font-size: 16px;
          color: var(--warm-grey-3);
        }

        .map-loading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sbd-brown);
          background: var(--warm-grey-1);
          z-index: 1;
        }
      `}</style>
    </div>
  );
}

