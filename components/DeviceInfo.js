import { StyleSheet, Text, View ,ActivityIndicator} from "react-native";
import React, { useEffect, useState } from "react";
import * as Device from "expo-device"; // expo-device kütüphanesi import ediliyor

const DeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    // Get device info
    // setDeviceInfo
    const fetchDeviceInfo = async () => {
      try {
        const info = {
          deviceName: Device.deviceName,
          brand: Device.brand,
          manufacturer: Device.manufacturer,
          modelName: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
        };
        setDeviceInfo(info);
      } catch (error) {
        console.error("Cihaz bilgileri alınırken hata oluştu:", error);
      }
    };
    fetchDeviceInfo();
  }, []);
  if (!deviceInfo) {
    // Eğer cihaz bilgileri henüz yüklenmediyse bir yükleniyor göstergesi göster
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading device info...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cihaz Bilgileri</Text>
      <Text style={styles.info}>Device Name: {deviceInfo.deviceName}</Text>
      <Text style={styles.info}>Brand: {deviceInfo.brand}</Text>
      <Text style={styles.info}>Manufacturer: {deviceInfo.manufacturer}</Text>
      <Text style={styles.info}>Model Name: {deviceInfo.modelName}</Text>
      <Text style={styles.info}>Operating System: {deviceInfo.osName}</Text>
      <Text style={styles.info}>OS Version: {deviceInfo.osVersion}</Text>
    </View>
  );
};

export default DeviceInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginVertical: 5,
  },
});