import React, { useState } from "react";
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from "react-native";

export default function Index() {
    const [showModal, setShowModal] = useState(true);
    const [isSignUp, setIsSignUp] = useState(false);

    const products = [
        {
            id: 1,
            title: "Mountain Bike",
            price: "€150",
            location: "Hameenlinna",
        },
        {
            id: 2,
            title: "Office Chair",
            price: "€35",
            location: "Tampere",
        },
        {
            id: 3,
            title: "Study Desk",
            price: "€50",
            location: "Helsinki",
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextProduct = () => {
        if (currentIndex < products.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleLike = () => {
        console.log("Liked:", products[currentIndex].title);
        nextProduct();
    };

    const handleDislike = () => {
        console.log("Disliked:", products[currentIndex].title);
        nextProduct();
    };

    return(
        <View style={styles.container}>
            {!showModal && (
                <View style={styles.homeContainer}>
                    <Text style={styles.logo}>ReSwipe</Text>

                    <View style={styles.card}>
                        <View style={styles.imagePlaceholder}>
                            <Text style={{ fontSize: 20 }}>
                                Product Image
                            </Text>
                        </View>

                        <Text style={styles.productTitle}>
                            {products[currentIndex].title}
                        </Text>

                        <Text style={styles.price}>
                            {products[currentIndex].price}
                        </Text>

                        <Text style={styles.location}>
                            {products[currentIndex].location}
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.dislikeButton}
                            onPress={handleDislike}
                        >
                            <Text style={styles.actionText}>❌</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.likeButton}
                            onPress={handleLike}
                        >
                            <Text style={styles.actionText}>❤️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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

        homeContainer: {
            flex: 1,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
        },

        card: {
            width: "85%",
            backgroundColor: "#FFF",
            borderRadius: 20,
            overflow: "hidden",
            marginTop: 20,
        },

        imagePlaceholder: {
            height: 300,
            backgroundColor: "#EAEAEA",
            justifyContent: "center",
            alignItems: "center",
        },

        productTitle: {
            fontSize: 24,
            fontWeight: "bold",
            marginTop: 10,
            marginHorizontal: 15,
        },

        price: {
            fontSize: 20,
            marginHorizontal: 15,
            marginTop: 5,
        },

        location: {
            fontSize: 16,
            marginHorizontal: 15,
            marginBottom: 15,
            marginTop: 5,
        },

        actions: {
            flexDirection: "row",
            marginTop: 25,
            gap: 40,
        },

        dislikeButton: {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
        },

        likeButton: {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
        },

        actionText: {
            fontSize: 28,
        },
    });