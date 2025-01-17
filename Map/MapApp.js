import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, Alert, Text } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import * as Location from "expo-location";

const App = () => {
  const [currentLocation, setCurrentLocation] = useState(null); // Kullanıcının mevcut konumu
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Polyline için görünen koordinatlar
  const routeCoordinatesRef = useRef([]); // Koordinatları bir referans olarak sakla

  // Konum iznini al ve başlangıç konumunu ayarla
  const initializeLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Konum İzni Gerekli",
          "Uygulama düzgün çalışması için konum iznine ihtiyaç duyar."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setCurrentLocation({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      const initialPoint = { latitude, longitude };
      routeCoordinatesRef.current = [initialPoint]; // Referans dizisini başlat
      setRouteCoordinates([initialPoint]); // State'i güncelle
    } catch (error) {
      console.error("Başlangıç konumu alınamadı:", error);
    }
  }, []);

  // Kullanıcı hareketini izlemek için bir izleyici başlat
  const startTracking = useCallback(async () => {
    try {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Konumu her 1 saniyede bir güncelle
          distanceInterval: 1, // Kullanıcı 1 metre hareket ettiğinde güncelle
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;

          // Referans dizisine yeni koordinat ekle
          routeCoordinatesRef.current.push({ latitude, longitude });

          // Sadece UI'yi güncellemek gerektiğinde state güncelle
          setRouteCoordinates([...routeCoordinatesRef.current]);

          // Mevcut konumu güncelle
          setCurrentLocation({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      );
    } catch (error) {
      console.error("Konum takibi başlatılamadı:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeLocation();
      await startTracking();
    };

    init();

    return () => {
      // Temizlik işlemi yapılabilir
    };
  }, [initializeLocation, startTracking]);

  return (
    <View style={styles.container}>
      {currentLocation ? (
        <MapView
          style={styles.map}
          initialRegion={currentLocation}
          showsUserLocation={true} // Kullanıcı konumunu göster
        >
          {/* Polyline */}
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor="blue"
          />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Konum alınıyor...</Text>
        </View>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "gray",
  },
});