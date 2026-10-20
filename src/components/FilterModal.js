import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LOCATIONS } from "../config/locations";
import { EMPTY_FILTER, parsePrice } from "../utils/filter";

// Sheet to filter the swipe stack by campus and price range.
// It starts from the active filter; mount it with a new key each time it opens.
export default function FilterModal({ visible, filter, onApply, onClose }) {
  const [locations, setLocations] = useState(filter.locations);
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() ?? "");

  const toggleLocation = (location) => {
    setLocations((current) =>
      current.includes(location)
        ? current.filter((l) => l !== location)
        : [...current, location]
    );
  };

  const handleApply = () => {
    const min = minPrice.trim() ? parsePrice(minPrice) : null;
    const max = maxPrice.trim() ? parsePrice(maxPrice) : null;

    if (min !== null && max !== null && min > max) {
      Alert.alert("Check the price", "The minimum price is higher than the maximum price.");
      return;
    }

    onApply({ locations, minPrice: min, maxPrice: max });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.heading}>Filter</Text>

          <Text style={styles.label}>LOCATION</Text>
          <Text style={styles.hint}>Nothing selected shows all campuses.</Text>
          <View style={styles.chips}>
            {LOCATIONS.map((location) => {
              const selected = locations.includes(location);
              return (
                <Pressable
                  key={location}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleLocation(location)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{location}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>PRICE</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Min €"
              placeholderTextColor="#888"
              keyboardType="decimal-pad"
            />
            <Text style={styles.priceDash}>–</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max €"
              placeholderTextColor="#888"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => onApply(EMPTY_FILTER)}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.applyButton]} onPress={handleApply}>
              <Text style={[styles.buttonText, styles.applyButtonText]}>Show results</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const GREEN = "#5B8B5E";
const LIGHT_GREEN = "#E6F0B8";
const TEAL = "#00C8B3";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GREEN,
  },

  content: {
    padding: 20,
    paddingTop: 30,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 25,
  },

  label: {
    color: LIGHT_GREEN,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 10,
  },

  hint: {
    color: "#FFFFFF",
    opacity: 0.8,
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 10,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },

  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: LIGHT_GREEN,
  },

  chipSelected: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },

  chipText: {
    color: LIGHT_GREEN,
    fontSize: 15,
    fontWeight: "600",
  },

  chipTextSelected: {
    color: "#FFFFFF",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    color: "#000",
  },

  priceInput: {
    flex: 1,
  },

  priceDash: {
    color: "#FFFFFF",
    fontSize: 20,
    marginHorizontal: 10,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },

  button: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    width: "47%",
    alignItems: "center",
  },

  buttonText: {
    color: GREEN,
    fontWeight: "bold",
    fontSize: 16,
  },

  applyButton: {
    backgroundColor: TEAL,
  },

  applyButtonText: {
    color: "#FFFFFF",
  },
});
