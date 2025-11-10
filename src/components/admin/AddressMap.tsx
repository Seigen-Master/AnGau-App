// src/components/admin/AddressMap.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Label } from '@/components/ui/label';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const libraries: ('places')[] = ['places'];

interface AddressMapProps {
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
  initialAddress?: string;
}

export default function AddressMap({ onLocationChange, initialAddress }: AddressMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>({ lat: 36.7783, lng: -119.4179 }); // Default to Central California
  const inputRef = useRef<HTMLInputElement | null>(null); // Ref for the native input element
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // Ref for the Autocomplete instance

  useEffect(() => {
    // When initialAddress changes, update the native input element directly.
    if (inputRef.current && initialAddress) {
      inputRef.current.value = initialAddress;
    }
  }, [initialAddress]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newPos }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onLocationChange({ ...newPos, address: results[0].formatted_address });
          if (inputRef.current) {
            inputRef.current.value = results[0].formatted_address; // Update native input on drag
          }
        } else {
          console.error("Geocoder failed due to: " + status);
          onLocationChange({ ...newPos, address: `Address at ${newPos.lat.toFixed(3)}, ${newPos.lng.toFixed(3)}` });
          if (inputRef.current) {
            inputRef.current.value = `Address at ${newPos.lat.toFixed(3)}, ${newPos.lng.toFixed(3)}`; // Fallback
          }
        }
      });
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      console.log("onPlaceChanged fired. Place object:", place); // Debugging: Check the full place object

      // If place is null/undefined, or missing geometry, try to geocode the current input value
      if (!place || !place.geometry || !place.geometry.location) {
        console.warn("Autocomplete getPlace() returned incomplete or no place object. Attempting to geocode current input value.", place);
        const currentInputValue = inputRef.current?.value || '';

        if (currentInputValue) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: currentInputValue }, (results, status) => {
            console.log("Fallback Geocoder results for input value:", results, "Status:", status);
            if (status === 'OK' && results && results[0]) {
              const newPos = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
              setMarkerPosition(newPos);
              if (map) {
                map.panTo(newPos);
                map.setZoom(15);
              }
              onLocationChange({ ...newPos, address: results[0].formatted_address });
              // Input value is already correct as it's what was geocoded from
            } else {
              console.error("Fallback Geocoder failed to find location for input value: " + currentInputValue + " Status: " + status);
              onLocationChange({ lat: 0, lng: 0, address: currentInputValue });
            }
          });
        } else {
          // Input is also empty, clear everything
          onLocationChange({ lat: 0, lng: 0, address: '' });
          if (inputRef.current) inputRef.current.value = '';
        }
        return; // Exit here as we've handled the incomplete/missing place
      }

      // Original logic for when place is valid and has geometry
      const location = place.geometry.location;
      const newPos = { lat: location.lat(), lng: location.lng() };
      setMarkerPosition(newPos);
      if (map) {
        map.panTo(newPos);
        map.setZoom(15);
      }
      onLocationChange({ ...newPos, address: place.formatted_address || '' });
      // Autocomplete manages the input value on successful selection
    }
  };

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocompleteInstance;
    autocompleteInstance.setFields(["geometry", "formatted_address"]);
    autocompleteInstance.setTypes(["address"]); 
    autocompleteInstance.setComponentRestrictions({ country: ["us"] }); 
    
    if (inputRef.current && initialAddress) {
      inputRef.current.value = initialAddress;
    }
  }, [initialAddress]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div>
      <Label htmlFor="address-search">Search for an address</Label>
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
      >
        <input 
          id="address-search" 
          type="text" 
          placeholder="Start typing an address..." 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-4"
          ref={inputRef} 
        />
      </Autocomplete>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={10}
        onLoad={onMapLoad}
      >
        <Marker
          position={markerPosition}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>
    </div>
  );
}
