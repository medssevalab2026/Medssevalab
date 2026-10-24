import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Plus, RefreshCw, Search, Trash2, Edit3, CheckCircle2,
  XCircle, Globe, Navigation, Sliders, Building2,
  Info, Loader2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceAreaService } from '@/services/api';
import { cn } from '@/utils/cn';

interface ServiceAreaPincode {
  id: string;
  pincode: string;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  createdAt?: string;
}

interface PathologyPartner {
  id: string;
  labName: string;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number | null;
  preferredServiceArea?: string | null;
  isActive?: boolean;
  user?: {
    name?: string | null;
    mobile?: string | null;
    email?: string | null;
  } | null;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
}

const GOOGLE_MAPS_KEY =
  (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyAdezYYmmFzsMWzbSYkr1UtHBan7HitQK0';

export function ServiceAreasPage() {
  const [activeTab, setActiveTab] = useState<'pincodes' | 'partners' | 'map'>('pincodes');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [serviceAreas, setServiceAreas] = useState<ServiceAreaPincode[]>([]);
  const [partners, setPartners] = useState<PathologyPartner[]>([]);
  const [, setBranches] = useState<Branch[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add/Edit Service Area Modal
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceAreaPincode | null>(null);
  const [areaForm, setAreaForm] = useState({
    pincode: '',
    city: '',
    state: 'Uttar Pradesh',
    latitude: '',
    longitude: '',
    isActive: true,
  });
  const [savingArea, setSavingArea] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);

  // Edit Partner Geofencing Modal
  const [geofenceModalOpen, setGeofenceModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PathologyPartner | null>(null);
  const [geofenceForm, setGeofenceForm] = useState({
    serviceRadiusKm: 3,
    latitude: '',
    longitude: '',
    preferredServiceArea: '',
  });
  const [savingGeofence, setSavingGeofence] = useState(false);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapSearchText, setMapSearchText] = useState('');
  const [selectedMapPartner, setSelectedMapPartner] = useState<PathologyPartner | null>(null);
  const [selectedRadiusSlider, setSelectedRadiusSlider] = useState<number>(3);
  const [savingMapGeofence, setSavingMapGeofence] = useState(false);

  // Fetch overview data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await serviceAreaService.getOverview();
      setServiceAreas(res.serviceAreas || []);
      setPartners(res.partners || []);
      setBranches(res.branches || []);
    } catch (err: any) {
      toast.error('Failed to load service areas data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Google Maps Script
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      setMapsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setMapsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize or update Map
  const renderMapOverlays = useCallback(() => {
    if (!googleMapRef.current || !(window as any).google?.maps) return;
    const gmaps = (window as any).google.maps;

    // Clear previous markers and circles
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];

    const bounds = new gmaps.LatLngBounds();
    let hasCoords = false;

    // Render Partner Pins & Geofencing Circles
    partners.forEach(partner => {
      const lat = partner.latitude != null ? Number(partner.latitude) : null;
      const lng = partner.longitude != null ? Number(partner.longitude) : null;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        hasCoords = true;
        const pos = { lat, lng };
        bounds.extend(pos);

        const marker = new gmaps.Marker({
          position: pos,
          map: googleMapRef.current,
          title: partner.labName,
          icon: {
            path: gmaps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#0284C7',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        const radiusKm = partner.serviceRadiusKm ?? 3;
        const circle = new gmaps.Circle({
          strokeColor: '#0284C7',
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: '#38BDF8',
          fillOpacity: 0.18,
          map: googleMapRef.current,
          center: pos,
          radius: radiusKm * 1000,
        });

        marker.addListener('click', () => {
          setSelectedMapPartner(partner);
          setSelectedRadiusSlider(radiusKm);
          googleMapRef.current.panTo(pos);
        });

        circle.addListener('click', () => {
          setSelectedMapPartner(partner);
          setSelectedRadiusSlider(radiusKm);
          googleMapRef.current.panTo(pos);
        });

        markersRef.current.push(marker);
        circlesRef.current.push(circle);
      }
    });

    // Render Service Area Pincodes if coordinates exist
    serviceAreas.forEach(sa => {
      const lat = sa.latitude != null ? Number(sa.latitude) : null;
      const lng = sa.longitude != null ? Number(sa.longitude) : null;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        hasCoords = true;
        const pos = { lat, lng };
        bounds.extend(pos);

        const marker = new gmaps.Marker({
          position: pos,
          map: googleMapRef.current,
          title: `Pincode: ${sa.pincode} (${sa.city || ''})`,
          icon: {
            path: gmaps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 4,
            fillColor: sa.isActive ? '#10B981' : '#94A3B8',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
          },
        });

        markersRef.current.push(marker);
      }
    });

    if (hasCoords) {
      googleMapRef.current.fitBounds(bounds);
    } else {
      googleMapRef.current.setCenter({ lat: 25.4358, lng: 81.8463 }); // Prayagraj default
      googleMapRef.current.setZoom(11);
    }
  }, [partners, serviceAreas]);

  useEffect(() => {
    if (activeTab === 'map' && mapsLoaded && mapContainerRef.current && !googleMapRef.current) {
      const gmaps = (window as any).google.maps;
      googleMapRef.current = new gmaps.Map(mapContainerRef.current, {
        center: { lat: 25.4358, lng: 81.8463 },
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current.addListener('click', (e: any) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();

        // Reverse geocode to prompt adding a service area
        const geocoder = new gmaps.Geocoder();
        geocoder.geocode({ location: { lat: clickedLat, lng: clickedLng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            let postalCode = '';
            let city = '';
            let state = '';
            results[0].address_components?.forEach((c: any) => {
              if (c.types.includes('postal_code')) postalCode = c.long_name;
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
            });

            if (postalCode) {
              setAreaForm({
                pincode: postalCode,
                city: city || results[0].formatted_address.split(',')[0] || '',
                state: state || 'Uttar Pradesh',
                latitude: clickedLat.toFixed(6),
                longitude: clickedLng.toFixed(6),
                isActive: true,
              });
              setEditingArea(null);
              setAreaModalOpen(true);
            }
          }
        });
      });
    }

    if (activeTab === 'map' && mapsLoaded && googleMapRef.current) {
      renderMapOverlays();
    }
  }, [activeTab, mapsLoaded, renderMapOverlays]);

  // Handle map places search
  const handleMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchText.trim() || !googleMapRef.current || !(window as any).google?.maps) return;

    const gmaps = (window as any).google.maps;
    const geocoder = new gmaps.Geocoder();
    geocoder.geocode({ address: mapSearchText }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        googleMapRef.current.setCenter(loc);
        googleMapRef.current.setZoom(14);

        new gmaps.Marker({
          position: loc,
          map: googleMapRef.current,
          title: results[0].formatted_address,
          animation: gmaps.Animation.DROP,
        });

        toast.success(`Found: ${results[0].formatted_address}`);
      } else {
        toast.error('Location not found. Please try another address.');
      }
    });
  };

  // Sync from Branches
  const handleSyncFromBranches = async () => {
    try {
      setSyncing(true);
      const res = await serviceAreaService.syncFromBranches();
      toast.success(res.message || 'Synced service areas successfully');
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sync from branches');
    } finally {
      setSyncing(false);
    }
  };

  // Toggle Pincode Status
  const handleToggleAreaStatus = async (item: ServiceAreaPincode) => {
    try {
      await serviceAreaService.update(item.id, { isActive: !item.isActive });
      toast.success(`Pincode ${item.pincode} ${!item.isActive ? 'activated' : 'deactivated'}`);
      setServiceAreas(prev =>
        prev.map(a => (a.id === item.id ? { ...a, isActive: !item.isActive } : a))
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Delete Pincode
  const handleDeleteArea = async (id: string, pincode: string) => {
    if (!confirm(`Are you sure you want to remove pincode ${pincode} from serviceable areas?`)) return;
    try {
      await serviceAreaService.delete(id);
      toast.success(`Pincode ${pincode} deleted`);
      setServiceAreas(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error('Failed to delete service area');
    }
  };

  // Google Maps Place Search / Geocoding for Add Area Modal
  const handleSearchPlaceForModal = () => {
    if (!placeQuery.trim()) return;
    if (!(window as any).google?.maps) {
      toast.error('Google Maps is still loading, please wait...');
      return;
    }

    setSearchingPlace(true);
    const gmaps = (window as any).google.maps;
    const geocoder = new gmaps.Geocoder();

    geocoder.geocode({ address: placeQuery.trim() }, (results: any, status: any) => {
      setSearchingPlace(false);
      if (status === 'OK' && results && results[0]) {
        let postalCode = '';
        let city = '';
        let state = '';

        results[0].address_components?.forEach((c: any) => {
          if (c.types.includes('postal_code')) postalCode = c.long_name;
          if (c.types.includes('locality') || c.types.includes('sublocality_level_1')) {
            if (!city) city = c.long_name;
          }
          if (c.types.includes('administrative_area_level_2')) {
            if (!city) city = c.long_name;
          }
          if (c.types.includes('administrative_area_level_1')) state = c.long_name;
        });

        const lat = results[0].geometry?.location?.lat()?.toFixed(6) || '';
        const lng = results[0].geometry?.location?.lng()?.toFixed(6) || '';

        setAreaForm(prev => ({
          ...prev,
          pincode: postalCode || prev.pincode,
          city: city || prev.city || results[0].formatted_address.split(',')[0] || '',
          state: state || prev.state || 'Uttar Pradesh',
          latitude: lat || prev.latitude,
          longitude: lng || prev.longitude,
        }));

        if (postalCode) {
          toast.success(`Found Pincode ${postalCode} (${city || state})`);
        } else {
          toast.success(`Found coordinates: ${lat}, ${lng}. Please enter 6-digit pincode.`);
        }
      } else {
        toast.error('Could not find location. Try entering full city or locality name.');
      }
    });
  };

  // Save Service Area (Create / Update)
  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.pincode || areaForm.pincode.trim().length < 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    try {
      setSavingArea(true);
      const payload = {
        pincode: areaForm.pincode.trim(),
        city: areaForm.city.trim() || undefined,
        state: areaForm.state.trim() || undefined,
        latitude: areaForm.latitude ? Number(areaForm.latitude) : null,
        longitude: areaForm.longitude ? Number(areaForm.longitude) : null,
        isActive: areaForm.isActive,
      };

      if (editingArea) {
        await serviceAreaService.update(editingArea.id, payload);
        toast.success(`Pincode ${payload.pincode} updated`);
      } else {
        await serviceAreaService.create(payload);
        toast.success(`Pincode ${payload.pincode} added to service areas`);
      }

      setAreaModalOpen(false);
      setEditingArea(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.details || 'Failed to save service area');
    } finally {
      setSavingArea(false);
    }
  };

  // Open Partner Geofencing Edit
  const handleOpenGeofenceModal = (partner: PathologyPartner) => {
    setEditingPartner(partner);
    setGeofenceForm({
      serviceRadiusKm: partner.serviceRadiusKm ?? 3,
      latitude: partner.latitude != null ? String(partner.latitude) : '',
      longitude: partner.longitude != null ? String(partner.longitude) : '',
      preferredServiceArea: partner.preferredServiceArea || '',
    });
    setGeofenceModalOpen(true);
  };

  // Save Partner Geofencing
  const handleSavePartnerGeofencing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    try {
      setSavingGeofence(true);
      const payload = {
        serviceRadiusKm: Number(geofenceForm.serviceRadiusKm) || 3,
        latitude: geofenceForm.latitude ? Number(geofenceForm.latitude) : null,
        longitude: geofenceForm.longitude ? Number(geofenceForm.longitude) : null,
        preferredServiceArea: geofenceForm.preferredServiceArea || null,
      };

      await serviceAreaService.updatePartnerGeofencing(editingPartner.id, payload);
      toast.success(`Geofencing updated for ${editingPartner.labName}`);
      setGeofenceModalOpen(false);
      setEditingPartner(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update partner geofencing');
    } finally {
      setSavingGeofence(false);
    }
  };

  // Quick Save from Map Drawer
  const handleSaveMapPartnerRadius = async () => {
    if (!selectedMapPartner) return;
    try {
      setSavingMapGeofence(true);
      await serviceAreaService.updatePartnerGeofencing(selectedMapPartner.id, {
        serviceRadiusKm: selectedRadiusSlider,
      });
      toast.success(`Radius updated to ${selectedRadiusSlider} km for ${selectedMapPartner.labName}`);

      setPartners(prev =>
        prev.map(p =>
          p.id === selectedMapPartner.id ? { ...p, serviceRadiusKm: selectedRadiusSlider } : p
        )
      );

      // Update circle visually
      renderMapOverlays();
    } catch {
      toast.error('Failed to update radius');
    } finally {
      setSavingMapGeofence(false);
    }
  };

  // Filtered pincodes
  const filteredAreas = serviceAreas.filter(item => {
    const matchesSearch =
      item.pincode.includes(searchTerm) ||
      (item.city && item.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.state && item.state.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && item.isActive) ||
      (statusFilter === 'inactive' && !item.isActive);

    return matchesSearch && matchesStatus;
  });

  // Filtered partners
  const filteredPartners = partners.filter(p => {
    return (
      p.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.user?.name && p.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.pincode && p.pincode.includes(searchTerm))
    );
  });

  // Stats
  const activePincodesCount = serviceAreas.filter(a => a.isActive).length;
  const geofencedPartnersCount = partners.filter(p => p.latitude != null && p.longitude != null).length;
  const avgRadius = partners.length > 0
    ? (partners.reduce((sum, p) => sum + (p.serviceRadiusKm ?? 3), 0) / partners.length).toFixed(1)
    : '3.0';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Service Areas & Geofencing</h1>
              <p className="text-sm text-gray-500">
                Configure real-time service coverage, serviceable pincodes, and lab partner delivery radius (km).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFromBranches}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync from Branches'}
          </button>

          <button
            onClick={() => {
              setEditingArea(null);
              setPlaceQuery('');
              setAreaForm({
                pincode: '',
                city: '',
                state: 'Uttar Pradesh',
                latitude: '',
                longitude: '',
                isActive: true,
              });
              setAreaModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Service Area
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Pincodes</span>
            <Globe className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{serviceAreas.length}</div>
          <p className="text-xs text-gray-500 mt-1">{activePincodesCount} active for home collection</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Coverage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activePincodesCount}</div>
          <p className="text-xs text-gray-500 mt-1">Live customer serviceable zones</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Geofenced Labs</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{geofencedPartnersCount} / {partners.length}</div>
          <p className="text-xs text-gray-500 mt-1">Calibrated GPS coordinates</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Service Radius</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{avgRadius} km</div>
          <p className="text-xs text-gray-500 mt-1">Auto-dispatch radius per partner</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('pincodes')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2',
              activeTab === 'pincodes'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Globe className="w-4 h-4" />
            Serviceable Pincodes ({serviceAreas.length})
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2',
              activeTab === 'partners'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Sliders className="w-4 h-4" />
            Lab Partner Geofencing ({partners.length})
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2',
              activeTab === 'map'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <MapPin className="w-4 h-4" />
            Interactive Geofence Map
          </button>
        </nav>
      </div>

      {/* TAB 1: PINCODES */}
      {activeTab === 'pincodes' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pincode, city, or state..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Pincode</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                      Loading service areas...
                    </td>
                  </tr>
                ) : filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No serviceable pincodes found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">{item.pincode}</td>
                      <td className="py-3 px-4 text-gray-700">{item.city || '—'}</td>
                      <td className="py-3 px-4 text-gray-500">{item.state || '—'}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {item.latitude != null && item.longitude != null ? (
                          <span className="text-sky-600">
                            {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAreaStatus(item)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-[11px] transition',
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                          )}
                        >
                          {item.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-gray-400" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingArea(item);
                              setAreaForm({
                                pincode: item.pincode,
                                city: item.city || '',
                                state: item.state || 'Uttar Pradesh',
                                latitude: item.latitude != null ? String(item.latitude) : '',
                                longitude: item.longitude != null ? String(item.longitude) : '',
                                isActive: item.isActive,
                              });
                              setAreaModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArea(item.id, item.pincode)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LAB PARTNERS GEOFENCING */}
      {activeTab === 'partners' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header & Search */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner, lab name, or city..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="text-xs text-gray-500">
              Showing {filteredPartners.length} Pathology & Channel Partners
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Lab / Center Name</th>
                  <th className="py-3 px-4">Contact / Owner</th>
                  <th className="py-3 px-4">City & Pincode</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Service Radius (Geofence)</th>
                  <th className="py-3 px-4">Preferred Locality</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                      Loading partners...
                    </td>
                  </tr>
                ) : filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No pathology partners found.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map(p => {
                    const hasCoords = p.latitude != null && p.longitude != null;
                    const radius = p.serviceRadiusKm ?? 3;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{p.labName}</div>
                          <div className="text-[11px] text-gray-500 truncate max-w-xs">{p.address || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <div>{p.user?.name || 'Partner Owner'}</div>
                          <div className="text-gray-400 font-mono text-[11px]">{p.user?.mobile || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>{p.city || '—'}</div>
                          <div className="text-gray-400 font-mono text-[11px]">{p.pincode || '—'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {hasCoords ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                              GPS Missing
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200">
                            <Navigation className="w-3.5 h-3.5 text-sky-600" />
                            {radius} km
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                          {p.preferredServiceArea || <span className="text-gray-400 italic">Entire Radius</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenGeofenceModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-sky-500 hover:bg-sky-50 text-sky-700 font-semibold text-xs transition"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Edit Geofence
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE GEOFENCE MAP */}
      {activeTab === 'map' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
          {/* Map Top Bar */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 z-10">
            <form onSubmit={handleMapSearch} className="flex items-center gap-2 w-full md:w-96">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search real-time Google Map location..."
                  value={mapSearchText}
                  onChange={e => setMapSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                <span>Lab Partner (Circle = Geofence Radius)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Active Service Area Pincode</span>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-[650px] w-full">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Hint Overlay */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-gray-200 text-xs text-gray-600 max-w-sm pointer-events-none">
              <p className="font-semibold text-gray-800 flex items-center gap-1 mb-0.5">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                Tip: Click anywhere on the map to add a new service area pin.
              </p>
              <p>Click on any lab marker or circle to adjust their live geofence radius.</p>
            </div>

            {/* Selected Partner Drawer */}
            {selectedMapPartner && (
              <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 p-4 space-y-3 z-20">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                      Selected Partner
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm">{selectedMapPartner.labName}</h3>
                    <p className="text-xs text-gray-500">{selectedMapPartner.city || 'City not set'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMapPartner(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contact:</span>
                    <span className="font-medium text-gray-800">{selectedMapPartner.user?.mobile || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GPS:</span>
                    <span className="font-mono text-gray-700">
                      {Number(selectedMapPartner.latitude).toFixed(4)}, {Number(selectedMapPartner.longitude).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Radius Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Service Radius:</span>
                    <span className="font-bold text-sky-600 text-sm">{selectedRadiusSlider} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="35"
                    step="0.5"
                    value={selectedRadiusSlider}
                    onChange={e => setSelectedRadiusSlider(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1 km</span>
                    <span>15 km</span>
                    <span>35 km</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveMapPartnerRadius}
                  disabled={savingMapGeofence}
                  className="w-full py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingMapGeofence ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Geofence Radius'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SERVICE AREA PINCODE */}
      {areaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                {editingArea ? 'Edit Service Area' : 'Add Service Area (Pincode)'}
              </h2>
              <button
                onClick={() => setAreaModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Google Maps Location Search to Auto-Fill */}
            <div className="bg-sky-50/80 border-b border-sky-100 p-3.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-600 shrink-0" />
              <input
                type="text"
                placeholder="Google Maps: search locality/area to auto-fill..."
                value={placeQuery}
                onChange={e => setPlaceQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchPlaceForModal();
                  }
                }}
                className="flex-1 bg-white border border-sky-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleSearchPlaceForModal}
                disabled={searchingPlace || !placeQuery.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-sm"
              >
                {searchingPlace ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Auto-Fill'}
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 211001"
                  value={areaForm.pincode}
                  onChange={e => setAreaForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Prayagraj"
                    value={areaForm.city}
                    onChange={e => setAreaForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Uttar Pradesh"
                    value={areaForm.state}
                    onChange={e => setAreaForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 25.4358"
                    value={areaForm.latitude}
                    onChange={e => setAreaForm(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 81.8463"
                    value={areaForm.longitude}
                    onChange={e => setAreaForm(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="areaActiveCheckbox"
                  checked={areaForm.isActive}
                  onChange={e => setAreaForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <label htmlFor="areaActiveCheckbox" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Activate home collection service for this pincode
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAreaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingArea}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingArea ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Service Area'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PARTNER GEOFENCING */}
      {geofenceModalOpen && editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Partner Geofencing & Radius</h2>
                <p className="text-xs text-gray-500">{editingPartner.labName}</p>
              </div>
              <button
                onClick={() => setGeofenceModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartnerGeofencing} className="p-6 space-y-4">
              {/* Radius Control */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-sky-600" />
                    Service Radius (km)
                  </label>
                  <span className="text-base font-black text-sky-700">{geofenceForm.serviceRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={geofenceForm.serviceRadiusKm}
                  onChange={e => setGeofenceForm(prev => ({ ...prev, serviceRadiusKm: Number(e.target.value) }))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-sky-700">
                  <span>1 km (Hyperlocal)</span>
                  <span>15 km (Standard City)</span>
                  <span>50 km (Regional)</span>
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed pt-1">
                  Bookings placed within this radius will be automatically routed and assigned to this pathology partner / phlebotomist.
                </p>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Base Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 25.4358"
                    value={geofenceForm.latitude}
                    onChange={e => setGeofenceForm(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Base Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 81.8463"
                    value={geofenceForm.longitude}
                    onChange={e => setGeofenceForm(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Preferred Locality */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Service Area / Locality Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Civil Lines, Katra, Georgetown"
                  value={geofenceForm.preferredServiceArea}
                  onChange={e => setGeofenceForm(prev => ({ ...prev, preferredServiceArea: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setGeofenceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGeofence}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingGeofence ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Geofence Settings'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceAreasPage;
