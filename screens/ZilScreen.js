import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import AntDesign from "@expo/vector-icons/AntDesign";

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const userNameCache = {}; // Kullanıcı adları için önbellek

  // Kullanıcı adını çekmek için fonksiyon
  const getUserName = async (uid) => {
    if (userNameCache[uid]) return userNameCache[uid];

    try {
      if (!uid) return 'Anonim Kullanıcı';
      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const username = userSnap.data().username || 'Anonim Kullanıcı';
        userNameCache[uid] = username; // Önbelleğe kaydet
        return username;
      } else {
        return 'Anonim Kullanıcı';
      }
    } catch (error) {
      console.error('Kullanıcı adı alınırken hata:', error);
      return 'Anonim Kullanıcı';
    }
  };

  useEffect(() => {
    if (user?.uid) {
      const db = getDatabase();
      const notificationsRef = ref(db, `users/${user.uid}/notifications`);

      onValue(notificationsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const notificationsArray = await Promise.all(
            Object.keys(data).map(async (key) => {
              const notification = { id: key, ...data[key] };
              notification.senderName = await getUserName(notification.senderId); // Kullanıcı adını ekle
              return notification;
            })
          );
          setNotifications(notificationsArray.reverse());
        } else {
          setNotifications([]); // Veri yoksa boş liste yap
        }
      });
    }
  }, [user]);

  const markAsRead = (notificationId) => {
    const db = getDatabase();
    const notificationRef = ref(db, `users/${user.uid}/notifications/${notificationId}`);
    update(notificationRef, { read: true })
      .then(() => {
        console.log("Bildirim okundu olarak işaretlendi.");
      })
      .catch((error) => {
        console.error("Okundu işareti eklenirken hata:", error);
      });
  };

  const deleteNotification = (notificationId) => {
    const db = getDatabase();
    const notificationRef = ref(db, `users/${user.uid}/notifications/${notificationId}`);
    remove(notificationRef)
      .then(() => {
        console.log("Bildirim silindi.");
      })
      .catch((error) => {
        console.error("Bildirim silinirken hata:", error);
      });
  };

  const clearAllNotifications = () => {
    const db = getDatabase();
    const notificationsRef = ref(db, `users/${user.uid}/notifications`);
    remove(notificationsRef)
      .then(() => {
        console.log("Tüm bildirimler silindi.");
      })
      .catch((error) => {
        console.error("Tüm bildirimler silinirken hata:", error);
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <AntDesign name="arrowleft" size={24} color="white" style={{ marginTop: "15%" }} />
      </TouchableOpacity>
      <View>
        <Text style={{ marginLeft: "38%", color: "white", marginTop: "5%", fontSize: 20 }}>Bildirimler</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.notification, item.read ? styles.read : styles.unread]}>
            <Text style={styles.title}>{item.senderName}: {item.message}</Text>
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
            {!item.read && (
              <TouchableOpacity
                style={styles.markAsReadButton}
                onPress={() => markAsRead(item.id)}
              >
                <Text style={styles.markAsReadButtonText}>Okundu</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteNotification(item.id)}
            >
              <Text style={styles.deleteButtonText}>Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {notifications.length > 0 && (
        <TouchableOpacity style={styles.clearAllButton} onPress={clearAllNotifications}>
          <Text style={styles.clearAllButtonText}>Tüm Bildirimleri Sil</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F14',
    padding: 20,
  },
  notification: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 5,
    marginTop: "15%",
  },
  unread: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF4500',
  },
  read: {
    borderLeftWidth: 5,
    borderLeftColor: 'gray',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
  },
  timestamp: {
    color: 'gray',
    marginTop: 5,
  },
  markAsReadButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  markAsReadButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  clearAllButton: {
    backgroundColor: '#FF4500',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  clearAllButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default NotificationScreen;
