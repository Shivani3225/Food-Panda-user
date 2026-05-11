import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

const RatingDrawerModal = ({ visible, onClose, onSubmit, restaurant }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState("");

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => setRating(star)}>
        <Icon
          name={star <= rating ? "star" : "star-outline"}
          size={32}
          color={star <= rating ? "#FFC107" : "#D3D3D3"}
          style={{ marginHorizontal: 4 }}
        />
      </TouchableOpacity>
    ));
  };

  // Get translated restaurant name
  const restaurantName = restaurant?.nameKey 
    ? t(restaurant.nameKey, restaurant?.name || t('rating.restaurant', 'Restaurant'))
    : restaurant?.name || t('rating.restaurant', 'Restaurant');

  // Get translated cuisine text (if cuisines array exists)
  const getCuisineText = () => {
    if (!restaurant?.cuisines || restaurant.cuisines.length === 0) {
      return t('rating.italian_fast_food', 'Pizza, Italian, Fast Food');
    }
    
    const translatedCuisines = restaurant.cuisines.map(cuisine => {
      if (typeof cuisine === 'string') {
        // Try to translate cuisine if it has a translation key
        const cuisineKey = `categories.${cuisine.toLowerCase()}`;
        return t(cuisineKey, cuisine);
      }
      return cuisine;
    });
    
    return translatedCuisines.join(', ');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.drawer}>
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="close" size={20} color="#000" />
          </TouchableOpacity>

          
          <Image
            source={
              restaurant?.image 
                ? { uri: restaurant.image }
                : { uri: "https://via.placeholder.com/100" }
            }
            style={styles.image}
          />

          
          <Text style={styles.title}>{restaurantName}</Text>
          <Text style={styles.subtitle}>{getCuisineText()}</Text>

         
          <View style={styles.starRow}>{renderStars()}</View>

          
          <TextInput
            placeholder={t('rating.add_message', 'Add Message')}
            style={styles.input}
            multiline
            value={message}
            onChangeText={setMessage}
          />

          
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => onSubmit({ rating, message })}
          >
            <Text style={styles.submitText}>{t('rating.submit', 'Submit')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default RatingDrawerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#F1F1F1",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 15,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});