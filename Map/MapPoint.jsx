import { StyleSheet, Text, View,ActivityIndicator } from 'react-native'
import React,{useEffect, useState} from 'react'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'

const MapPoint = () => {

  const[location, setLocation] = useState(null);
  const[loading, setLoading] = useState(true);

  useEffect(() => {
    (async()=>{
      let {status} = await Location.requestForegroundPermissionsAsync();
      if(status !== 'granted'){
        console.log('Permission denied');
        setLoading(false);
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude, 
        longitude: currentLocation.coords.longitude,
        latitudeDelta:0.01,
        longitudeDelta:0.01,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : location ? (
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true} // Kullanıcı konumunu otomatik göster
        >
          {/* Kullanıcının konumu için bir marker ekleyin */}
          <Marker
            coordinate={location}
            title="Şu Anki Konumunuz"
            description="Bu sizin bulunduğunuz konumdur."
          />
        </MapView>
      ) : (
        <Text>Konum bulunamadı.</Text>
      )}
    </View>
  )
}

export default MapPoint

const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: "90%",
      height:"90%",
    },
    map: {
      flex: 1,
    },
  });