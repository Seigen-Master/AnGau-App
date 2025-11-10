'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const libraries: ('places')[] = ['places'];

interface LatLng {
  lat: number;
  lng: number;
}

interface PatientMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  patientAddress: string; // Full address string for display
  patientName: string;
  patientLocation: LatLng | null; // Precise patient location (lat, lng)
  caregiverLocation: LatLng | null;
  onDistanceUpdate: (scheduleId: string, distanceInMeters: number | null) => void;
}

export default function PatientMapDialog({ isOpen, onClose, scheduleId, patientAddress, patientName, patientLocation, caregiverLocation, onDistanceUpdate }: PatientMapDialogProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false); 

  // Effect to calculate directions and update distance
  useEffect(() => {
    // console.log(`[PatientMapDialog] Effect triggered. isOpen: ${isOpen}, isLoaded: ${isLoaded}, patientLoc: ${patientLocation?.lat}, caregiverLoc: ${caregiverLocation?.lat}`);

    if (!isOpen) {
        // When dialog closes, reset internal states but DO NOT reset distance in parent
        // The parent (DailySchedule) should retain the last valid distance.
        setDirections(null);
        setDistanceText(null);
        setIsLoadingDirections(false);
        // onDistanceUpdate(scheduleId, null); // REMOVED THIS LINE
        return;
    }

    if (isLoaded && patientLocation && caregiverLocation) {
      setIsLoadingDirections(true);
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: new google.maps.LatLng(caregiverLocation.lat, caregiverLocation.lng),
          destination: new google.maps.LatLng(patientLocation.lat, patientLocation.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          // console.log(`[PatientMapDialog] DirectionsService result for ${scheduleId}: Status ${status}`);
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (result.routes[0] && result.routes[0].legs[0]) {
              const distanceValue = result.routes[0].legs[0].distance?.value || null;
              setDistanceText(result.routes[0].legs[0].distance?.text || null);
              onDistanceUpdate(scheduleId, distanceValue);
              // console.log(`[PatientMapDialog] Distance found: ${distanceValue}`);
            } else {
              // No legs found, consider distance null/undetermined
              setDistanceText(null);
              onDistanceUpdate(scheduleId, null);
              // console.log(`[PatientMapDialog] No route legs found, distance null`);
            }
          } else {
            // Error fetching directions
            console.error(`Error fetching directions for ${scheduleId}: ${status}`);
            setDirections(null);
            setDistanceText(null);
            onDistanceUpdate(scheduleId, null);
            // console.log(`[PatientMapDialog] Directions error, distance null`);
          }
          setIsLoadingDirections(false);
        }
      );
    } else if (isOpen && isLoaded && (!patientLocation || !caregiverLocation)) {
        // If dialog is open, Google Maps API is loaded, but locations are missing, notify parent about null distance
        // This handles cases where geolocation might fail after dialog opens or patient data is missing coords.
        // console.log(`[PatientMapDialog] Locations missing, setting distance to null`);
        setDirections(null);
        setDistanceText(null);
        onDistanceUpdate(scheduleId, null);
        setIsLoadingDirections(false);
    } else if (isOpen && !isLoaded) {
        // console.log(`[PatientMapDialog] Map not loaded, waiting...`);
        // Still loading Google Maps API, or something else. Distance will be null for now.
        setDistanceText(null);
        onDistanceUpdate(scheduleId, null);
    }
  }, [isLoaded, isOpen, patientLocation, caregiverLocation, onDistanceUpdate, scheduleId]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Effect to adjust map bounds (separate for clarity and re-renders)
  useEffect(() => {
    if (isLoaded && mapRef.current && isOpen) {
      const bounds = new google.maps.LatLngBounds();
      let markersPresent = 0;

      if (patientLocation) {
        bounds.extend(new google.maps.LatLng(patientLocation.lat, patientLocation.lng));
        markersPresent++;
      }
      if (caregiverLocation) {
        bounds.extend(new google.maps.LatLng(caregiverLocation.lat, caregiverLocation.lng));
        markersPresent++;
      }

      if (markersPresent > 0) {
        if (markersPresent === 1 && (patientLocation || caregiverLocation)) {
            mapRef.current.setCenter(patientLocation || caregiverLocation!); 
            mapRef.current.setZoom(15);
        } else if (markersPresent > 1) {
            mapRef.current.fitBounds(bounds);
        }
      }
    }
  }, [isLoaded, isOpen, patientLocation, caregiverLocation]);

  if (loadError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Map Error</DialogTitle>
            <DialogDescription>
              Failed to load Google Maps: {loadError.message}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Centralized loading state for the map area
  const showMapLoading = (!isLoaded && !loadError) || isLoadingDirections || (isOpen && (!patientLocation || !caregiverLocation));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Location for {patientName}</DialogTitle>
          <DialogDescription>
            {patientAddress}
            {showMapLoading && <><br /><Loader2 className="inline mr-2 h-4 w-4 animate-spin" />Calculating distance...</>}
            {distanceText && !showMapLoading && <><br /><span className="font-semibold">Distance:</span> {distanceText}</>}
          </DialogDescription>
        </DialogHeader>
        <div className="relative" style={containerStyle}>
          {showMapLoading ? (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>{!isLoaded ? "Loading Google Maps..." : "Finding route and distance..."}</p>
              {(!patientLocation || !caregiverLocation) && !isLoadingDirections && <p className="text-sm text-muted-foreground mt-1">Awaiting location data...</p>}
            </div>
          ) : (
            isLoaded && (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={patientLocation || caregiverLocation || { lat: 0, lng: 0 }} 
                zoom={patientLocation || caregiverLocation ? 15 : 2} 
                onLoad={onMapLoad}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'YOUR_MAP_ID_HERE'} 
              >
                {patientLocation && (
                  <Marker 
                    position={patientLocation}
                    label={{
                      text: patientName,
                      fontWeight: 'bold',
                    }}
                  />
                )}
                {caregiverLocation && (
                  <Marker 
                    position={caregiverLocation}
                    label={{
                      text: 'You Are Here',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: '#4285F4',
                      fillOpacity: 1,
                      strokeWeight: 0,
                      scale: 10,
                    }}
                  />
                )}
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}