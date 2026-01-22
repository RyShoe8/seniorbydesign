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

    console.log('Projects with coordinates:', projectsWithCoordsForMarkers.length, 'out of', filteredProjects.length);

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
        const hasMapId = !!mapId && mapId !== 'default';
        const positions: Array<{ lat: number; lng: number }> = [];
        
        projectsWithCoordsForMarkers.forEach((project) => {
          if (project.latitude != null && project.longitude != null && mapInstanceRef.current) {
            try {
              const position = { lat: project.latitude, lng: project.longitude };
              let marker: any;
              
              // Use AdvancedMarkerElement if Map ID is available, otherwise use regular Marker
              if (hasMapId && AdvancedMarkerElement) {
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
                  console.warn('AdvancedMarkerElement failed, falling back to Marker:', advError);
                  // Fall back to regular Marker
                  marker = new Marker({
                    map: mapInstanceRef.current,
                    position,
                    title: project.name,
                  });
                }
              } else {
                // Use regular Marker when Map ID is not available
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
              console.error('Error creating marker for project:', project.name, e);
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
  }, [filteredProjects, mapLoaded]);

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
        const hasMapId = !!mapId && mapId !== 'default';

        // Check if container still exists before creating map
        if (!mapRef.current) {
          return;
        }

        // Get Map ID from environment variable (required for Advanced Markers)
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
        
        const map = new Map(mapRef.current, {
          mapId: mapId || 'default', // Map ID required for Advanced Markers
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
        });

        mapInstanceRef.current = map;

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

        console.log('Projects with coordinates:', projectsWithCoordsList.length, 'out of', filteredProjects.length);
        console.log('Total projects:', projects.length);
        const projectsNeedingGeocoding = projects.filter(p => p.zipCode && (!p.latitude || !p.longitude));
        if (projectsNeedingGeocoding.length > 0) {
          console.log('Projects needing geocoding:', projectsNeedingGeocoding.length, '- Use "Geocode All Projects" button in admin panel');
        }

        if (projectsWithCoordsList.length > 0) {
          const positions: Array<{ lat: number; lng: number }> = [];
          
          projectsWithCoordsList.forEach((project) => {
            if (project.latitude != null && project.longitude != null) {
              try {
                const position = { lat: project.latitude, lng: project.longitude };
                let marker: any;
                
                // Use AdvancedMarkerElement if Map ID is available, otherwise use regular Marker
                if (hasMapId && AdvancedMarkerElement) {
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
                    console.warn('AdvancedMarkerElement failed, falling back to Marker:', advError);
                    // Fall back to regular Marker
                    marker = new Marker({
                      map,
                      position,
                      title: project.name,
                    });
                  }
                } else {
                  // Use regular Marker when Map ID is not available
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
                console.error('Error creating marker for project:', project.name, e);
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
  }, [mapLoaded, mapError, filteredProjects]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    // Check if map is loaded
    if (!mapLoaded || !mapInstanceRef.current) {
      alert('Map is still loading. Please wait a moment and try again.');
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = searchQuery.trim();
      console.log('Searching for:', searchTerm);
      console.log('Map loaded:', mapLoaded, 'Map instance:', !!mapInstanceRef.current);
      
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      console.log('Geocode response:', response.status, data);

      if (!response.ok) {
        const errorMsg = data?.error || `HTTP ${response.status}`;
        console.error('Geocoding failed - response not OK:', {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          data,
        });
        alert(`Location not found: ${errorMsg}. Please try a different ZIP code or state name (e.g., "75219" or "Texas").`);
        setIsSearching(false);
        return;
      }

      if (data.error) {
        const errorMsg = data.error;
        console.error('Geocoding failed - error in data:', errorMsg, data);
        alert(`Location not found: ${errorMsg}. Please try a different ZIP code or state name (e.g., "75219" or "Texas").`);
        setIsSearching(false);
        return;
      }

      if (!data.latitude || !data.longitude) {
        console.error('Geocoding failed - missing coordinates:', data);
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

      setFilteredProjects(filtered);

      // Center map on searched location and zoom appropriately
      if (mapInstanceRef.current && data.latitude && data.longitude) {
        try {
          mapInstanceRef.current.setCenter({ lat: data.latitude, lng: data.longitude });
          
          // Zoom level: closer for ZIP codes, wider for states
          if (data.zipCode) {
            mapInstanceRef.current.setZoom(10); // Closer zoom for ZIP codes
          } else {
            mapInstanceRef.current.setZoom(6); // Wider zoom for states
          }
        } catch (error) {
          console.error('Error centering map:', error);
        }
      } else {
        console.warn('Map instance or coordinates not available:', {
          hasMap: !!mapInstanceRef.current,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Error searching:', error);
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

