import React, { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import store from "./src/store/store";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import io from "socket.io-client";

// Socket.IO bağlantısı
export const socket = io("http://10.34.12.120:3000");

const App = () => {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Bildirim ayarları
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // Bildirim alındığında alert göster
        shouldPlaySound: true, // Ses çalsın
        shouldSetBadge: true, // Uygulama ikonunda rozet gösterilsin
      }),
    });

    // Push Token kaydı
    registerForPushNotificationsAsync();

    // Gelen bildirimleri dinle
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Bildirim alındı:", notification);
        // Sistem bildirim paneline düşmesini sağlar
      }
    );

    // Bildirime tıklanmayı dinle
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Bildirim yanıtı:", response);
        // Tıklanma sonrası işlem yapılabilir
      }
    );

    // Socket.IO bildirim dinleyici
    socket.on("receiveNotification", async ({ title, body }) => {
      console.log("Socket.IO bildirimi alındı:", { title, body });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
        },
        trigger: null, // Anında bildirim gönderir
      });
    });

    // Cleanup: Dinleyicileri kaldır
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      socket.off("receiveNotification");
    };
  }, []);

  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
};

// Push Token kaydı
async function registerForPushNotificationsAsync() {
  let token;

  // Android için bildirim kanalı oluştur
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Bildirim izni kontrol et ve iste
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      console.log("Bildirim izni reddedildi.");
      return;
    }
  }

  // Push Token al
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);

  return token;
}

export default App;
