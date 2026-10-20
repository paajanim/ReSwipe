import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View, TouchableOpacity, Image, Animated, PanResponder, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import AuthModal from "../components/AuthModal";
import FilterModal from "../components/FilterModal";
import UploadModal from "../components/UploadModal";
import { imageUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostsContext";
import { LinearGradient } from "expo-linear-gradient";
import { EMPTY_FILTER, isFilterActive, matchesFilter } from "../utils/filter";

export default function Index() {
    const [showUpload, setShowUpload] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    // New key on every open, so the filter sheet starts from the active filter.
    const [filterKey, setFilterKey] = useState(0);
    const [filter, setFilter] = useState(EMPTY_FILTER);
    const { user, restoring } = useAuth();
    const { posts, loading, error, loadPosts, addPost, likePost } = usePosts();
    // Own posts are not shown in the swipe stack (they are in the profile).
    const products = posts.filter(
        (post) => post.username !== user?.username && matchesFilter(post, filter)
    );
    const filterActive = isFilterActive(filter);
    const insets = useSafeAreaInsets();

    const [currentIndex, setCurrentIndex] = useState(0);

    // Created once and kept for the whole screen (state instead of a ref, so it can be used while rendering).
    const [pan] = useState(() => new Animated.ValueXY());

    const rotation = pan.x.interpolate({
      inputRange: [-200, 0, 200],
      outputRange: ["-15deg", "0deg", "15deg"],
      extrapolate: "clamp",
    });

    const likeScale = pan.x.interpolate({
      inputRange: [0, 150],
      outputRange: [1, 1.4],
      extrapolate: "clamp",
    });

    const dislikeScale = pan.x.interpolate({
      inputRange: [-150, 0],
      outputRange: [1.4, 1],
      extrapolate: "clamp",
    });

    const likeOpacity = pan.x.interpolate({
      inputRange: [0, 150],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const dislikeOpacity = pan.x.interpolate({
      inputRange: [-150, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    const handleLike = () => {
      swipeCard(1);
    };

    const handleDislike = () => {
      swipeCard(-1);
    };

    const currentProduct = products[currentIndex];

    // Re-created for every card, so a swipe always likes the card that is shown.
    const panResponder = useMemo(() =>
      PanResponder.create({
        // Only grab horizontal drags, the card moves on the x axis only.
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),

        onPanResponderMove: Animated.event(
          [null, { dx: pan.x }],
          { useNativeDriver: false }
        ),

        onPanResponderRelease: (_, gestureState) => {
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
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [currentProduct]
    );

    const swipeCard = (direction) => {
      // Like = chat with the seller is created on the server (nothing happens for own posts).
      if (direction === 1 && currentProduct) {
        likePost(currentProduct.id).catch((e) => Alert.alert("Like failed", e.message));
      }

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

    const reload = async () => {
        await loadPosts();
        setCurrentIndex(0);
    };

    const openFilter = () => {
        setFilterKey((key) => key + 1);
        setShowFilter(true);
    };

    // A new filter starts the stack from the beginning.
    const applyFilter = (newFilter) => {
        setFilter(newFilter);
        setCurrentIndex(0);
        setShowFilter(false);
    };

    return(
        <View style={styles.container}>
            {user && (
                <View style={styles.homeContainer}>
                    <View style={[styles.topBar, { top: insets.top + 10 }]}>
                        <TouchableOpacity style={styles.filterButton} onPress={openFilter} hitSlop={8}>
                            <SymbolView
                                name={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }}
                                tintColor="#E6F0B8"
                                size={28}
                            />
                            {filterActive && <View style={styles.filterDot} />}
                        </TouchableOpacity>

                        <Text style={styles.logo}>ReSwipe</Text>

                        <TouchableOpacity style={styles.plusButton} onPress={() => setShowUpload(true)}>
                            <Text style={styles.plusText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    ) : error ? (
                        <View style={styles.finishedContainer}>
                            <Text style={styles.finishedTitle}>Could not load products</Text>
                            <Text style={styles.finishedText}>{error}</Text>
                            <TouchableOpacity style={styles.reloadButton} onPress={reload}>
                                <Text style={styles.buttonText}>Try again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : currentProduct ? (
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

                            <Animated.View
                              pointerEvents="none"
                              style={[
                                styles.likeGradient,
                                { opacity: likeOpacity },
                              ]}
                            >
                              <LinearGradient
                                  colors={["transparent", "rgba(0,255,0,0.9)"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={StyleSheet.absoluteFill}
                              />
                            </Animated.View>

                            <Animated.View
                              pointerEvents="none"
                              style={[
                                styles.dislikeGradient,
                                { opacity: dislikeOpacity },
                              ]}
                            >
                              <LinearGradient
                                colors={["rgba(255,0,0,0.8)", "transparent"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                              />
                            </Animated.View>

                                <Image
                                    source={{ uri: imageUrl(currentProduct.image) }}
                                    style={styles.productImage}
                                />

                                <Text style={styles.productTitle}>
                                    {currentProduct.title}
                                </Text>

                                <Text style={styles.price}>
                                    {currentProduct.price}
                                </Text>

                                {currentProduct.location && (
                                    <Text style={styles.location}>
                                        {currentProduct.location}
                                    </Text>
                                )}
                            </Animated.View>

                            <View style={styles.actions}>
                              <Animated.View
                                style={{
                                  transform: [{ scale: dislikeScale }],
                                }}
                              >
                                <TouchableOpacity
                                  style={styles.dislikeButton}
                                  onPress={handleDislike}
                                >
                                  <Text style={styles.actionText}>❌</Text>
                                </TouchableOpacity>
                              </Animated.View>

                              <Animated.View
                                style={{
                                  transform: [{ scale: likeScale }],
                                }}
                              >
                                <TouchableOpacity
                                  style={styles.likeButton}
                                  onPress={handleLike}
                                >
                                  <Text style={styles.actionText}>❤️</Text>
                                </TouchableOpacity>
                              </Animated.View>
                            </View>

                        </>
                    ) : filterActive && products.length === 0 ? (
                        <View style={styles.finishedContainer}>
                            <Text style={styles.finishedTitle}>
                                No products match your filter
                            </Text>

                            <Text style={styles.finishedText}>
                                Try other campuses or a wider price range.
                            </Text>

                            <TouchableOpacity style={styles.reloadButton} onPress={() => applyFilter(EMPTY_FILTER)}>
                                <Text style={styles.buttonText}>Reset filter</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.finishedContainer}>
                            <Text style={styles.finishedTitle}>
                                No more products available!
                            </Text>

                            <Text style={styles.finishedText}>
                                You have reviewed all available products.
                            </Text>

                            <TouchableOpacity style={styles.reloadButton} onPress={reload}>
                                <Text style={styles.buttonText}>Reload</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <UploadModal
                visible={showUpload}
                onClose={() => setShowUpload(false)}
                onUpload={addPost}
            />

            <FilterModal
                key={filterKey}
                visible={showFilter}
                filter={filter}
                onApply={applyFilter}
                onClose={() => setShowFilter(false)}
            />

            <AuthModal visible={!restoring && !user} onLoggedIn={() => setCurrentIndex(0)} />
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

        filterButton: {
            position: "absolute",
            left: 20,
            padding: 5,
        },

        // Shows that a filter is active
        filterDot: {
            position: "absolute",
            top: 2,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#00C8B3",
            borderWidth: 1.5,
            borderColor: "#5B8B5E",
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

        buttonText: {
            color: "#5B8B5E",
            fontWeight: "bold",
        },

        reloadButton: {
            backgroundColor: "#ffffff",
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 10,
            marginTop: 20,
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

        likeGradient: {
          position: "absolute",
          top: 0,
          right: 0,
          width: "100%",
          height: "100%",
          zIndex: 5,
        },

        dislikeGradient: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 5,
        },
    });
