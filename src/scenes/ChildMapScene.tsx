import React, { useState, useEffect, useRef, createRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { useSelector, useDispatch } from 'react-redux';
import { Appbar, Menu, Divider, Dialog, Paragraph, Portal, Snackbar, Button as PaperButton, FAB } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, View, Text, Dimensions, TextInput as VanillaTextInput } from 'react-native';
import MapView, { Marker, Polyline, LatLng, EdgePadding, Circle } from 'react-native-maps';
import * as timeago from 'timeago.js';
import {
    PlainBackground,
    TextInput,
    Button
} from '../components';
import { formatDate } from '../utils/formatters';
import { User, Navigation } from '../types';
import { childDelete } from '../actions';
import { colors, theme } from '../styles';

type Props = {
    navigation: Navigation;
    route: any
};

type MarkerType = {
    coordinate: Coords
    title: string,
    description: string
    id: string
};

type Coords = {
    latitude: number,
    longitude: number
};

type Geofence = {
    latitude: number,
    longitude: number,
    radius: number,
    name: string,
    geofence_id?: number
}

type DateSelection = "real-time" | Date;

const ChildMap = ({ route, navigation }: Props) => {
    const { user_id } = route.params;
    const child = useSelector((state: any) => state.childReducer.children.find((child: User) => child.user_id === user_id));

    const [dateSelection, setDateSelection] = useState<DateSelection>("real-time");
    const [lastSeen, setLastSeen] = useState("unavailable");
    const [markers, setMarkers] = useState<MarkerType[]>([]);
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [dateMenuVisible, setDateMenuVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    const [addingGeofence, setAddingGeofence] = useState(false);
    const [geofenceRadius, setGeofenceRadius] = useState(150);
    const [geofenceCoords, setGeofenceCoords] = useState<Coords>();
    const [geofenceName, setGeofenceName] = useState("New");

    const mapRef = useRef<MapView>(null);

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);
    const openDateMenu = () => setDateMenuVisible(true);
    const closeDateMenu = () => setDateMenuVisible(false);
    const showDialog = () => setDeleteDialogVisible(true);
    const hideDialog = () => setDeleteDialogVisible(false);

    const dispatch = useDispatch()
    const _childDelete = (child: User) => dispatch(childDelete(child));

    const recenterMap = () => {
        if (mapRef.current && markers.length) {
            // list of _id's must same that has been provided to the identifier props of the Marker
            mapRef.current?.fitToSuppliedMarkers(markers.map(({ id }) => id), {
                edgePadding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            });
        } else {
            mapRef.current?.animateToRegion({
                latitude: 7.2906,
                longitude: 80.6337,
                latitudeDelta: 2.5,
                longitudeDelta: 2.5,
            });
        }
    }

    useEffect(() => {
        mapRef.current?.fitToSuppliedMarkers(markers.map(({ id }) => id), {
            edgePadding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        });

        const geofenceMarker = markers.find(marker => marker.id === "new-geofence");
        if (geofenceMarker) {
            setGeofenceCoords(geofenceMarker.coordinate)
        } else {
            setGeofenceCoords(undefined);
        };
    }, [markers]);

    useEffect(() => {
        fetchData();
    }, [dateSelection]);

    const fetchData = async () => {
        const token = await SecureStore.getItemAsync("token");

        let { status } = await Location.requestPermissionsAsync();
        if (status !== 'granted') return setErrorMessage('Permission to access location was denied');

        if (dateSelection === "real-time") {
            try {
                const request = fetch(
                    `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/location/${user_id}`,
                    {
                        method: "GET",
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                    }
                );

                const response = await request;
                if (response.ok) {
                    const object = await response.json();

                    const objectDate = new Date(object.timestamp);
                    const objectLocation: Coords = {
                        latitude: parseFloat(object.latitude),
                        longitude: parseFloat(object.longitude)
                    };
                    const objectAddress = await Location.reverseGeocodeAsync(objectLocation);

                    setLastSeen(timeago.format(objectDate));
                    setMarkers([{
                        coordinate: objectLocation,
                        title: `${objectAddress[0].name}, ${objectAddress[0].street}, ${objectAddress[0].city} (${timeago.format(objectDate)})`,
                        description: `${objectDate.toDateString()} at ${objectDate.toLocaleTimeString()}`,
                        id: object.timestamp + object.longitude + object.latitude
                    }]);
                } else {
                    setMarkers([]);
                    setErrorMessage("No location data available at the moment. Make sure you setup the Guardian application on your child's mobile device.");
                    setErrorVisible(true);
                };
            } catch (err) {
                setMarkers([]);
                console.warn(err);
            };
        } else {
            try {
                const request = fetch(
                    `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/location/${user_id}/history/${formatDate(dateSelection)}`,
                    {
                        method: "GET",
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                    }
                );

                const response = await request;
                if (response.ok) {
                    const data: any[] = await response.json();

                    setMarkers(data.map((object: any) => {
                        const objectDate = new Date(object.timestamp);
                        return {
                            coordinate: {
                                latitude: parseFloat(object.latitude),
                                longitude: parseFloat(object.longitude)
                            },
                            title: objectDate.toDateString(),
                            description: `${objectDate.toLocaleTimeString()} (${timeago.format(objectDate)})`,
                            id: object.timestamp + object.longitude + object.latitude
                        };
                    }));
                } else {
                    setMarkers([]);
                    setErrorMessage("No location data available for the selected date. Make sure you setup the Guardian application on your child's mobile device.");
                    setErrorVisible(true);
                };
            } catch (err) {
                setMarkers([]);
                console.warn(err);
            };
        };

        // Geo-fences
        const request = fetch(
            `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/geofence/${user_id}`,
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
            }
        );
        const response = await request;
        if (response.ok) {
            const data: any[] = await response.json();
            setGeofences(data.map((object: any) => {
                return {
                    latitude: parseFloat(object.latitude),
                    longitude: parseFloat(object.longitude),
                    radius: object.radius,
                    name: object.name
                };
            }));
        } else {
            console.warn("Unable to fetch geofences!");
        }
    };

    const todayDate = new Date();
    const dateSelectionMenuItems = [];
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date();
        currentDate.setDate(todayDate.getDate() - i);

        dateSelectionMenuItems.push(
            <Menu.Item
                onPress={() => {
                    setDateSelection(currentDate);
                    setDateMenuVisible(false);
                    setAddingGeofence(false);
                }}
                title={
                    i === 0
                        ? `Today (${currentDate.toDateString()})`
                        : i === 1
                            ? `Yesterday (${currentDate.toDateString()})`
                            : `${currentDate.toDateString()}`
                }
                key={currentDate.toString()}
            />
        );
    };

    return (
        <>
            <Portal>
                <Dialog visible={deleteDialogVisible} onDismiss={hideDialog}>
                    <Dialog.Title>Confirmation</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Do you really want to remove this child? All location data will be deleted permanently.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <PaperButton onPress={() => {
                            hideDialog();
                        }}>Cancel</PaperButton>
                        <PaperButton onPress={() => {
                            _childDelete(child);
                            hideDialog();
                            navigation.goBack();
                        }}>OK</PaperButton>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Appbar.Header>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title={`${child && child.first_name || ''} ${child && child.last_name || ''}`} />
                <Menu
                    visible={menuVisible}
                    onDismiss={closeMenu}
                    anchor={<Appbar.Action icon="dots-vertical" color="white" onPress={openMenu} />
                    }>
                    <Menu.Item onPress={() => {
                        navigation.navigate("EditChildScene", { user_id: child.user_id })
                        closeMenu();
                    }} title="Edit" />
                    <Menu.Item onPress={() => {
                        showDialog();
                        closeMenu();
                    }} title="Remove" />
                </Menu>
            </Appbar.Header>
            {addingGeofence &&
                <View>
                    <View style={styles.topContainer}>
                        <View style={{ flex: 256 }}>
                            <Text>Radius</Text>
                            <Text style={{ fontWeight: "bold", fontSize: 24 }}>{geofenceRadius}m</Text>
                        </View>
                        <View style={{ flex: 256 }}>
                            <Text>Name</Text>
                            <VanillaTextInput style={{ fontSize: 24 }} onChangeText={(text => setGeofenceName(text))}>{geofenceName}</VanillaTextInput>
                        </View>
                        <PaperButton style={styles.radiusAdjustButtonStyle} labelStyle={styles.text} onPress={() => setGeofenceRadius((currentRadius) => currentRadius + 150)}>+</PaperButton>
                        <PaperButton disabled={geofenceRadius === 150} style={styles.radiusAdjustButtonStyle} labelStyle={styles.text} onPress={() => setGeofenceRadius((currentRadius) => currentRadius - 150)}>-</PaperButton>
                    </View>
                    <Button onPress={async () => {
                        if (geofenceCoords && geofenceName) {
                            try {
                                const token = await SecureStore.getItemAsync("token");
                                const request = fetch(
                                    `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/geofence/${user_id}`,
                                    {
                                        method: "POST",
                                        body: JSON.stringify({
                                            longitude: geofenceCoords.longitude,
                                            latitude: geofenceCoords?.latitude,
                                            radius: geofenceRadius,
                                            name: geofenceName
                                        }),
                                        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                                    }
                                );

                                const response = await request;
                                if (!response.ok) console.warn(await response.text());
                                else await fetchData();
                            } catch (err) {
                                console.warn(err);
                            };

                            // Discard new geofence details
                            setMarkers([...markers.filter(marker => marker.id !== "new-geofence")]);
                            setGeofenceRadius(150);
                            setGeofenceCoords(undefined);
                            setAddingGeofence(false);
                        } else {
                            setErrorMessage("You need to provide an identifier for this geofence!");
                            setErrorVisible(true);
                        };
                    }}>Add Geofence</Button>
                </View>
            }

            <PlainBackground>
                <MapView
                    ref={mapRef}
                    style={styles.mapStyle}
                    initialRegion={{
                        latitude: 7.2906,
                        longitude: 80.6337,
                        latitudeDelta: 2.5,
                        longitudeDelta: 2.5,
                    }}>
                    {markers.map((marker) => {
                        return (
                            <Marker
                                key={marker.id}
                                identifier={marker.id}
                                coordinate={marker.coordinate}
                                title={marker.title}
                                description={marker.description}
                                pinColor={marker.id === "new-geofence" ? "purple" : "red"}
                            />
                        )
                    })}

                    <Polyline
                        coordinates={
                            markers.filter(marker => marker.id !== "new-geofence").map(marker => ({
                                latitude: marker.coordinate.latitude,
                                longitude: marker.coordinate.longitude
                            }))
                        }
                        strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
                        strokeColors={[
                            '#7F0000',
                            '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
                            '#B24112',
                            '#E5845C',
                            '#238C23',
                            '#7F0000'
                        ]}
                        strokeWidth={6}
                    />

                    {geofenceCoords &&
                        <Circle
                            center={geofenceCoords}
                            radius={geofenceRadius}
                            fillColor="rgba(127,0,127, 0.4)"
                        />
                    }

                    {geofences.map(geofence => {
                        const { longitude, latitude, radius, geofence_id } = geofence;
                        return (
                            <Circle
                                center={{ longitude, latitude }}
                                radius={radius}
                                fillColor="rgba(127,0,127, 0.4)"
                                key={geofence_id}
                            />
                        );
                    })}

                </MapView>

                <Appbar style={styles.bottom}>
                    <Appbar.Content
                        title={dateSelection === "real-time"
                            ? "Real-time"
                            : dateSelection.getUTCDate() === (new Date()).getUTCDate()
                                ? "Today"
                                : dateSelection.getUTCDate() == (new Date(Date.now() - 864e5)).getUTCDate()
                                    ? "Yesterday"
                                    : dateSelection.toISOString().split('T')[0]}
                        subtitle={`Last seen ${lastSeen}`}
                    />

                    <Menu
                        visible={dateMenuVisible}
                        onDismiss={closeDateMenu}
                        anchor={<Button onPress={openDateMenu}>Show menu</Button>}>
                        <Menu.Item onPress={() => {
                            setDateSelection("real-time");
                            setDateMenuVisible(false);
                            setAddingGeofence(false);
                        }} title="Real-time" />
                        <Divider />
                        {dateSelectionMenuItems}
                    </Menu>

                    <Appbar.Action icon="clock" onPress={openDateMenu} />
                </Appbar>

                <Snackbar
                    visible={errorVisible}
                    onDismiss={() => setErrorVisible(false)}
                    action={{
                        label: 'OK',
                        onPress: () => setErrorVisible(false)
                    }}>
                    {errorMessage}
                </Snackbar>

                <FAB
                    style={styles.fab_top}
                    icon="crosshairs-gps"
                    onPress={recenterMap}
                />
                <FAB
                    style={styles.fab_bottom}
                    icon={addingGeofence ? "arrow-left" : "plus"}
                    label={addingGeofence ? "Cancel" : "Geofence"}
                    onPress={async () => {
                        if (!addingGeofence) {
                            const camera = await mapRef.current?.getCamera();
                            const longitude = camera?.center.longitude;
                            const latitude = camera?.center.latitude;

                            if (longitude && latitude) {
                                setAddingGeofence(true);
                                setMarkers([...markers, {
                                    coordinate: { longitude, latitude },
                                    title: "New Geofence",
                                    description: `Adjust the radius.`,
                                    id: "new-geofence",
                                }]);
                            };
                        } else {
                            setMarkers([...markers.filter(marker => marker.id !== "new-geofence")]);
                            setGeofenceRadius(150);
                            setGeofenceCoords(undefined);
                            setAddingGeofence(false);
                        }
                    }}
                />
            </PlainBackground>

            <StatusBar style="light" />
        </>
    );
};

const styles = StyleSheet.create({
    fab_top: {
        position: 'absolute',
        margin: 36,
        right: 0,
        bottom: 48,
        backgroundColor: colors.light
    },
    fab_bottom: {
        position: 'absolute',
        margin: 36,
        right: 0,
        bottom: 120,
        backgroundColor: colors.light
    },
    mapStyle: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    bottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    topContainer: {
        padding: 16,
        fontSize: 36,
        flexDirection: "row"
    },
    text: {
        fontWeight: 'bold',
        fontSize: 15,
        lineHeight: 26,
    },
    radiusAdjustButtonStyle: {
        backgroundColor: theme.colors.surface,
        flex: 1,
        margin: 4
    }
});

export default ChildMap;