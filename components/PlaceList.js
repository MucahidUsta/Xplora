import React from 'react';
import { FlatList, View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';

const PlaceList = ({ places, loading, loadMore }) => (
  <FlatList
    data={places}
    keyExtractor={(item, index) => `${item.name}-${index}`}
    renderItem={({ item }) => (
      <View style={styles.item}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    )}
    onEndReached={loadMore}
    onEndReachedThreshold={0.5}
    ListFooterComponent={loading && <ActivityIndicator size="large" color="white" />}
  />
);

const styles = StyleSheet.create({
  item: {
    marginBottom: 20,
  },
  image: {
    width: '30%',
    height: 200,
    borderRadius: 10,
  },
  name: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  description: {
    color: 'gray',
  },
});

export default PlaceList;
