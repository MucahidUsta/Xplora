import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../firebase/config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const CommentsTab = ({navigation}) => {
  const [comments, setComments] = useState([]);
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    const commentsRef = collection(db, 'users', currentUser.uid, 'comments');
    const commentsQuery = query(commentsRef);

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const loadedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(loadedComments);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const navigateToComment = (senderId) => {
    navigation.navigate('Yorumlar', { recipientId: senderId });
  };
  const renderComment = ({ item }) => (

    <View style={styles.commentContainer}>
            <TouchableOpacity onPress={() => navigateToComment(item.id)}>
      <Text style={styles.commentUser}>{item.username}</Text>
      <Text style={styles.commentText}>{item.text}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  commentContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  commentUser: {
    fontWeight: 'bold',
  },
  commentText: {
    color: '#555',
  },
});

export default CommentsTab;
