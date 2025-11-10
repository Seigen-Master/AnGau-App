// src/components/admin/LiveCaregiverMap.tsx

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api'; // Added DirectionsRenderer
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Address } from '@/types';
import { calculateDistance } from '@/lib/geolocation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const libraries: ('places')[] = ['places'];

interface LiveCaregiverMapProps {
  caregiverId: string;
  patientAddress: Address;
}

export default function LiveCaregiverMap({
  caregiverId,
  patientAddress,
}: LiveCaregiverMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const { toast } = useToast();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [caregiverLocation, setCaregiverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [patientLatLng, setPatientLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null); // State for directions

  // Convert patient address to LatLng once
  useEffect(() => {
    if (patientAddress.lat && patientAddress.lng) {
      setPatientLatLng({ lat: patientAddress.lat, lng: patientAddress.lng });
    } else {
      console.warn("Patient address missing lat/lng, attempting geocoding (not implemented).");
      toast({
        title: "Map Error",
        description: "Patient address coordinates are missing.",
        variant: "destructive"
      });
    }
  }, [patientAddress, toast]);

  // Listen for real-time caregiver location updates
  useEffect(() => {
    if (!caregiverId) return;

    const docRef = doc(db, 'caregiverLocations', caregiverId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCaregiverLocation({ lat: data.lat, lng: data.lng });
      } else {
        console.log("Caregiver location document does not exist for ID:", caregiverId);
        setCaregiverLocation(null);
      }
    }, (error) => {
      console.error("Error listening to caregiver location:", error);
      toast({
        title: "Live Tracking Error",
        description: `Failed to get live location for caregiver: ${(error as Error).message}`,
        variant: "destructive"
      });
      setCaregiverLocation(null);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [caregiverId, toast]);

  // Calculate distance whenever caregiver or patient location changes
  useEffect(() => {
    if (caregiverLocation && patientLatLng) {
      const dist = calculateDistance(
        caregiverLocation.lat,
        caregiverLocation.lng,
        patientLatLng.lat,
        patientLatLng.lng
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [caregiverLocation, patientLatLng]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Adjust map bounds to fit both markers and calculate directions
  useEffect(() => {
    if (map && isLoaded) { // Check isLoaded here for google.maps access
      const bounds = new google.maps.LatLngBounds();
      let markersPresent = 0;

      if (patientLatLng) {
        bounds.extend(patientLatLng);
        markersPresent++;
      }
      if (caregiverLocation) {
        bounds.extend(caregiverLocation);
        markersPresent++;
      }

      if (markersPresent > 0) {
        if (markersPresent === 1 && (patientLatLng || caregiverLocation)) {
            map.setCenter(patientLatLng || caregiverLocation!); // Set center to the single marker
            map.setZoom(15);
        } else if (markersPresent > 1) {
            map.fitBounds(bounds);
            // If the zoom is too high after fitBounds for very close markers, adjust it.
            const listener = google.maps.event.addListener(map, 'bounds_changed', function() {
                if (this.getZoom() > 18) {
                  this.setZoom(18); // Max zoom for close points
                }
                google.maps.event.removeListener(listener); // Remove listener after first adjustment
            });
        }
      }

      // Calculate and display directions
      if (caregiverLocation && patientLatLng) {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: new google.maps.LatLng(caregiverLocation.lat, caregiverLocation.lng),
            destination: new google.maps.LatLng(patientLatLng.lat, patientLatLng.lng),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              setDirections(result);
            } else {
              console.error(`Error fetching directions: ${status}`);
              setDirections(null);
            }
          }
        );
      } else {
        setDirections(null); // Clear directions if either location is missing
      }
    }
  }, [map, isLoaded, caregiverLocation, patientLatLng]); // Added isLoaded to dependencies

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div className="flex flex-1 items-center justify-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading Map...</div>;

  const center = caregiverLocation || patientLatLng || { lat: 34.052235, lng: -118.243683 }; // Default to LA if no data

  return (
    <div className="w-full h-full relative">
      {caregiverLocation && patientLatLng && distance !== null && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-md z-10 text-sm">
          Distance: {distance.toFixed(2)} meters
        </div>
      )}
      <GoogleMap
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'YOUR_MAP_ID_HERE'} // Use your actual Map ID
        mapContainerStyle={containerStyle}
        center={center}
        zoom={caregiverLocation && patientLatLng ? undefined : 10} 
        onLoad={onMapLoad}
      >
        {caregiverLocation && (
          <Marker
            position={caregiverLocation}
            label={{
              text: "Caregiver",
              className: "map-label-caregiver", 
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#10B981", 
              fillOpacity: 0.9,
              strokeWeight: 0,
              scale: 8,
            }}
          />
        )}

        {patientLatLng && (
          <Marker
            position={patientLatLng}
            label={{
              text: "Patient",
              className: "map-label-patient", 
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#EF4444", 
              fillOpacity: 0.9,
              strokeWeight: 0,
              scale: 8,
            }}
          />
        )}

        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  );
}
