import React, { useState } from "react";
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from "react-native";

export default function Index() {
    const [showModal, setShowModal] = useState(true);
    const [isSignUp, setIsSignUp] = useState(false);

    return(
        <View style={styles.container}>
            <Text style={styles.logo}>ReSwipe</Text>

            <Modal visible={showModal} animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        {isSignUp ? (
                            <>
                                <Text style={styles.title}>Create Account</Text>

                                <TextInput placeholder="Username" style={styles.input}/>

                                <TextInput placeholder="Email" style={styles.input}/>

                                <TextInput placeholder="Password" secureTextEntry style={styles.input}/>

                                <View style={styles.buttonContainer}>

                                    <TouchableOpacity style={styles.button} onPress={() => setShowModal(false)} >
                                        <Text style={styles.buttonText}>Login</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.button} onPress={() => setIsSignUp(true)} >
                                        <Text style={styles.buttonText}>Sign Up</Text>
                                    </TouchableOpacity>

                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>Login</Text>

                                <TextInput placeholder="Enter email ou username..." style={styles.input}/>

                                <TextInput placeholder="Enter password..." secureTextEntry style={styles.input}/>

                                <View style={styles.buttonContainer}>

                                    <TouchableOpacity style={styles.button} onPress={() => setShowModal(false)}>
                                        <Text style={styles.buttonText}>Login</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.button} onPress={() => setIsSignUp(true)}>
                                        <Text style={styles.buttonText}>Sign Up</Text>
                                    </TouchableOpacity>

                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

    const styles = StyleSheet.create({

        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#5B8B5E",
        },

        logo: {
            fontSize: 32,
            fontWeight: "bold",
        },

        overlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
        },

        modalContainer: {
            width: "85%",
            backgroundColor: "#5B8B5E",
            borderRadius: 15,
            padding: 20,
        },

        title: {
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
        },

        input: {
            backgroundColor: "#F5F5F5",
            borderRadius: 20,
            paddingVertical: 12,
            paddingHorizontal: 20,
            marginBottom: 15,
            color: "#000",
        },

        button: {
            backgroundColor: "#ffffff",
            padding: 12,
            borderRadius: 10,
            width: "45%",
            alignItems: "center",
        },

        buttonContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 15,
        },

        buttonText: {
            color: "#5B8B5E",
            fontWeight: "bold",
        },

        link: {
            textAlign: "center",
            color: "#007AFF",
            marginTop: 15,
        },
    });