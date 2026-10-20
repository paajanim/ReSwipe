import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";

// Field that opens a list of options right below it.
// value: the selected option or null
export default function Dropdown({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);

  const select = (option) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable style={[styles.field, open && styles.fieldOpen]} onPress={() => setOpen(!open)}>
        <Text style={value ? styles.value : styles.placeholder}>{value ?? placeholder}</Text>
        <SymbolView
          name={{
            ios: open ? "chevron.up" : "chevron.down",
            android: open ? "expand_less" : "expand_more",
            web: open ? "expand_less" : "expand_more",
          }}
          tintColor={GREEN}
          size={18}
        />
      </Pressable>

      {open && (
        <View style={styles.list}>
          {options.map((option, index) => (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.option,
                index < options.length - 1 && styles.optionBorder,
                pressed && styles.optionPressed,
              ]}
              onPress={() => select(option)}
            >
              <Text style={[styles.optionText, option === value && styles.optionTextSelected]}>
                {option}
              </Text>
              {option === value && (
                <SymbolView name={{ ios: "checkmark", android: "check", web: "check" }} tintColor={TEAL} size={16} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const GREEN = "#5B8B5E";
const TEAL = "#00C8B3";

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  fieldOpen: {
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingVertical: 10.5,
    paddingHorizontal: 18.5,
  },

  value: {
    fontSize: 16,
    color: "#000000",
  },

  placeholder: {
    fontSize: 16,
    color: "#888888",
  },

  list: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 6,
    overflow: "hidden",
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 20,
  },

  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
  },

  optionPressed: {
    backgroundColor: "#F0F5EE",
  },

  optionText: {
    fontSize: 16,
    color: "#1F2D20",
  },

  optionTextSelected: {
    color: GREEN,
    fontWeight: "bold",
  },
});
