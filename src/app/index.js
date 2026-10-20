import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, Image, Animated, PanResponder, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UploadModal from "../components/UploadModal";
import { usePosts } from "../context/PostsContext";

export default function Index() {
    const [showModal, setShowModal] = useState(true);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const { myPosts, addPost } = usePosts();
    const insets = useSafeAreaInsets();

    const defaultProducts = [
        {
            id: 1,
            title: "Mountain Bike",
            price: "€150",
            location: "Hameenlinna",
            image: require("../../assets/images/bike.png"),
        },
        {
            id: 2,
            title: "Office Chair",
            price: "€49",
            location: "Tampere",
            image: require("../../assets/images/officeChair.png"),
        },
        {
            id: 3,
            title: "Study Desk",
            price: "€95",
            location: "Helsinki",
            image: require("../../assets/images/studyDesk.png"),
        },
        {
            id: 4,
            title: "Vintage Lamp",
            price: "€40",
            location: "Valkeakoski",
            image: require("../../assets/images/vintageLamp.png"),
        },
        {
            id: 5,
            title: "Microwave",
            price: "€35",
            location: "Evo",
            image: require("../../assets/images/microwave.png"),
        },
        {
            id: 6,
            title: "Fan",
            price: "€25.50",
            location: "Tampere",
            image: require("../../assets/images/fan.png"),
        },
        {
            id: 7,
            title: "Dress",
            price: "€19",
            location: "Evo",
            image: require("../../assets/images/dress.png"),
        },
        {
            id: 8,
            title: "Batman Costume",
            price: "€35",
            location: "Hameenlinna",
            image: require("../../assets/images/batmanCostume.png"),
        },
        {
            id: 9,
            title: "Flashlight",
            price: "€16.50",
            location: "Valkeakoski",
            image: require("../../assets/images/flashlight.png"),
        },
        {
            id: 10,
            title: "Sofa",
            price: "€70",
            location: "Forssa",
            image: require("../../assets/images/sofa.png"),
        },
        {
            id: 11,
            title: "Blender",
            price: "€20",
            location: "Riihimäki",
            image: require("../../assets/images/blender.png"),
        },
        {
            id: 12,
            title: "Teddy Bear",
            price: "€25",
            location: "Valkeakoski",
            image: require("../../assets/images/teddyBear.png"),
        },
        {
            id: 13,
            title: "Cowboy Boots",
            price: "€37",
            location: "Riihimäki",
            image: require("../../assets/images/cowboyBoots.png"),
        },
        {
            id: 14,
            title: "Analog Camera",
            price: "€88",
            location: "Mustiala",
            image: require("../../assets/images/analogCamera.png"),
        },
        {
            id: 15,
            title: "Friger",
            price: "€47",
            location: "Evo",
            image: require("../../assets/images/friger.png"),
        },

    ];

    // Own uploads go to the end of the stack (oldest first), so a new upload shows up as the next card.
    const uploadedProducts = [...myPosts].reverse().map((post) => ({
        ...post,
        image: { uri: post.image },
    }));

    const products = [...defaultProducts, ...uploadedProducts];

    const [currentIndex, setCurrentIndex] = useState(0);

    const pan = useRef(new Animated.ValueXY()).current;

    const rotation = pan.x.interpolate({
      inputRange: [-200, 0, 200],
      outputRange: ["-15deg", "0deg", "15deg"],
      extrapolate: "clamp",
    });

    const nextProduct = () => {
        //if (currentIndex < products.length - 1) {
            setCurrentIndex(currentIndex + 1);
    };

    /*const handleLike = () => {
        console.log("Liked:", products[currentIndex].title);
        nextProduct();
    };

    const handleDislike = () => {
        console.log("Disliked:", products[currentIndex].title);
        nextProduct();
    };*/

    const handleLike = () => {
      swipeCard(1);
    };

    const handleDislike = () => {
      swipeCard(-1);
    };

    const panResponder = useRef(
      PanResponder.create({
        // Only grab horizontal drags, the card moves on the x axis only.
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),

        onPanResponderMove: Animated.event(
          [null, { dx: pan.x }],
          { useNativeDriver: false }
        ),

        onPanResponderRelease: (_, gestureState) => {
          console.log("DX:", gestureState.dx);
          if (gestureState.dx > 150) {
            swipeCard(1); // LIKE
          } else if (gestureState.dx < -150) {
            swipeCard(-1); // DISLIKE
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
        },
      })
    ).current;

    const swipeCard = (direction) => {
      Animated.timing(pan, {
        toValue: {
          x: direction * 500,
          y: 0,
        },
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        setCurrentIndex((prev) => prev + 1);
      });
    };

    return(
        <View style={styles.container}>
            {!showModal && (
                <View style={styles.homeContainer}>
                    <View style={[styles.topBar, { top: insets.top + 10 }]}>
                        <Text style={styles.logo}>ReSwipe</Text>

                        <TouchableOpacity style={styles.plusButton} onPress={() => setShowUpload(true)}>
                            <Text style={styles.plusText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {currentIndex < products.length ? (
                        <>
                            <Animated.View
                              {...panResponder.panHandlers}
                              style={[
                                styles.card,
                                {
                                  transform: [
                                    { translateX: pan.x },
                                    { rotate: rotation },
                                  ],
                                },
                              ]}
                            >
                                <Image
                                    source={products[currentIndex].image}
                                    style={styles.productImage}
                                />

                                <Text style={styles.productTitle}>
                                    {products[currentIndex].title}
                                </Text>

                                <Text style={styles.price}>
                                    {products[currentIndex].price}
                                </Text>

                                {products[currentIndex].location && (
                                    <Text style={styles.location}>
                                        {products[currentIndex].location}
                                    </Text>
                                )}
                            </Animated.View>

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
                        </>
                    ) : (
                        <View style={styles.finishedContainer}>
                            <Text style={styles.finishedTitle}>
                                No more products available!
                            </Text>

                            <Text style={styles.finishedText}>
                                You have reviewed all available products.
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <UploadModal
                visible={showUpload}
                onClose={() => setShowUpload(false)}
                onUpload={addPost}
            />

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
            color: "#00C8B3",
        },

        topBar: {
            position: "absolute",
            left: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
        },

        plusButton: {
            position: "absolute",
            right: 20,
            padding: 5,
        },

        plusText: {
            fontSize: 36,
            color: "#E6F0B8",
            lineHeight: 38,
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

        finishedContainer: {
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
        },

        finishedTitle: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#FFF",
            textAlign: "center",
            marginBottom: 10,
        },

        finishedText: {
            fontSize: 16,
            color: "#FFF",
            textAlign: "center",
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

        productImage: {
          width: "100%",
          height: 250,
          borderRadius: 10,
        },

        price: {
            fontSize: 20,
            marginHorizontal: 15,
            marginTop: 5,
            marginBottom: 15,
        },

        location: {
            fontSize: 16,
            marginHorizontal: 15,
            marginBottom: 15,
            marginTop: -10,
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