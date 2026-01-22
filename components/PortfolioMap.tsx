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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [isSearching, setIsSearching] = useState(false);
  const [projectsWithCoords, setProjectsWithCoords] = useState<Project[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Geocode projects that have zip codes but no coordinates
  useEffect(() => {
    const geocodeProjects = async () => {
      const projectsNeedingGeocoding = projects.filter(
        p => p.zipCode && (!p.latitude || !p.longitude)
      );

      if (projectsNeedingGeocoding.length === 0) {
        setProjectsWithCoords(projects);
        return;
      }

      setIsGeocoding(true);
      const geocodedProjects = [...projects];

      // Geocode projects in batches to avoid rate limits
      for (let i = 0; i < projectsNeedingGeocoding.length; i++) {
        const project = projectsNeedingGeocoding[i];
        try {
          const response = await fetch(`/api/geocode?q=${encodeURIComponent(project.zipCode)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.latitude && data.longitude) {
              // Update the project in the array
              const index = geocodedProjects.findIndex(p => p._id === project._id);
              if (index !== -1) {
                geocodedProjects[index] = {
                  ...geocodedProjects[index],
                  latitude: data.latitude,
                  longitude: data.longitude,
                };
              }
            }
          }
          // Small delay to avoid rate limiting
          if (i < projectsNeedingGeocoding.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error geocoding project ${project.name}:`, error);
        }
      }

      setProjectsWithCoords(geocodedProjects);
      setIsGeocoding(false);
    };

    geocodeProjects();
  }, [projects]);

  // Initialize filtered projects when projects prop changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projectsWithCoords.length > 0 ? projectsWithCoords : projects);
    }
  }, [projects, projectsWithCoords, searchQuery]);

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
    const projectsToFilter = projectsWithCoords.length > 0 ? projectsWithCoords : projects;
    
    if (!searchQuery.trim()) {
      setFilteredProjects(projectsToFilter);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const filtered = projectsToFilter.filter(project => {
      // Match zip code
      if (project.zipCode && project.zipCode.toLowerCase().includes(query)) {
        return true;
      }
      // Could add state matching here if we store state in projects
      return false;
    });

    setFilteredProjects(filtered);
  }, [searchQuery, projects, projectsWithCoords]);

  // Update markers when filtered projects change (if map is already loaded)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) {
      return;
    }

    // Remove old markers
    cleanupMarkers();

    // Add new markers
    const projectsWithCoords = filteredProjects.filter(
      p => p.latitude != null && p.longitude != null
    );

    if (projectsWithCoordsList.length > 0) {
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
        
        projectsWithCoordsList.forEach((project) => {
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

        // Add markers for each project with coordinates
        const projectsToShow = projectsWithCoords.length > 0 ? projectsWithCoords : filteredProjects;
        const projectsWithCoordsList = projectsToShow.filter(
          p => p.latitude != null && p.longitude != null
        );

        console.log('Projects with coordinates:', projectsWithCoordsList.length, projectsWithCoordsList);
        console.log('Total projects:', projects.length);
        console.log('Projects needing geocoding:', projects.filter(p => p.zipCode && (!p.latitude || !p.longitude)).length);

        if (projectsWithCoordsList.length > 0) {
          const positions: Array<{ lat: number; lng: number }> = [];
          
          projectsWithCoordsList.forEach((project) => {
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
  }, [mapLoaded, mapError, filteredProjects, projectsWithCoords]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = searchQuery.trim();
      console.log('Searching for:', searchTerm);
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      console.log('Geocode response:', response.status, data);

      if (!response.ok || data.error) {
        const errorMsg = data.error || `HTTP ${response.status}`;
        console.error('Geocoding failed:', errorMsg, data);
        alert(`Location not found: ${errorMsg}. Please try a different ZIP code or state name (e.g., "75219" or "Texas, USA").`);
        setIsSearching(false);
        return;
      }

      // Filter projects by zip code or state
      const queryLower = searchTerm.toLowerCase();
      let filtered: Project[] = [];

      if (data.zipCode) {
        // Filter by zip code
        filtered = projects.filter(p => 
          p.zipCode && p.zipCode.toLowerCase().includes(data.zipCode.toLowerCase())
        );
      } else if (data.state) {
        // For state search, we'd need to geocode each project's zip to get state
        // For now, just show all projects and center on the state
        filtered = projects;
      } else {
        filtered = projects;
      }

      setFilteredProjects(filtered);

      // Center map on searched location
      if (mapInstanceRef.current && data.latitude && data.longitude) {
        mapInstanceRef.current.setCenter({ lat: data.latitude, lng: data.longitude });
        mapInstanceRef.current.setZoom(8);
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
      const projectsWithCoords = projects.filter(
        p => p.latitude != null && p.longitude != null
      );
      if (projectsWithCoords.length > 0) {
        const positions = projectsWithCoords.map(p => ({
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
      {isGeocoding && (
        <div className="map-geocoding">
          <p>Geocoding projects... This may take a moment.</p>
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
          flex-wrap: wrap;
        }

        .map-search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-size: 16px;
          font-family: inherit;
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

