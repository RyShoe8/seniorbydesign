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
  const infoWindowRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [isSearching, setIsSearching] = useState(false);
  const mapReadyPromiseRef = useRef<Promise<any> | null>(null);

  // Initialize filtered projects when projects prop changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
    }
  }, [projects, searchQuery]);

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

  // Update filtered projects when search changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const queryLower = searchQuery.trim().toLowerCase();
    const filtered = projects.filter(project => {
      // Match zip code
      if (project.zipCode && project.zipCode.toLowerCase().includes(queryLower)) {
        return true;
      }
      // Could add state matching here if we store state in projects
      return false;
    });

    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // Update markers when filtered projects change (if map is already loaded)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) {
      return;
    }

    // Remove old markers
    cleanupMarkers();

    // Add new markers - only use projects that already have coordinates stored
    const projectsWithCoordsForMarkers = filteredProjects.filter(
      p => p.latitude != null && p.longitude != null
    );

    if (projectsWithCoordsForMarkers.length > 0) {
      import('@googlemaps/js-api-loader').then(({ Loader }) => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return Promise.reject('API key not found');
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
        });
        return Promise.all([
          loader.importLibrary('marker'),
          loader.importLibrary('maps'),
        ]);
      }).then(([markerLibrary, mapsLibrary]: [any, any]) => {
        const { AdvancedMarkerElement, PinElement, Marker } = markerLibrary;
        const { InfoWindow } = mapsLibrary;
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
        // Only use AdvancedMarkerElement if a real Map ID is provided (not DEMO_MAP_ID)
        const hasMapId = !!mapId && mapId !== 'DEMO_MAP_ID';
        const positions: Array<{ lat: number; lng: number }> = [];
        
        
        projectsWithCoordsForMarkers.forEach((project, index) => {
          if (project.latitude != null && project.longitude != null && mapInstanceRef.current) {
            try {
              const position = { lat: project.latitude, lng: project.longitude };
              let marker: any;
              
              // Use regular Marker by default (more reliable)
              // Only use AdvancedMarkerElement if a real Map ID is provided
              if (hasMapId && AdvancedMarkerElement && PinElement) {
                try {
                  const pinElement = new PinElement({
                    background: '#d4af37', // SBD gold color
                    borderColor: '#5c4a37', // SBD brown color
                    glyphColor: '#fff',
                    scale: 1.2,
                  });
                  
                  marker = new AdvancedMarkerElement({
                    map: mapInstanceRef.current,
                    position,
                    title: project.name,
                    content: pinElement.element,
                  });
                } catch (advError) {
                  // Fall back to regular Marker
                  marker = new Marker({
                    map: mapInstanceRef.current,
                    position,
                    title: project.name,
                  });
                }
              } else {
                // Use regular Marker - more reliable and doesn't require Map ID
                marker = new Marker({
                  map: mapInstanceRef.current,
                  position,
                  title: project.name,
                });
              }
              
              // Add click listener to show info window
              marker.addListener('click', () => {
                // Close any existing info window
                if (infoWindowRef.current) {
                  infoWindowRef.current.close();
                }
                
                // Create and open new info window
                const infoWindow = new InfoWindow({
                  content: `<div style="padding: 8px; font-weight: 500; color: #5c4a37;">${project.name}</div>`,
                });
                infoWindow.open(mapInstanceRef.current, marker);
                infoWindowRef.current = infoWindow;
              });
              
              markersRef.current.push(marker);
              positions.push(position);
            } catch (e) {
              // Error creating marker
            }
          }
        });
        

        // Fit map bounds to show all markers
        // Skip this if we're currently searching (search handler will handle centering)
        if (positions.length > 0 && mapInstanceRef.current && !isSearching) {
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
              });
    }
  }, [filteredProjects, mapLoaded, isSearching]);

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

        const mapsLibrary = await loader.importLibrary('maps') as any;
        const { Map, InfoWindow } = mapsLibrary;
        // Use AdvancedMarkerElement if Map ID is available, otherwise fall back to Marker
        const markerLibrary = await loader.importLibrary('marker') as any;
        const { AdvancedMarkerElement, PinElement, Marker } = markerLibrary;

        // Check if container still exists before creating map
        if (!mapRef.current) {
          return;
        }

        // Get Map ID from environment variable (required for Advanced Markers)
        // Only use Map ID if explicitly provided - otherwise use regular markers
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
        const hasMapId = !!mapId && mapId !== 'DEMO_MAP_ID'; // Don't use DEMO_MAP_ID, it's unreliable
        
        const mapOptions: any = {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          zoom: 4,
          mapTypeControl: true,
          mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite'],
          },
          mapTypeId: 'roadmap',
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
        };
        
        // Only add mapId if we have a real one (not DEMO_MAP_ID)
        if (hasMapId) {
          mapOptions.mapId = mapId;
        }
        
        const map = new Map(mapRef.current, mapOptions);

        mapInstanceRef.current = map;
        // Also store on DOM element as backup
        if (mapRef.current) {
          (mapRef.current as any).__mapInstance = map;
        }
        // Store in window for easy access (for debugging and fallback)
        if (typeof window !== 'undefined') {
          (window as any).__sbdMapInstance = map;
        }
        
        // Wait for map to be fully ready before resolving promise
        const mapReadyPromise = new Promise<any>((resolve) => {
          // Listen for map idle event to know when it's ready
          map.addListener('idle', () => {
            resolve(map);
          });
          // Also resolve immediately if map is already ready
          setTimeout(() => resolve(map), 100);
        });
        mapReadyPromiseRef.current = mapReadyPromise;

        // Listen for map type changes to disable labels in satellite view
        map.addListener('maptypeid_changed', () => {
          const currentMapType = map.getMapTypeId();
          if (currentMapType === 'satellite' || currentMapType === 'hybrid') {
            // Disable labels by setting map options
            map.setOptions({
              styles: [
                {
                  featureType: 'all',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
            });
          } else {
            // Re-enable original styles for roadmap
            map.setOptions({
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
          }
        });

        // Add markers for each project with coordinates - only use stored coordinates
        const projectsWithCoordsList = filteredProjects.filter(
          p => p.latitude != null && p.longitude != null
        );

        const projectsNeedingGeocoding = projects.filter(p => p.zipCode && (!p.latitude || !p.longitude));

        if (projectsWithCoordsList.length > 0) {
          const positions: Array<{ lat: number; lng: number }> = [];
          
                              projectsWithCoordsList.forEach((project, index) => {
            if (project.latitude != null && project.longitude != null) {
              try {
                const position = { lat: project.latitude, lng: project.longitude };
                let marker: any;
                
                // Use regular Marker by default (more reliable)
                // Only use AdvancedMarkerElement if a real Map ID is provided
                if (hasMapId && AdvancedMarkerElement && PinElement) {
                  try {
                    const pinElement = new PinElement({
                      background: '#d4af37', // SBD gold color
                      borderColor: '#5c4a37', // SBD brown color
                      glyphColor: '#fff',
                      scale: 1.2,
                    });
                    
                    marker = new AdvancedMarkerElement({
                      map,
                      position,
                      title: project.name,
                      content: pinElement.element,
                    });
                  } catch (advError) {
                    // Fall back to regular Marker
                    marker = new Marker({
                      map,
                      position,
                      title: project.name,
                    });
                  }
                } else {
                  // Use regular Marker - more reliable and doesn't require Map ID
                  marker = new Marker({
                    map,
                    position,
                    title: project.name,
                  });
                }
                
                // Add click listener to show info window
                marker.addListener('click', () => {
                  // Close any existing info window
                  if (infoWindowRef.current) {
                    infoWindowRef.current.close();
                  }
                  
                  // Create and open new info window
                  const infoWindow = new InfoWindow({
                    content: `<div style="padding: 8px; font-weight: 500; color: #5c4a37;">${project.name}</div>`,
                  });
                  infoWindow.open(map, marker);
                  infoWindowRef.current = infoWindow;
                });
                
                markersRef.current.push(marker);
                positions.push(position);
              } catch (e) {
                // Error creating marker
              }
            }
          });

          // Fit map bounds to show all markers (only on initial load, not during search)
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
        }

        setMapLoaded(true);
      } catch (error) {
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
      // Don't cleanup markers or reset map instance here - let it persist
      // cleanupMarkers();
      // mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, mapError]); // Removed filteredProjects - map loading shouldn't depend on filtered projects

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = searchQuery.trim();
      
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error || `HTTP ${response.status}`;
                alert(`Location not found: ${errorMsg}. Please try a different ZIP code or state name (e.g., "75219" or "Texas").`);
        setIsSearching(false);
        return;
      }

      if (data.error) {
        const errorMsg = data.error;
        alert(`Location not found: ${errorMsg}. Please try a different ZIP code or state name (e.g., "75219" or "Texas").`);
        setIsSearching(false);
        return;
      }

      if (!data.latitude || !data.longitude) {
        alert('Location found but coordinates are missing. Please try a different search.');
        setIsSearching(false);
        return;
      }

      // Filter projects by zip code or state
      const queryLower = searchTerm.toLowerCase();
      let filtered: Project[] = [];

      if (data.zipCode) {
        // Filter by zip code - match projects with this zip code
        filtered = projects.filter(p => 
          p.zipCode && p.zipCode.toLowerCase().includes(data.zipCode.toLowerCase())
        );
      } else if (data.state) {
        // For state search, show all projects (we don't store state in projects)
        // The map will center on the state location
        filtered = projects;
      } else {
        // For general location searches, show all projects
        filtered = projects;
      }

      // Set isSearching BEFORE updating filteredProjects so the marker effect skips fitBounds
      setIsSearching(true);
      setFilteredProjects(filtered);

      // Center map on searched location and zoom appropriately
      // Wait for map to be ready using the promise
      let mapToUse: any = null;
      
      if (mapReadyPromiseRef.current) {
        try {
          mapToUse = await mapReadyPromiseRef.current;
        } catch (e) {
          // Promise failed, trying other methods
        }
      }
      
      // Fallback: Try multiple sources to get the map instance
      if (!mapToUse) {
        mapToUse = mapInstanceRef.current;
      }
      
      if (!mapToUse && mapRef.current) {
        const mapElement = mapRef.current as any;
        mapToUse = mapElement.__mapInstance || mapElement.map;
      }
      
      // Try window backup
      if (!mapToUse && typeof window !== 'undefined') {
        mapToUse = (window as any).__sbdMapInstance;
      }
      
      // Final fallback: wait a bit if map still isn't ready
      if (!mapToUse) {
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          mapToUse = mapInstanceRef.current 
            || (mapRef.current as any)?.__mapInstance 
            || (mapRef.current as any)?.map
            || (typeof window !== 'undefined' ? (window as any).__sbdMapInstance : null);
          if (mapToUse) {
            break;
          }
        }
      }
      
      if (mapToUse && data.latitude && data.longitude) {
        try {
          mapToUse.setCenter({ lat: data.latitude, lng: data.longitude });
          
          // Use setTimeout to ensure the center call completes before zooming
          setTimeout(() => {
            try {
              // Zoom level: closer for ZIP codes, wider for states
              if (data.zipCode) {
                mapToUse.setZoom(10); // Closer zoom for ZIP codes
              } else {
                mapToUse.setZoom(5); // Wider zoom for states (less zoomed in)
              }
              // Clear searching flag after map is centered
              setIsSearching(false);
            } catch (zoomError) {
              setIsSearching(false);
            }
          }, 100);
        } catch (error) {
          setIsSearching(false);
        }
      } else {
        setIsSearching(false);
      }
    } catch (error) {
      alert('Error searching location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredProjects(projects);
      if (mapInstanceRef.current) {
      // Reset to show all projects
      const projectsWithCoordsForBounds = projects.filter(
        p => p.latitude != null && p.longitude != null
      );
      if (projectsWithCoordsForBounds.length > 0) {
        const positions = projectsWithCoordsForBounds.map(p => ({
          lat: p.latitude!,
          lng: p.longitude!,
        }));
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
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          mapInstanceRef.current.setCenter({ lat: centerLat, lng: centerLng });
          mapInstanceRef.current.setZoom(4);
        }
      }
    }
  };

  return (
    <div className="portfolio-map-container">
      <div className="map-search-container">
        <form onSubmit={handleSearch} className="map-search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ZIP code or state (e.g., 75219 or Texas)"
            className="map-search-input"
            disabled={isSearching}
          />
          <button type="submit" className="map-search-button" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchQuery && (
            <button type="button" onClick={handleClearSearch} className="map-clear-button">
              Clear
            </button>
          )}
        </form>
        {searchQuery && (
          <p className="map-search-results">
            Showing {filteredProjects.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
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
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          background: var(--warm-grey-1);
        }

        .map-search-container {
          padding: var(--spacing-md);
          background: #fff;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .map-search-form {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
          flex-wrap: nowrap;
        }

        .map-search-input {
          flex: 1;
          min-width: 0;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-size: 16px;
          font-family: inherit;
        }

        @media (max-width: 768px) {
          .map-search-form {
            flex-wrap: nowrap;
          }

          .map-search-input {
            flex: 1;
            min-width: 0;
            font-size: 14px;
            padding: 0.6rem;
          }

          .map-search-button {
            padding: 0.6rem 1rem;
            font-size: 14px;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .map-clear-button {
            padding: 0.6rem 1rem;
            font-size: 14px;
            white-space: nowrap;
            flex-shrink: 0;
          }
        }

        .map-search-input:focus {
          outline: none;
          border-color: var(--sbd-gold);
        }

        .map-search-button,
        .map-clear-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .map-search-button {
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .map-search-button:hover:not(:disabled) {
          background-color: var(--sbd-brown);
        }

        .map-search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .map-clear-button {
          background-color: transparent;
          color: var(--sbd-brown);
          border: 1px solid var(--sbd-brown);
        }

        .map-clear-button:hover {
          background-color: var(--sbd-brown);
          color: #fff;
        }

        .map-search-results {
          margin-top: var(--spacing-sm);
          font-size: 14px;
          color: var(--warm-grey-3);
        }

        .portfolio-map {
          width: 100%;
          height: 500px;
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

